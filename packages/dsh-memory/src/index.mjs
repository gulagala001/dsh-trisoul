// TriSoul 记忆中枢插件（多层记忆 · 自主整理/注入版）
// - 作业：消化 digest（订阅 session/event，按会话攒批；用户「记住/以后都/决定…」立刻消化）/ 整理 curate（中枢自判触发：消化命中已有条目或
//   overlap|conflict 信号 → 本项目分片立刻整理；空闲轮巡 global/cross/每项目分片，片内游标 ≤curateLimit 分多轮；同分片最短间隔防抖；
//   护栏：用户所有条目机器不可退役、global 不可退役/降层、每轮 ops 上限；输入每条附 usage/age/src/版本深度参考信号）
//   / 挑选 pick（recall 与补注共用：状态区快照背景 + 候选 id/层，失败词面降级）/ recall（拉通道工具，含回捞原文）/ 手术备料（预压缩稿 bail 接口）
// - 注入：开场（startup/clear：底层 + 用户手写常驻，其余新→旧补足）/ 任务补注（会话首条用户消息，pre-step 同步并入本步）/
//   主动补注（消化后以 digest 稿挑选，排队到下一 pre-step）/ compact 任务式重注；已注 id 集去重（resume 从转录重建），resume 不开场注入
//   补注换代制（2026-08-21 用户拍板，默认 supplementMode='renew'）：同一会话的任务/主动补注汇成一份全量累计清单——
//   每次有新条目就尾部 append 一版新清单（照抄状态区 P2-2：纯追加零缓存破坏），旧版留在原地降级为直通项、
//   由下一刀手术顺路吞掉（surgeon 剔出纪要原料——旧版是新版子集）；头文案明示「只看最新一条，旧版作废」。
//   'rewrite'（P1-7 旧默认）= 活节点 surfaceOp:{op:'replace'} 原地改写（真机一场 13 次 replace 每次砸整场前缀缓存，A/B 对照用）；
//   'append' = 每批新条目零散新建一条（更旧行为）
// - 持久三件套 + 整理状态：记忆库覆盖链（update=新条目 supersede 旧条目并带 history/reason；retire 只标记；usage 使用痕迹随头条继承）/
//   预压缩稿 digests（按 seq 区间）/ 事件游标 cursor（每会话已消化 seq，重启续传）/ curate:{cursors,lastAt} 分片游标
// - 自检：GET /trisoul/api/memory 的 health 段 = bail trisoul/memory-health（dsh-api state.memoryHealth 转发监控）
// - 三层隔离：global（用户/环境底层事实）· cross（跨项目经验）· project（绑定会话 cwd 所在 git 根，无 git 退回 cwd）；注入/检索/消化都按「本 project + cross + global」过滤
// - 消化输入净化：assistant 只取 text/tool-call 块（reasoning 里的共识旁白绝不进记忆），user 跳过 plugin 注入，tool/result 截断
// - HTTP：/trisoul/api/memory 只读列表 + 用户直接编辑（POST 新增 / PATCH :id 更新 / DELETE :id 退役或 ?hard=1 物理删 / POST :id/restore 恢复），
//   全部走 store 的统一写入口 applyOps(manual, source:'user') 或 restore/hardDelete 并落盘
// 零 dsh 包依赖；持久态只有 storePath 里的 JSON。
import { appendFileSync } from 'node:fs'
import {
  loadStore, persistStore, applyOps, visibleMemories, byTsThenId, formatMemoryLine, formatMemoryLineLegacy, isActive, visibleTo, normalizeCap, CAPS,
  addDigest, lookupDigest, digestedRanges, markCompactable, holdingDigests, getCursor, setCursor, SCOPE_LABEL, SCOPES,
  findById, resolveHead, restoreMemory, hardDeleteMemory, noteUsageAll, emptyUsage, usageSignal,
  projectShard, shardInfo, shardsOf, shardEntries, shardDirty, curateWindow, markCurated, crossCandidates, openingMemories, pinnedMemories,
} from './store.mjs'
import { renderEvent, formatEvents, DIGESTIBLE_TYPES } from './events.mjs'
import { projectKeyOf } from './project.mjs'
import { createEffortResolver } from './effort.mjs'

/** 子代理会话（宿主 subagent 派生，头带 origin:subagent / delegationDepth>0）：记忆中枢让路——不消化、不注入（用户拍板 2026-09-02） */
const isDelegatedSession = (session) => { const h = session?.header; return !!h && (h.origin === 'subagent' || (Number(h.delegationDepth) || 0) > 0) }

export const name = 'trisoul-memory'
/** 空稿占位文本（P1-7）：消化批没有实质内容时仍登记区间（可被画布圈压），lookupDigest 不把它当底稿 */
export const EMPTY_DIGEST_TEXT = '(no substantive content in this span)'
export const inject = ['llm', 'agents', 'tools']  // webServer 走 ctx.inject 作用域注入：无头（CLI/评测容器）没有 webServer 也能装载

// debug 日志默认写 cwd；评测容器等场景用 TRISOUL_DEBUG_DIR 指到别处（免得混进被评测仓库的 git 工作区）
const DBG_PATH = `${process.env.TRISOUL_DEBUG_DIR || '.'}/trisoul-memory.debug.log`
const dbg = (msg) => { try { appendFileSync(DBG_PATH, `${new Date().toISOString()} ${msg}\n`) } catch {} }
/** ⑦ 事件流（09-01）：跳过清单按原因聚合 {reason: count}，digest/curate 报文共用——判重护栏等真机验收不再靠 grep 日志 */
const skipReasonsOf = (skipped) => { const o = {}; for (const s of skipped ?? []) o[s.reason] = (o[s.reason] ?? 0) + 1; return o }

// 宪法瘦身（T2 化，2026-08-26 去向表用户亲审）：system 只留身份 + 记什么/不记什么 + 日期纪律 + 拿不准不记；
// 三层定义迁 OPS_DESC.scope、写入纪律迁 OPS_DESC.ops、条目形态迁 OPS_DESC.text——说明书贴着字段走。
// 「带 why」「绝对日期」两条学自 CC Memory 段（2026-08-26 用户圈定）；Today 行由消化/整理 prompt 提供。
const CONSTITUTION = `You are the agent's memory scribe, maintaining a layered long-term memory store.
Record only stable facts worth remembering across sessions: user-stated preferences / conventions / parameters, settled decisions, lessons from failures — for a lesson, record the why alongside the rule; a lesson without its reason cannot be judged or applied later — and environment quirks. Do not record process details, one-off content, transient state, or progress chatter like "task X is done / in progress". Write dates as absolute dates (resolve "yesterday" / "last week" against the Today line in the request) — relative words are meaningless in a later session. When unsure, don't record — better too few than too many; a span usually yields 0~2 entries.`

// ===== 单源字段说明（T2 化，2026-08-26 去向表用户亲审）=====
// 与共识插件四格 ENVELOPE_DESC 同构：同一段说明按渠道协议双渲染——有锁协议（openai-responses / openai-completions，
// 2026-08-30 起按协议判、不再按渠道名白名单）渲染进 json_schema strict 硬锁的字段 description（说明书贴着字段走，schema 全文每请求随发）；
// 其余协议 / 协议未知渲染回 prompt 尾的散文 Field guide（无锁的网关对 json_schema 静默无视——说明只住 schema
// 会一个字都到不了模型）。语义全部承袭旧 CONSTITUTION/DIGEST_FORMAT，只去重不删义：
// workdoc 模板行与正段、nowCompactable 模板行与正段各合并为一处；写入纪律与旧宪法 Discipline 句合并住 ops。
const OPS_DESC = Object.freeze({
  ops: `The memory operations for this span. Write discipline (hard rule): before emitting ops, check each one against the existing memory table above — anything about the same matter MUST be an update (target = the old entry's id); opening a new add for it is forbidden; add is reserved for facts entirely absent from the table. "Same matter" means the fact itself, not the wording: the same parameter with a new value, the same decision with changed content, the same lesson with added detail — all update the old entry. Sole exception: when genuinely unsure whether two are the same matter, add — duplication is acceptable (the curation job cleans it up), wrongful merging is not (a bad merge loses facts irrecoverably). Retire what's overturned or outdated. Never rewrite existing entries just for nicer wording. If nothing is worth recording, an empty array.`,
  op: `add a new entry / update an existing one (its text is replaced) / retire one`,
  scope: `The memory layer; default project, moving up needs a hard reason. project: this project's conventions, decisions, structure, key paths, pitfalls (e.g. "this project uses pnpm workspace", "the VEHICLES table in core.js") — anything mentioning this project's files / modules / requirements is project. cross: only when the fact does not involve this project at all and holds in any project (behavior of a tool / language / OS itself, e.g. "macOS cat does not support -A"); project experience goes to project first even if it looks general. global: base facts about the user themselves, the machine / accounts / environment (e.g. "user timezone Asia/Shanghai", "no pip on this machine").`,
  key: `short identifier (dotted English, e.g. env.python)`,
  text: `the memory content — one entry states one fact, concise, complete, understandable on its own; written in the language the user writes in (match the existing entries). For retire: put the reason it is retired here (recorded as the entry's retirement reason; leaving it empty loses the audit trail)`,
  target: `for update/retire: the id or key of the existing entry; empty string for add`,
})
const DIGEST_DESC = Object.freeze({
  digest: `a faithful condensed draft of this event span, in English: keep key facts, numbers, file names, commands, and conclusions, 1~5 sentences; empty string if nothing substantive`,
  workdoc: `only when a "current task memo document" was given above: the full rewritten document, in English — its metabolic rewrite: fold the entries under "— new items (to fold in) —" into the body, merge same-topic knowledge into one place, fix what new events overturned, delete what's obsolete or no longer relevant; fine details need not be copied in full (the store has them all, retrievable at any time). Organize only, never invent: add no fact the document doesn't contain. Empty string if no document was given or no change is needed.`,
  compactable: `a signal to the context canvas: whether this batch's original text can now be superseded by the digest above (its substance has been absorbed by the digest and ops, and the model no longer needs the verbatim text to keep working). Fill false when still in use: a file just read that is about to be edited against, an unclosed task, an error just raised and not yet fixed, an intermediate result the model is referencing across steps. When unsure fill true — the original text is never lost and can be retrieved by seq at any time.`,
  nowCompactable: `the re-review: for batches in the "pending re-review" list above (previously marked "original text still in use"), if this batch of new events shows they are done with (file edited, task closed, error fixed, intermediate result landed), list their ids to release them; [] if none`,
  phaseClosed: `whether this batch marks the close of a phase (a chunk of work finished / a conclusion reached / a deliverable written and verified) — if so, all earlier process text can be condensed wholesale; when unsure fill false`,
  overlap: `the existing memories contain duplicate / near-duplicate entries about the same matter (informs the curation job); false when uncertain`,
  conflict: `existing memories contradict each other or the new events (informs the curation job); false when uncertain`,
})
/** 散文路渲染（无锁协议 / 协议未知渠道）：模板骨架 + Field guide，由单源说明拼出 */
const DIGEST_FORMAT = `Output JSON (JSON only):
{"ops":[{"op":"add|update|retire","scope":"global|cross|project","key":"…","text":"…","target":"…"}],
 "digest":"…","workdoc":"…","compactable":true,"nowCompactable":["…"],"phaseClosed":false,"signals":{"overlap":false,"conflict":false}}
Field guide:
- ops: ${OPS_DESC.ops}
- ops[].op: ${OPS_DESC.op}
- ops[].scope: ${OPS_DESC.scope}
- ops[].key: ${OPS_DESC.key}
- ops[].text: ${OPS_DESC.text}
- ops[].target: ${OPS_DESC.target}
- digest: ${DIGEST_DESC.digest}
- workdoc: ${DIGEST_DESC.workdoc}
- compactable: ${DIGEST_DESC.compactable}
- nowCompactable: ${DIGEST_DESC.nowCompactable}
- phaseClosed: ${DIGEST_DESC.phaseClosed}
- signals.overlap: ${DIGEST_DESC.overlap}
- signals.conflict: ${DIGEST_DESC.conflict}`
/** JSON 路渲染（有锁协议渠道）：strict 硬锁——合法 JSON 保证、required 强制全键、越界字段物理拦截 */
const OPS_SCHEMA = Object.freeze({
  type: 'array', description: OPS_DESC.ops,
  items: {
    type: 'object', additionalProperties: false,
    required: ['op', 'scope', 'key', 'text', 'target'],
    properties: {
      op: { type: 'string', enum: ['add', 'update', 'retire'], description: OPS_DESC.op },
      scope: { type: 'string', enum: ['global', 'cross', 'project'], description: OPS_DESC.scope },
      key: { type: 'string', description: OPS_DESC.key },
      text: { type: 'string', description: OPS_DESC.text },
      target: { type: 'string', description: OPS_DESC.target },
    },
  },
})
const DIGEST_SCHEMA = Object.freeze({
  name: 'memory_digest', strict: true,
  schema: {
    type: 'object', additionalProperties: false,
    required: ['ops', 'digest', 'workdoc', 'compactable', 'nowCompactable', 'phaseClosed', 'signals'],
    properties: {
      ops: OPS_SCHEMA,
      digest: { type: 'string', description: DIGEST_DESC.digest },
      workdoc: { type: 'string', description: DIGEST_DESC.workdoc },
      compactable: { type: 'boolean', description: DIGEST_DESC.compactable },
      nowCompactable: { type: 'array', items: { type: 'string' }, description: DIGEST_DESC.nowCompactable },
      phaseClosed: { type: 'boolean', description: DIGEST_DESC.phaseClosed },
      signals: {
        type: 'object', additionalProperties: false, required: ['overlap', 'conflict'],
        properties: {
          overlap: { type: 'boolean', description: DIGEST_DESC.overlap },
          conflict: { type: 'boolean', description: DIGEST_DESC.conflict },
        },
      },
    },
  },
})
const CURATE_SCHEMA = Object.freeze({
  name: 'memory_curate', strict: true,
  schema: { type: 'object', additionalProperties: false, required: ['ops'], properties: { ops: OPS_SCHEMA } },
})

// 整理规则（两条路恒在 prompt——这是作业说明不是字段说明）；尾部格式句只在散文路加，JSON 路由 CURATE_SCHEMA 锁格式
const CURATE_RULES = `You are now doing the curation job: inspect the memory store below and output **as few** ops as possible to correct it (leave alone whatever you can; wording differences are not a problem):
1) duplicate entries about the same matter → use update to merge the information into the one you keep (target = kept entry's id, text = the merged content), retire the rest;
2) clearly outdated, overturned by later facts, or mere one-off task progress / running logs → retire;
3) change scope only when misplaced: base facts about the user themselves / machine environment → global; tool / system behavior that **involves no project at all** and holds in any project → cross; everything else stays project (better to leave it in project than promote to cross);
the bracketed tail of each entry is reference signals [age since first record · updated since last change · injected times injected (last) · recalled recall hits (last) · src origin · v override-chain depth] —
they are reference signals, not thresholds: long-unused does not mean it should retire, freshly written does not mean it should stay, and src user entries were written by the user's own hand — respect them especially; keep / merge / retire is your holistic judgment.
Never rewrite for nicer wording; never split or expand entries. Keep each entry's text in its original language. If nothing is wrong, "ops": [].`
// 散文路也要 Field guide（2026-08-26 M1）：协议未知 / 无锁协议时走散文路，
// 只给裸骨架时 key 格式与 add-vs-update 纪律一个字都到不了模型；scope 判据已在 CURATE_RULES 3) 不重复
const CURATE_FORMAT_TAIL = `Output JSON only: {"ops":[{"op":"add|update|retire","scope":"global|cross|project","key":"…","text":"…","target":"…"}]}
Field guide:
- ops: ${OPS_DESC.ops}
- ops[].op: ${OPS_DESC.op}
- ops[].key: ${OPS_DESC.key}
- ops[].text: ${OPS_DESC.text}
- ops[].target: ${OPS_DESC.target}`

/** 创建记忆中枢并接线；返回句柄供测试驱动（apply 不返回它——cordis 会把非空返回值当 effect 校验）。 */
export function createMemoryHub(ctx, config = {}) {
  dbg(`apply: config=${JSON.stringify(config)}`)
  const storePath = config.storePath ?? './trisoul-memory.json'
  const provider = config.provider ?? 'ark'
  const model = config.model ?? 'deepseek-v4-flash'
  /** 静态路由的渠道协议（无头评测 dockerkit 写 api: openai-responses）；只对静态 provider 生效 */
  const staticApi = typeof config.api === 'string' && config.api ? config.api : undefined
  /** 盲锁渠道（json_schema 只约束解码、description 模型看不见，如百炼）：schema 门之外把散文 Field guide
   *  也拼进 prompt。与共识插件 cfg.schemaPromptProviders 同一设置项（dsh-api trisoul/consensus-config
   *  统一下发，设置页一处点亮）；无头没有 dsh-api → 退静态 config.schemaPromptProviders。
   *  2026-09-03：中枢挪到百炼跑分时暴露——13 个字段语义全住 description，盲锁下等于没给说明。 */
  const staticSchemaPromptProviders = Array.isArray(config.schemaPromptProviders)
    ? config.schemaPromptProviders.filter(x => typeof x === 'string')
    : undefined
  const schemaPromptProvidersOf = () => {
    let live
    try { live = ctx.bail('trisoul/consensus-config')?.schemaPromptProviders } catch { live = undefined }
    if (Array.isArray(live) && live.length) return live
    return staticSchemaPromptProviders ?? []
  }
  // 消化频率：真机反馈「太频繁」——每 3 条事件就跑一次太碎；默认攒 8 条、上限 24 条、闲 90s 冲刷（可配）
  // 2026-08-18 用户令「不要任何截断和预算类限制」：单批上限 / 续传上限 / 注入条数 / 上下文条数 / 事件字数默认全部不设，
  // 只有用户显式给正数才生效（旧默认 24 / 30 / 20 / 30 / 800 会丢事件、丢记忆、把文件内容截成开头）
  const batch = Math.max(1, config.batch ?? 8)
  const batchMax = config.batchMax > 0 ? Math.max(batch, config.batchMax) : 0   // 0 = 一次全消化
  const catchupMax = config.catchupMax > 0 ? config.catchupMax : 0              // 0 = 全部补消化
  const flushIdleMs = config.flushIdleMs ?? 90_000
  // 整理触发（#1）：默认由中枢自判——消化命中已有条目/信号 → 立刻整理该项目分片；空闲且有待整理分片 → 轮巡；
  // curateEvery 保留为可选强制节奏（每 N 次消化跑一次），默认 0=关；同分片最短间隔 curateMinGapMs 防抖
  const curateEvery = Math.max(0, config.curateEvery ?? 0)
  const curateMinGapMs = Math.max(0, config.curateMinGapMs ?? 180_000)
  const injectLimit = config.injectLimit > 0 ? config.injectLimit : 0          // 0 = 全部可见条目
  // 补注（#5）：每次 ≤ injectBatch 条；每会话注入次数上限默认 4（⑥ 2026-08-23 工单点名设限——开场+任务+两轮主动即到顶，
  // 防补注版无限刷屏；显式配置可改）；任务补注同步等挑选的时限，超时改为下一步送达
  const injectBatch = Math.max(1, config.injectBatch ?? 8)
  const injectMaxPerSession = Number.isFinite(config.injectMaxPerSession) ? Math.max(0, config.injectMaxPerSession) : 4
  const injectPickTimeoutMs = Math.max(0, config.injectPickTimeoutMs ?? 8000)
  // B 补注注版节流（2026-08-21 用户拍板）：renew 模式距上一版 ≥N 步才发新版，期间新条目在 pendingInject 合批；
  // 0 = 不节流（每次都发，旧行为）；只管补注——状态区在 canvas，三魂靠它导航须每步最新，不经此路径
  const supplementMinSteps = Math.max(0, config.supplementMinSteps ?? 10)
  const contextLimit = config.contextMemories > 0 ? config.contextMemories : 0  // 0 = 全部可见条目
  const eventChars = config.eventChars > 0 ? config.eventChars : 0              // 0 = 事件全文
  const logger = ctx.logger ?? {}
  const warn = (m) => { dbg(`WARN ${m}`); logger.warn?.(`trisoul-memory: ${m}`) }
  const info = (m) => { dbg(m); logger.info?.(`trisoul-memory: ${m}`) }
  const info_ = info  // 局部变量名 info 被占用的地方用
  // 上报给 @trisoul/dsh-api 评测指标（无监听者时静默）：
  //   { phase:'digest', ok, sessionId, project, start, end, events, added, updated, retired, skipped, truncated, durationMs | error }
  //   { phase:'curate', ok, project, added, updated, retired | error }
  //   { phase:'inject', sessionId, project, count, source:'startup'|'clear'|'compact'|'task'|'proactive', ids }
  //   { phase:'recall', kind:'memory', sessionId, project, query, scope, visible, hits, mode:'empty'|'all'|'llm'|'lexical' }
  //   { phase:'recall', kind:'raw', sessionId, seqRange:{start,end}, items, truncated }
  // 进程内计数（#11 自检）：注入次数/条数、记忆召回次数/命中条数、原文回捞次数、消化/整理次数
  const counters = { injections: 0, injectedMemories: 0, recalls: 0, recallHits: 0, rawRecalls: 0, digests: 0, digestsOk: 0, curates: 0, curatesOk: 0 }
  const countEvent = (ev) => {
    if (ev.phase === 'inject') { counters.injections++; counters.injectedMemories += ev.count ?? 0 }
    else if (ev.phase === 'recall' && ev.kind === 'memory') { counters.recalls++; counters.recallHits += ev.hits ?? 0 }
    else if (ev.phase === 'recall' && ev.kind === 'raw') counters.rawRecalls++
    else if (ev.phase === 'digest') { counters.digests++; if (ev.ok) counters.digestsOk++ }
    else if (ev.phase === 'curate') { counters.curates++; if (ev.ok) counters.curatesOk++ }
  }
  const report = (ev) => { noteActivity(ev); countEvent(ev); try { ctx.emit('trisoul/memory', ev) } catch (e) { dbg(`EMIT-FAIL trisoul/memory ${String(e?.message ?? e)}`) } }

  // ---- 会话活动账本（供记忆面板按会话取景：GET ?sessionId= 回 session 段）----
  //   sid → { project, injected:{count(累计条数),ts,source,times}, injectedIds:Set（本会话已注入的记忆 id，绝不重注）, taskDone（首条用户消息任务补注已做）,
  //           pendingInject:[条目]（排队等下一 pre-step 送达的主动补注）, rebuilt（已从转录重建已注集）,
  //           recalls:[{ts,query,hits,mode,scope}], raw:{count,ts}, digests:{ok,fail,ts}, touched:Set<memoryId> }
  const ACTIVITY_KEEP = 64, RECALLS_KEEP = 20, TOUCHED_KEEP = 200
  const activity = new Map()
  const activityOf = (sid) => {
    let a = activity.get(sid)
    if (!a) {
      a = { project: undefined, injected: null, injectedIds: new Set(), taskDone: false, pendingInject: [], rebuilt: false,
        // 补注活节点（P1-7）：本会话所有任务/主动补注都汇入同一条 user/message，再来新条目就 surfaceOp:replace 原地改写成累计清单。
        // G1/B/C（2026-08-21）renew 模式新增：doc=任务补注文档全文（G1 活文档，消化 workdoc 改写）、docDirty=有新版待发、
        // fps=已并入内容的近似指纹（C 判重最后防线）、steps/lastVersionStep=注版节流游标（B，supplementMinSteps）
        supp: { id: undefined, seq: undefined, ids: [], pendingSteps: 0, doc: '', docDirty: false, fps: new Set(), steps: 0, lastVersionStep: -Infinity, version: 0 },
        recalls: [], raw: { count: 0, ts: null }, digests: { ok: 0, fail: 0, ts: null }, touched: new Set() }
      activity.set(sid, a)
      while (activity.size > ACTIVITY_KEEP) activity.delete(activity.keys().next().value)
    }
    return a
  }
  const noteActivity = (ev) => {
    const sid = ev.sessionId
    if (!sid) return
    const a = activityOf(sid)
    const ts = Date.now()
    if (typeof ev.project === 'string' && ev.project) a.project = ev.project
    if (ev.phase === 'inject') a.injected = { count: (a.injected?.count ?? 0) + (ev.count ?? 0), ts, source: ev.source ?? null, times: (a.injected?.times ?? 0) + 1 }
    else if (ev.phase === 'recall' && ev.kind === 'memory') {
      a.recalls.push({ ts, query: ev.query ?? '', hits: ev.hits ?? 0, mode: ev.mode ?? null, scope: ev.scope ?? 'all' })
      if (a.recalls.length > RECALLS_KEEP) a.recalls.splice(0, a.recalls.length - RECALLS_KEEP)
    } else if (ev.phase === 'recall' && ev.kind === 'raw') { a.raw.count++; a.raw.ts = ts }
    else if (ev.phase === 'digest') { if (ev.ok) a.digests.ok++; else a.digests.fail++; a.digests.ts = ts }
  }
  const noteTouched = (sid, ids) => {
    if (!sid || !ids.length) return
    const a = activityOf(sid)
    for (const id of ids) a.touched.add(id)
    while (a.touched.size > TOUCHED_KEEP) a.touched.delete(a.touched.values().next().value)
  }

  // 实时模型配置：@trisoul/dsh-api 的统一/精细设置优先，缺席时退回静态配置
  const route = () => {
    let live
    try { live = ctx.bail('trisoul/ai-config', 'memory') } catch { live = undefined }
    return { provider: live?.provider || provider, model: live?.model || model }
  }

  const store = loadStore(storePath)
  // S5（2026-08-31 perf-audit）分级落盘：persist = 立即整库落盘（记忆内容逐笔即写，崩溃语义不变）；
  // persistSoon = 防抖合并——仅 usage/注入痕迹这类可再生小账走它（writeFileSync 全量 JSON 原先卡在
  // recall 工具返回之前与每次注入上；丢了顶多少记一次「用过」，记忆本体永不走防抖）。persist() 吸收挂起的防抖写。
  let persistTimer = null
  const persistDebounceMs = Math.max(0, config.persistDebounceMs ?? 1000)
  const persist = () => {
    if (persistTimer) { clearTimeout(persistTimer); persistTimer = null }
    try { persistStore(storePath, store) } catch (e) { warn(`持久化失败 ${e}`) }
  }
  const persistSoon = () => {
    if (persistDebounceMs === 0) return persist()
    if (persistTimer) return
    persistTimer = setTimeout(() => { persistTimer = null; persist() }, persistDebounceMs)
    persistTimer.unref?.()
  }
  ctx.effect(() => () => { if (persistTimer) persist() }, 'trisoul-memory: persist flush')
  if (store.migrated) { info(`旧格式记忆库已迁移为 v2（${store.memories.length} 条，默认层级 cross）`); persist() }

  // project 键 = 会话 cwd 所在 git 根（同仓库不同子目录共享项目记忆）；无 git 退回 cwd
  const projectOf = (session) => projectKeyOf(session?.header?.cwd ?? session?.cwd ?? process.cwd()) ?? process.cwd()

  // ---- 记忆范围三档（2026-08-20）：会话首触绑定当时的默认档（创建时定死，不可中途切——开场注入发生在第一步，中途切兜不住「读进来」）----
  // 默认档：dsh-api settings（bail trisoul/memory-scope）→ cordis config.scope → 'full'
  const capForNew = () => {
    let v
    try { v = ctx.bail('trisoul/memory-scope') } catch { v = undefined }
    return normalizeCap(v ?? config.scope)
  }
  /** 会话的范围档（首触绑定并落盘）。中枢见过的老会话（cursor 已有、绑定表缺席 = 三档上线前创建）绑 full——它当年就是 full 行为，不吃当前默认档。 */
  const capOf = (sid) => {
    // 'unknown' 是 enqueue 的无 id 回退哨兵：多个无 id 会话会共用它，绑 session 档会互见对方私有记忆（终审 F6）→ 强制 full 且不落绑定表
    if (!sid || sid === 'unknown') return 'full'
    const bound = store.sessionScopes[sid]
    if (bound) return normalizeCap(bound)
    const cap = getCursor(store, sid) !== undefined ? 'full' : capForNew()
    store.sessionScopes[sid] = cap
    persist()
    dbg(`scope: 会话 ${sid} 绑定范围档 ${cap}`)
    return cap
  }
  /** 半径参数包（visibleMemories/openingMemories/applyOps 透传用） */
  const radiusOf = (sid) => ({ cap: capOf(sid), session: sid })
  // 只读查询（UI/dsh-api 显示用）：不触发绑定——用户在记忆页看一眼别的会话不该定它的档
  ctx.on('trisoul/memory-scope-of', (sid) => (sid ? store.sessionScopes[sid] ?? null : null), { global: true })
  // dsh Session.seq = 下一条事件的 seq（= 日志长度）；已有最后一条 = seq-1
  const lastSeqOf = (session) => Number.isInteger(session?.seq)
    ? session.seq - 1
    : (Array.isArray(session?.events) && session.events.length ? session.events[session.events.length - 1].seq : -1)

  // ---- 每会话攒批 ----
  /** sessionId -> { session, project, events: [{seq,type,role,text}], retries } */
  const pending = new Map()
  let digesting = false
  let disposed = false
  let digestCount = 0
  let idleTimer
  let lastProject = process.cwd()

  // 空闲 tick：先冲刷攒批消化，再（仍空闲时）整理一个待整理分片；有剩余待整理分片就再武装一次
  const hasPending = () => { for (const p of pending.values()) if (p.events.length) return true; return false }
  const armIdleFlush = () => {
    if (!flushIdleMs || disposed) return
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => { idleTimer = undefined; void onIdle() }, flushIdleMs)
    idleTimer.unref()
  }
  async function onIdle() {
    // 08-30 S10：空闲冲刷把每个有积压的会话都消化掉——此前只消化第一个就 return 且不重武装定时器，
    // 其余会话的零头（< batch）要等任意会话再来新事件才有机会（两个会话都结束就本进程内永不消化）
    for (let guard = pending.size + 1; guard > 0 && !disposed && !digesting && hasPending(); guard--) await digestNext(true)
    if (disposed || hasPending() || digesting || curating) return
    const sh = pickShard(projectShard(lastProject))
    if (!sh) return
    if (!gapOk(sh)) { armIdleFlush(); return }
    await curate({ shard: sh, trigger: 'idle' })
    if (!disposed && !hasPending() && pickShard()) armIdleFlush()
  }
  let curateRetryTimer
  ctx.effect(() => () => { disposed = true; if (idleTimer) clearTimeout(idleTimer); if (curateRetryTimer) clearTimeout(curateRetryTimer) }, 'trisoul-memory: timers')

  const enqueue = (session, event) => {
    const sid = session?.id ?? 'unknown'
    const cur = getCursor(store, sid)
    if (cur !== undefined && Number.isInteger(event?.seq) && event.seq <= cur) return false  // 已消化（重放/重复）
    const rendered = renderEvent(event, { maxChars: eventChars })
    if (!rendered) return false
    let pend = pending.get(sid)
    if (!pend) { pend = { session, project: projectOf(session), events: [], retries: 0 }; pending.set(sid, pend) }
    pend.session = session
    pend.events.push(rendered)
    return true
  }

  // ---- LLM 作业公共壳 ----
  // 中枢作业（digest/recall/curate）不需要深思：默认请求 reasoningEffort 'off'（能力门控——
  // 该路由声明支持 off 才传，否则不传用提供商默认）；config.effort='inherit' 完全不干预。
  const effortResolver = createEffortResolver(ctx, { effort: config.effort ?? 'off' })
  // T2 双渲染管道（2026-08-26；2026-08-30 改按协议）：路由协议有锁（openai-responses / openai-completions）→ onPayload 挂
  // json_schema strict 硬锁、format 不进 prompt；其余协议 / 协议未知 → format（散文 Field guide / 格式尾句）拼在 prompt 尾，
  // 且 onPayload 只旁观 pi-ai 递来的 model.api 探明协议，下个作业按协议上锁。中枢作业只用 schema 门（json_object 门无 schema，不适合）。
  // 协议来源（按序）：静态 config.api（仅静态 provider）→ 探明缓存 → 内建适配器固定表 → ctx.bail('trisoul/provider-api')。
  // jsonSchemaPayload / LOCK_BY_API / ADAPTER_API 与 dsh-plugin 的同名实现逐字同源。
  const LOCK_BY_API = { 'openai-responses': 'schema', 'openai-completions': 'schema' }
  const ADAPTER_API = { 'deepseek-official': 'deepseek' }
  const jsonSchemaPayload = (schema, api) => (params, model) => (model?.api ?? api) === 'openai-completions'
    ? { ...params, response_format: { type: 'json_schema', json_schema: { name: schema.name, strict: schema.strict, schema: schema.schema } } }
    : { ...params, text: { format: { type: 'json_schema', ...schema } } }
  const apiSeen = new Map()
  const apiOf = (p) => {
    if (typeof p !== 'string' || !p) return undefined
    if (staticApi && p === provider) return staticApi
    if (apiSeen.has(p)) return apiSeen.get(p)
    if (ADAPTER_API[p]) return ADAPTER_API[p]
    let v
    try { v = ctx.bail('trisoul/provider-api', p) } catch { v = undefined }
    return (typeof v === 'string' && v) ? v : undefined
  }
  const observing = (p, hook) => (params, model) => {
    if (typeof model?.api === 'string' && model.api) apiSeen.set(p, model.api)
    return hook ? hook(params, model) : params
  }
  // 书记官的钟：消化/整理 prompt 带当天日期——没有它「昨天」类相对日期无从换算（宪法要求写绝对日期）
  const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
  async function runJob({ purpose, system, prompt, format, schema, maxTokens, sessionId }) {
    let text = ''
    let truncated = false
    const r = route()
    const api = apiOf(r.provider)
    const locked = !!(schema && LOCK_BY_API[api] === 'schema')
    // 盲锁渠道：锁照挂（形状仍强制），散文 Field guide 一并进 prompt——否则字段语义模型一个字看不到
    const blindLock = locked && schemaPromptProvidersOf().includes(r.provider)
    const reasoningEffort = await effortResolver.resolve(r.provider, r.model)
    const stream = ctx.llm.stream({
      ...r,
      ...(reasoningEffort !== undefined ? { reasoningEffort } : {}),
      ...(sessionId ? { sessionId } : {}), // 监控按会话归因
      onPayload: observing(r.provider, locked ? jsonSchemaPayload(schema, api) : null),
      purpose,
      maxTokens,
      system,
      messages: [Object.freeze({
        id: `${purpose}-${Date.now()}`,
        role: 'user',
        content: Object.freeze([Object.freeze({ type: 'text', text: format && (!locked || blindLock) ? `${prompt}\n\n${format}` : prompt })]),
        source: Object.freeze({ kind: 'plugin', plugin: 'trisoul-memory' }),
      })],
    })
    for await (const c of stream) {
      if (c.type === 'text-delta') text += c.text ?? ''
      else if (c.type === 'finish') {
        const kind = c.reason?.kind
        if (kind === 'error' || kind === 'aborted') throw new Error(`${purpose} LLM ${kind}: ${c.reason?.failure?.code ?? ''} ${c.reason?.failure?.message ?? ''}`)
        if (kind === 'max-tokens') truncated = true
      }
    }
    return { text, truncated }
  }

  const parseJson = (text) => {
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) return undefined
    try { return JSON.parse(m[0]) } catch { return undefined }
  }

  // 消化 prompt 里的记忆表按创建 ts 旧→新渲染（09-02 缓存审计）：visibleMemories 的 updatedAt 新→旧只用来选条目
  // （limit 生效时仍取最近更新的 N 条），渲染顺序改为创建序——新增与 update 生成的新行都落在表尾，表的前缀字节
  // 跨次不变，前缀缓存才有得命中；旧序每次新增/更新都插表头，其后整表作废（三场 110 次消化实测命中 12.8%，改序可命中 92%）。
  const memoryTable = (project, limit, radius) => {
    const list = [...visibleMemories(store, project, { limit, ...radius })].sort(byTsThenId)
    return list.length
      ? list.map(m => `- id=${m.id} | ${m.scope} | key=${m.key} | ${m.text}`).join('\n')
      : '(empty)'
  }

  // ---- 作业①：消化 ----
  async function digestSession(sid, { force = false } = {}) {
    const pend = pending.get(sid)
    if (!pend || pend.events.length === 0) return
    if (!force && pend.events.length < batch) return
    if (digesting) return
    digesting = true
    const events = batchMax > 0 ? pend.events.splice(0, batchMax) : pend.events.splice(0)
    pend.urgent = false
    const project = pend.project
    const start = events[0].seq, end = events[events.length - 1].seq
    lastProject = project
    dbg(`digest: start session=${sid} seq ${start}..${end} batch=${events.length}`)
    try {
      // 待复审（P1-3）：本会话此前标 compactable:false 的批——附上让中枢用这批新事件复审，能放手的点名放行
      const holding = holdingDigests(store, sid)
      const holdingText = holding.length
        ? `\n\nPending re-review (batches this session previously marked "original text still in use"; if this batch of new events shows they are done with, put their ids into nowCompactable):\n${holding.map(d => `- id=${d.id} seq ${d.start}..${d.end}: ${d.text}`).join('\n')}`
        : ''
      const radius = radiusOf(sid)   // 范围档：上下文表与 ops 写入同径（session 档下公共记忆不进 prompt——防泄漏 + 防诱导改写公共条目）
      // G1：附当前任务补注文档，让同一次消化调用顺手代谢改写（输出 workdoc；零新增调用）
      const aAct = sid && sid !== 'unknown' ? activityOf(sid) : undefined
      const docText = supplementMode === 'renew' && aAct?.supp.doc
        ? `\n\nCurrent task memo document (the session's working-memory view; rewrite rules under workdoc in the output format):\n${aAct.supp.doc}`
        : ''
      const prompt = `Current project (git root / cwd): ${project}\nToday: ${todayStr()}\n\nExisting memories (visible to this project${contextLimit > 0 ? `, at most ${contextLimit}` : ''}, oldest→newest):\n${memoryTable(project, contextLimit, radius)}` +
        holdingText + docText +
        `\n\nNew events (seq ${start}..${end}):\n${formatEvents(events)}`
      const t0 = Date.now()
      let digestReport
      const { text, truncated } = await runJob({
        purpose: 'trisoul-memory-digest',
        system: CONSTITUTION,
        prompt, format: DIGEST_FORMAT, schema: DIGEST_SCHEMA, sessionId: sid,
        ...(config.digestMaxTokens > 0 ? { maxTokens: config.digestMaxTokens } : {}), // 默认不设输出上限（推理模型的思考也计入预算，截断会静默丢记忆）
      })
      if (truncated) warn(`消化输出被 maxTokens${config.digestMaxTokens > 0 ? `(${config.digestMaxTokens})` : '（提供方默认）'} 截断，本批可能丢记忆`)
      const parsed = parseJson(text)
      if (!parsed) {
        dbg(`digest: 无 JSON${truncated ? '（截断）' : ''}: ${text}`)
        if (!truncated) warn('消化输出不是 JSON，本批跳过')
      } else {
        const now = Date.now()
        const r = applyOps(store, parsed.ops, { project, source: 'digest', now, ...radius })
        const phaseClosed = parsed.phaseClosed === true
        if (typeof parsed.digest === 'string' && parsed.digest.trim()) {
          addDigest(store, { sessionId: sid, start, end, text: parsed.digest, project, compactable: parsed.compactable !== false, phaseClosed }, now)
          void proactivePick(sid, project, parsed.digest)  // 主动补注（#5 iii）：本批稿当 query 挑可见未注条目
        } else {
          // 空稿也入库（P1-7）：这批没有实质内容 ⇒ 正是最该被压掉的——不入库就不进 digestedRanges，画布永远圈不到它
          addDigest(store, { sessionId: sid, start, end, text: EMPTY_DIGEST_TEXT, project, compactable: parsed.compactable !== false, empty: true, phaseClosed }, now)
        }
        // G1：消化同一次调用代谢补注文档（红线②：只改工作记忆视图，库 ops 照旧不动）
        if (supplementMode === 'renew' && aAct?.supp.doc && typeof parsed.workdoc === 'string' && parsed.workdoc.trim()) {
          aAct.supp.doc = parsed.workdoc.trim()
          aAct.supp.docDirty = true
          dbg(`digest: 补注文档代谢改写 → ${aAct.supp.doc.length} 字`)
        }
        // 复审放行（P1-3）：点名的批 + 阶段收尾时本批之前的全部
        const released = markCompactable(store, { sessionId: sid, ids: Array.isArray(parsed.nowCompactable) ? parsed.nowCompactable : [], ...(phaseClosed ? { before: end } : {}) })
        if (released || phaseClosed) dbg(`digest: 复审放行 ${released} 批${phaseClosed ? `，阶段收尾 @seq ${end}` : ''}`)
        if (r.added.length || r.updated.length || r.retired.length) {
          info(`消化 seq ${start}..${end}：新增 ${r.added.length} 更新 ${r.updated.length} 退役 ${r.retired.length}`)
          dbg(`digest: ops ${JSON.stringify({ added: r.added.map(m => m.text), updated: r.updated.map(m => m.text), retired: r.retired.map(m => m.id), skipped: r.skipped })}`)
        }
        digestReport = { added: r.added.length, updated: r.updated.length, retired: r.retired.length, skipped: r.skipped.length,
          skipReasons: skipReasonsOf(r.skipped), compactable: parsed.compactable !== false, released, phaseClosed }
        noteTouched(sid, [...r.added, ...r.updated].map(m => m.id))
      }
      report({ phase: 'digest', ok: true, sessionId: sid, project, start, end, events: events.length, truncated: !!truncated,
        durationMs: Date.now() - t0, ...(digestReport ?? { added: 0, updated: 0, retired: 0, skipped: 0, noJson: true }) })
      setCursor(store, sid, end)
      pend.retries = 0
      persist()
      digestCount++
      // 触发自判（#1）：消化 ops 命中已有条目、或模型给出 overlap/conflict 信号 → 该项目分片立刻排整理（受最短间隔防抖）
      // 档位判据（09-01，审计 bug②）：session 档的命中全落会话私有层，整理分片（global/cross/project）够不到——
      // 排了也只是空转烧一次 LLM（真机 212 次消化 153 处更新 → 41 次 signal 整理全零 ops）；full/project 档照旧
      const sig = parsed?.signals && typeof parsed.signals === 'object' ? parsed.signals : {}
      if (radius.cap !== 'session' && ((digestReport && (digestReport.updated || digestReport.retired)) || sig.overlap === true || sig.conflict === true)) {
        scheduleCurate(projectShard(project), 'signal')
      } else if (curateEvery && digestCount % curateEvery === 0) {
        const sh = pickShard(projectShard(project))
        if (sh) queueMicrotask(() => { void curate({ shard: sh, trigger: 'cadence' }) })
      }
    } catch (e) {
      warn(`消化失败 ${String(e).slice(0, 300)}`)
      report({ phase: 'digest', ok: false, sessionId: sid, project, start, end, events: events.length, error: String(e).slice(0, 300) })
      // 失败一次：放回队头等下一次触发；连败则丢弃（游标不前进，重启后从游标续传）
      if (pend.retries < 1) { pend.retries++; pend.events.unshift(...events) }
      else { pend.retries = 0; dbg(`digest: 连续失败，丢弃 seq ${start}..${end}`) }
    } finally {
      digesting = false
      dbg(`digest: end memories=${store.memories.length}`)
      if (!disposed) { void digestNext(false); if (!hasPending() && pickShard()) armIdleFlush() }
    }
  }

  /** 挑一个够批的会话消化；force=闲时冲刷（有就消化）；pend.urgent=显著事件（#9）到达，有就立刻消化。 */
  async function digestNext(force) {
    if (digesting) return
    for (const [sid, pend] of pending) {
      if (pend.events.length >= batch || ((force || pend.urgent) && pend.events.length > 0)) { await digestSession(sid, { force: force || pend.urgent }); return }
    }
  }
  // 显著事件（#9）：用户原话里的长期约定/决策信号 → 不等攒批立刻消化
  const SIGNIFICANT = /记住|以后都|从今往后|决定|别再|不要再/
  const isSignificantUserEvent = (event) => {
    if (event?.type !== 'user/message' || event.data?.source?.kind !== 'user') return false
    const text = Array.isArray(event.data?.content) ? event.data.content.filter(b => b?.type === 'text').map(b => b.text ?? '').join('\n') : ''
    return SIGNIFICANT.test(text)
  }

  // ---- 作业②：整理（#2 分片轮巡：global / cross / project:<键>，片内游标 ≤curateLimit 分多轮）----
  let curating = false
  const curateLimit = config.curateLimit > 0 ? config.curateLimit : 0   // 0 = 整片一轮过完（不分页）
  const curateOpsMax = config.curateOpsMax > 0 ? config.curateOpsMax : 0 // 0 = 每轮 ops 不设上限
  const memLine = (m, now) => `- id=${m.id} | ${m.scope}${m.project ? `(${m.project})` : ''} | key=${m.key} | ${m.text} ${usageSignal(m, now)}`
  /** 分片整理输入：可编辑条目（带 id）+ 分片特有的参考区；返回 { prompt, allow(可编辑 id 集), window } */
  const curateInput = (shard, now) => {
    const info = shardInfo(shard)
    const window = curateWindow(store, shard, curateLimit)
    const allow = new Set(window.entries.map(m => m.id))
    const rot = window.total > window.entries.length ? ` (this round: entries ${window.cursor + 1}~${window.cursor + window.entries.length} of ${window.total}; the rest next round)` : ''
    let head, extra = ''
    if (info.scope === 'project') {
      head = `Current shard: this project's project layer (git root / cwd: ${info.project})${rot}\nEditable entries (ops may target only these ids):\n`
      const ro = visibleMemories(store, undefined).filter(m => m.scope !== 'project')
      if (ro.length) extra = `\n\nGlobal / cross-project digest (read-only, no ids, do not emit ops against them; only for spotting project entries that duplicate them — such duplicates may retire the project-side entry):\n${ro.map(m => `- (read-only) ${formatMemoryLine(m)}`).join('\n')}`
    } else if (info.scope === 'cross') {
      head = `Current shard: cross-project cross layer${rot}\nEditable entries (ops may target these ids):\n`
      const cands = crossCandidates(store)
      if (cands.length) {
        for (const g of cands) for (const m of g.entries) allow.add(m.id)
        extra = `\n\nPromotion candidates (entries from various projects' project layers with the same key or similar text, appearing in ≥2 projects; also editable): if one holds in any project, promote it with update (target = one of the ids, scope=cross, text = the merged general statement) and retire the remaining duplicates; if they are still each project's own matter, leave them alone:\n` +
          cands.map((g, i) => `Group ${i + 1}${g.key ? ` (key=${g.key})` : ''}:\n${g.entries.map(m => `  ${memLine(m, now).slice(2)}`).join('\n')}`).join('\n')
      }
    } else {
      head = `Current shard: base global layer (facts about the user themselves / machine / accounts / environment)${rot}\nEditable entries (global may only merge/update text; no retiring, no demoting):\n`
    }
    const body = window.entries.length ? window.entries.map(m => memLine(m, now)).join('\n') : '(empty)'
    return { prompt: `Today: ${todayStr()}\n\n` + head + body + extra + `\n\n${CURATE_RULES}`, allow, window }
  }
  /** 挑该整理的分片：preferred 有待整理就它，否则最久未整理的待整理分片（从未整理过的优先）；都没有 → undefined。 */
  const pickShard = (preferred) => {
    const cross = crossCandidates(store)   // C3：单次挑选只算一次，shardDirty/shardsOf 各处复用
    if (preferred && shardDirty(store, preferred, cross)) return preferred
    const dirty = shardsOf(store, cross).filter(sh => shardDirty(store, sh, cross))
    if (!dirty.length) return undefined
    dirty.sort((a, b) => (store.curate.lastAt[a] ?? 0) - (store.curate.lastAt[b] ?? 0))
    return dirty[0]
  }
  const gapOk = (shard, now = Date.now()) => now - (store.curate.lastAt[shard] ?? 0) >= curateMinGapMs
  /** 想整理但暂时没轮到的分片（锁住 / 间隔未到）：shard → trigger；间隔到了或当前整理结束后补跑 */
  const curateWanted = new Map()
  const scheduleCurate = (shard, trigger) => {
    if (!shard || disposed) return
    curateWanted.set(shard, trigger)
    void drainCurate()
  }
  async function drainCurate() {
    if (disposed || curating) return
    const now = Date.now()
    let soonest = Infinity
    for (const [shard, trigger] of curateWanted) {
      if (!gapOk(shard, now)) { soonest = Math.min(soonest, curateMinGapMs - (now - (store.curate.lastAt[shard] ?? 0))); continue }
      curateWanted.delete(shard)
      await curate({ shard, trigger })
      if (curateWanted.size) queueMicrotask(() => { void drainCurate() })
      return
    }
    if (curateWanted.size && Number.isFinite(soonest)) {
      if (curateRetryTimer) clearTimeout(curateRetryTimer)
      curateRetryTimer = setTimeout(() => { curateRetryTimer = undefined; void drainCurate() }, Math.max(1, soonest + 5))
      curateRetryTimer.unref()
    }
  }
  /**
   * 整理一个分片：{ shard } 或兼容旧参数 { project }（= 该项目分片），缺省 = 最近消化的项目分片。
   * trigger 只用于事件归因（'manual'|'cadence'|'signal'|'idle'）。返回 applyOps 结果 + shard，被锁/太小时返回 undefined。
   */
  async function curate({ shard, project, trigger = 'manual' } = {}) {
    if (curating) return
    const target = shard ?? projectShard(project ?? lastProject)
    const info = shardInfo(target)
    if (!info) { warn(`整理：非法分片 ${String(target)}`); return }
    curating = true
    dbg(`curate: start shard=${target} trigger=${trigger}`)
    let windowInfo
    try {
      const now = Date.now()
      const { prompt, allow, window } = curateInput(target, now)
      windowInfo = window
      if (window.total < 2 && !(info.scope === 'cross' && allow.size >= 2)) { markCurated(store, target, 0, now); return }
      const { text, truncated } = await runJob({
        purpose: 'trisoul-memory-curate',
        system: CONSTITUTION,
        prompt, format: CURATE_FORMAT_TAIL, schema: CURATE_SCHEMA,
        ...(config.curateMaxTokens > 0 ? { maxTokens: config.curateMaxTokens } : {}),
      })
      if (truncated) warn('整理输出被 maxTokens 截断，本轮整理可能不完整')
      const parsed = parseJson(text)
      if (!parsed) { if (!truncated) warn('整理输出不是 JSON，跳过'); return }
      const ops = Array.isArray(parsed.ops) ? parsed.ops : []
      // 分片默认层：global/cross 分片里 add 不带 scope 就落本分片层；project 分片 add 默认 project（applyOps 默认）
      if (info.scope !== 'project') for (const o of ops) if (o && typeof o === 'object' && (o.op === 'add') && !o.scope) o.scope = info.scope
      const r = applyOps(store, ops, { project: info.project, source: 'curate', allow, opsMax: curateOpsMax })
      if (r.truncated) warn(`整理 ops 超上限 curateOpsMax=${curateOpsMax}（共 ${ops.length} 条），已截断 ${r.truncated} 条`)  // 默认 0 = 不设上限，不会触发
      markCurated(store, target, window.next, Date.now())
      persist()
      info_(`整理 ${target}：更新 ${r.updated.length} 退役 ${r.retired.length} 新增 ${r.added.length} 跳过 ${r.skipped.length}`)
      report({ phase: 'curate', ok: true, shard: target, project: info.project, trigger, added: r.added.length, updated: r.updated.length, retired: r.retired.length, skipped: r.skipped.length,
        skipReasons: skipReasonsOf(r.skipped), ops: r.ops, truncated: r.truncated, cursor: { from: window.cursor, next: window.next, total: window.total } })
      return { ...r, shard: target, cursor: { from: window.cursor, next: window.next, total: window.total } }
    } catch (e) {
      warn(`整理失败 ${String(e).slice(0, 300)}`)
      report({ phase: 'curate', ok: false, shard: target, project: info.project, trigger, error: String(e).slice(0, 300) })
    } finally {
      curating = false
      dbg(`curate: end shard=${target}${windowInfo ? ` ${windowInfo.cursor}→${windowInfo.next}/${windowInfo.total}` : ''}`)
      if (!disposed && curateWanted.size) queueMicrotask(() => { void drainCurate() })
    }
  }

  // ---- 订阅事件流（书记官的眼睛）----
  ctx.on('session/event', (session, event) => {
    if (!event || !DIGESTIBLE_TYPES.includes(event.type) || isDelegatedSession(session)) return
    if (!enqueue(session, event)) return
    dbg(`event: ${event.type} seq=${event.seq} session=${session?.id}`)
    const pend = pending.get(session?.id ?? 'unknown')
    if (pend && isSignificantUserEvent(event)) { pend.urgent = true; dbg(`event: 显著事件 seq=${event.seq} → 立刻消化`) }
    if (pend && (pend.events.length >= batch || pend.urgent)) void digestNext(false)
    else armIdleFlush()
  }, { global: true })

  // ---- 推通道 + 游标续传：会话生命周期开始 ----
  ctx.on('agent/session-start', (payload) => {
    const agent = payload?.agent ?? payload
    const session = agent?.session
    if (isDelegatedSession(session)) return
    const sid = session?.id
    const project = projectOf(session)
    // 范围档绑定必须先于 cursor 写入：capOf 靠「cursor 缺席 = 新会话」区分三档上线前的老会话（老会话绑 full）
    const radius = sid ? radiusOf(sid) : { cap: 'full' }
    if (sid) {
      const cur = getCursor(store, sid)
      const last = lastSeqOf(session)
      if (cur === undefined) {
        // 本插件没见过的会话（新建/分叉/旧存档）：从当前位置起消化，不回填历史
        setCursor(store, sid, last); persist()
      } else if (last > cur) {
        // 续传：把游标之后未消化的事件补进队列（有界）
        let backlog = session.events.filter(e => e.seq > cur && DIGESTIBLE_TYPES.includes(e.type))
        if (catchupMax > 0 && backlog.length > catchupMax) {
          const skipped = backlog.length - catchupMax
          backlog = backlog.slice(-catchupMax)
          warn(`续传积压 ${skipped + catchupMax} 条，超过 catchupMax=${catchupMax}，跳过最早 ${skipped} 条`)
          setCursor(store, sid, backlog.length ? backlog[0].seq - 1 : last)
        }
        let n = 0
        for (const e of backlog) if (enqueue(session, e)) n++
        if (n) { info(`续传：会话 ${sid} 自 seq ${cur} 起补消化 ${n} 条`); armIdleFlush(); void digestNext(false) }
      }
    }
    // 已注集重建（本进程首次见到该会话）：转录里我们的插件消息 → 已注入的条目 id（resume/重启后不重注）
    if (sid) { const a = activityOf(sid); if (!a.rebuilt) rebuildInjected(session, a) }
    // source=resume 时转录里已经有上一次的注入（注入是持久消息），再注就是重复污染上下文——只在
    // startup / clear（上下文全新）时开场注入；compact（上下文被压缩）走任务式重注（#5 ii）。
    if (payload?.source === 'resume') { dbg('inject: skip (resume)'); return }
    if (typeof agent?.inject !== 'function') return
    if (payload?.source === 'compact') { void compactInject(agent, sid, project); return }
    // 开场清单（#6）：底层 + 用户手写常驻，其余新→旧补足到 injectLimit；半径外不注入（session 档新会话从零开始 = 不注入）
    const list = openingMemories(store, project, { limit: injectLimit, ...radius })
    if (!list.length) return
    try {
      agent.inject(memMessage(renderList(OPENING_HEAD(project), list)))
      info(`注入 ${list.length} 条记忆（project=${project}）`)
      markInjected(sid, project, list, payload?.source ?? 'startup')
    } catch (e) { warn(`注入失败 ${e}`) }
  }, { global: true })

  // ---- 补注（#5）：任务补注（首条用户消息，pre-step 同步并入本步）/ 主动补注（消化后挑选，排队到下一 pre-step）/ compact 任务式重注 ----
  let msgSeq = 0
  const memMessage = (text) => Object.freeze({
    id: `trisoul-mem-${Date.now()}-${msgSeq++}`,
    role: 'user',
    content: Object.freeze([Object.freeze({ type: 'text', text })]),
    source: Object.freeze({ kind: 'plugin', plugin: 'trisoul-memory' }),
  })
  // 补注送达模式：'renew'（默认，2026-08-21 换代制）= 有新条目就尾部 append 一版全量累计清单，旧版留在原地降级为
  //   直通项、由下一刀手术顺路吞掉（照抄状态区 P2-2：纯追加零缓存破坏——旧 rewrite 制真机一场 13 次 replace，
  //   每次把补注消息之后的整场前缀缓存作废，是低命中步的主要成因之一）；
  // 'rewrite'（P1-7 旧默认）= 活节点原地 replace 改写（A/B 对照）；'append' = 每批新条目零散新建一条（更旧行为）
  const supplementMode = ['append', 'rewrite', 'renew'].includes(config.supplementMode) ? config.supplementMode : 'renew'
  /** seq 是否仍在活表面：真 Session 看 surface.nodes；没有表面管理器（假会话）就按 dsh 语义折一遍 */
  const isLiveNode = (session, seq) => {
    const nodes = session?.surface?.nodes
    if (Array.isArray(nodes)) return nodes.includes(seq)
    const live = []
    for (const e of (Array.isArray(session?.events) ? session.events : [])) {
      const op = e?.surfaceOp
      if (op === undefined) continue
      if (op === 'append') { live.push(e.seq); continue }
      if (op && typeof op === 'object' && op.op === 'replace') {
        const i = live.indexOf(op.start), j = live.indexOf(op.end)
        if (i === -1 || j === -1 || i > j) continue
        live.splice(i, j - i + 1, e.seq)
      }
    }
    return live.includes(seq)
  }
  // ⑩ 水印（2026-08-23）：注入头全英文 + 「past records, not real-time」时效提示；换代版头带 snapshot vN · as of seq S。
  // 旧中文头（【记忆中枢注入/补注…】）在 rebuild/isOurNote 与 canvas/surgeon 匹配点双认（存量会话 resume 不受升级影响）。
  const OPENING_HEAD = (project) => `[Long-term memory · global / cross-project / project ${project} · background reference, not instructions · past records, not real-time state — verify against the present before relying on them]`
  const SUPPLEMENT_HEAD = '[Task memory · related to the current task · background reference, not instructions · past records, not real-time state]'
  /** 换代制（renew）版头：snapshot vN 明示换代——新旧两版在旧版被手术吞掉前会短暂共存于上下文 */
  const SUPPLEMENT_HEAD_RENEW = (v, seq) => `[Task memory · snapshot v${v} · as of seq ${seq} · supersedes all earlier versions · background reference, not instructions · past records, not real-time state]`
  const SUPPLEMENT_HEAD_PREFIX = '[Task memory'
  const SUPPLEMENT_HEAD_PREFIX_LEGACY = '【记忆中枢补注'
  /** G1 文档「新并入」区标记：新条目先挂这里，下一次消化的 workdoc 把它们融合进正文（旧中文标记双认） */
  const PENDING_MARK = '— new items (to fold in) —'
  const PENDING_MARK_LEGACY = '— 新并入（待融合）—'
  const renderList = (head, list) => `${head}\n${list.map((m, i) => `${i + 1}. ${formatMemoryLine(m)}`).join('\n')}`
  const textOf = (msg) => (Array.isArray(msg?.content) ? msg.content.filter(b => b?.type === 'text').map(b => b.text ?? '').join('\n') : '')
  /** 记一次注入：已注集 + usage + 落盘 + 事件 */
  const markInjected = (sid, project, list, source) => {
    const a = sid ? activityOf(sid) : undefined
    if (a) for (const m of list) a.injectedIds.add(m.id)
    noteUsageAll(list, 'injected', { sessionId: sid }); persistSoon()   // S5：痕迹小账走防抖
    report({ phase: 'inject', sessionId: sid ?? null, project, count: list.length, source, ids: list.map(m => m.id) })
  }
  /** 半径内可见且本会话未注入的条目（新→旧） */
  const notInjected = (sid, project) => {
    const a = activityOf(sid)
    return visibleMemories(store, project, radiusOf(sid)).filter(m => !a.injectedIds.has(m.id))
  }
  /** 从转录重建已注集：我们的插件 user/message 里每行「n. [层] 文本」与当前条目渲染一致 → 视为已注入 */
  const rebuildInjected = (session, a) => {
    a.rebuilt = true
    const events = session.events
    const lines = new Set()
    for (const e of events) {
      if (e.type !== 'user/message') continue
      const src = e.data?.source
      if (src?.kind !== 'plugin' || src?.plugin !== 'trisoul-memory') continue
      // 行形态两种：初版清单「n. [层] 文本」/ G1 文档「新并入」区「· [层] 文本」
      for (const line of textOf(e.data).split('\n')) { const m = line.match(/^(?:\d+\.|·) (.+)$/); if (m) lines.add(m[1]) }
    }
    // G1 resume：转录里最新一版补注 → 恢复任务补注文档（剥头行）；每行入 C 指纹集兜住行匹配对自由文档形态的失效
    if (supplementMode === 'renew') {
      let last
      for (const e of events) {
        if (e.type === 'user/message' && e.data?.source?.kind === 'plugin' && e.data?.source?.plugin === 'trisoul-memory'
          && (textOf(e.data).startsWith(SUPPLEMENT_HEAD_PREFIX) || textOf(e.data).startsWith(SUPPLEMENT_HEAD_PREFIX_LEGACY))) last = e
      }
      if (last && !a.supp.doc) {
        const vm = /^\[Task memory · snapshot v(\d+)/.exec(textOf(last.data))
        if (vm) a.supp.version = Math.max(a.supp.version, Number(vm[1]))
        const body = textOf(last.data).split('\n').slice(1).join('\n').trim()
        if (body) {
          a.supp.doc = body
          for (const line of body.split('\n')) { const t = line.replace(/^(\d+\.|·)\s*/, '').trim(); if (t.length >= 8) a.supp.fps.add(suppFp(t)) }
          dbg(`inject: 从转录恢复补注文档 ${body.length} 字 (seq ${last.seq})`)
        }
      }
    }
    if (!lines.size) return
    let n = 0
    for (const m of store.memories) if (isActive(m) && (lines.has(formatMemoryLine(m)) || lines.has(formatMemoryLineLegacy(m)))) { a.injectedIds.add(m.id); n++ }   // ⑨ 双认：旧转录行是中文层标
    if (n) dbg(`inject: 从转录重建已注集 ${n} 条 (session=${session?.id})`)  // taskDone 不置位：续接后的第一条用户消息仍可任务补注（已注集去重）
  }
  /** C 近似指纹（最后防线）：小写、剥空白与常见标点后取开头 80 字——治写入端近似重复条目（1/2、31/32、111/112 型各自进库各自命中） */
  const suppFp = (text) => text.toLowerCase().replace(/[\s。，,.;；:：!！?？、"'「」『』()（）]/g, '').slice(0, 80)
  const enqueuePending = (sid, hits) => {
    if (!hits.length) return
    const a = activityOf(sid)
    for (const m of hits) {
      if (a.injectedIds.has(m.id) || a.pendingInject.some(p => p.id === m.id)) continue
      // C 判重：同指纹内容已在文档/队列里 → 跳过；记入已注集防止每次消化反复 pick 同一条
      if (supplementMode === 'renew') {
        const fp = suppFp(m.text)
        if (a.supp.fps.has(fp) || a.pendingInject.some(p => suppFp(p.text) === fp)) {
          a.injectedIds.add(m.id)
          dbg(`inject: C 判重跳过近似重复条目 ${m.id}（指纹已在文档/队列）`)
          continue
        }
      }
      a.pendingInject.push(m)
    }
  }
  const canSupplement = (sid) => (activityOf(sid).injected?.times ?? 0) < injectMaxPerSession
  /** 主动补注挑选（消化成功后）：digest 文本当 query，从可见未注条目里挑；命中排队到下一 pre-step */
  async function proactivePick(sid, project, query) {
    if (!sid || !canSupplement(sid)) return
    const a = activityOf(sid)
    const pool = notInjected(sid, project).filter(m => !a.pendingInject.some(p => p.id === m.id))
    if (!pool.length) return
    try {
      const { hits } = await pickMemories({ query, pool, sessionId: sid, allBelow: 0, purpose: 'trisoul-memory-inject' })
      if (hits.length) { enqueuePending(sid, hits.slice(0, injectBatch)); dbg(`inject: 主动补注候选 ${hits.length} 条排队 (session=${sid})`) }
    } catch (e) { dbg(`inject: 主动补注挑选失败 ${String(e).slice(0, 200)}`) }
  }
  /** compact 后任务式重注：常驻（底层 + 用户手写）+ 按「状态区快照 + 最近用户消息」挑选的相关条目；没线索退回开场清单 */
  async function compactInject(agent, sid, project) {
    const a = sid ? activityOf(sid) : undefined
    if (a) { a.injectedIds.clear(); a.pendingInject.length = 0; a.taskDone = true; a.supp = { id: undefined, seq: undefined, ids: [], pendingSteps: 0, doc: '', docDirty: false, fps: new Set(), steps: 0, lastVersionStep: -Infinity, version: 0 } }  // 压缩后旧注入已随上下文压掉，重来
    let lastUser = ''
    const events = agent.session.events
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i]
      if (e.type === 'user/message' && e.data?.source?.kind === 'user') { lastUser = textOf(e.data); if (lastUser) break }
    }
    const status = canvasSnapshot(sid)
    const query = [lastUser, status].filter(Boolean).join('\n')
    const radius = sid ? radiusOf(sid) : { cap: 'full' }
    let list
    if (query) {
      const pinned = pinnedMemories(store, project, radius)
      const rest = visibleMemories(store, project, radius).filter(m => !pinned.includes(m))
      let hits = []
      // 挑选失败要可见（recall 是压缩后的兜底线，它自己哑火不能无声）：记日志后按无命中继续
      if (rest.length) {
        try { hits = (await pickMemories({ query, pool: rest, sessionId: sid, allBelow: 0, purpose: 'trisoul-memory-inject' })).hits.slice(0, injectBatch) }
        catch (e) { dbg(`PICK-FAIL inject ${String(e?.message ?? e)}`); ctx.logger?.warn(`trisoul-memory: 注入挑选失败，按无命中继续 ${String(e?.message ?? e)}`) }
      }
      list = [...pinned, ...hits].sort((x, y) => (y.updatedAt ?? y.ts ?? 0) - (x.updatedAt ?? x.ts ?? 0))
    } else list = openingMemories(store, project, { limit: injectLimit, ...radius })
    if (!list.length) return
    try {
      agent.inject(memMessage(renderList(OPENING_HEAD(project), list)))
      info(`压缩后重注 ${list.length} 条记忆（project=${project}）`)
      markInjected(sid, project, list, 'compact')
    } catch (e) { warn(`压缩后重注失败 ${e}`) }
  }
  ctx.on('agent/pre-step', async (payload, next) => {
    const decision = await next()
    try {
      const agent = payload?.agent
      const session = agent?.session
      const sid = session?.id
      if (!sid || !decision || decision.kind !== 'enter' || isDelegatedSession(session)) return decision
      const a = activityOf(sid)
      const project = projectOf(session)
      const extra = []
      // B 注版节流：每个 enter 步 +1；距上一版不足 supplementMinSteps 时主动补注留在 pendingInject 合批
      //（首版立即——文档还不存在谈不上换代；0 = 不节流；rewrite/append 旧模式不受影响，A/B 对照保持原行为）
      a.supp.steps++
      const throttleOpen = supplementMode !== 'renew' || supplementMinSteps === 0
        || (a.supp.ids.length === 0 && !a.supp.doc)
        || a.supp.steps - a.supp.lastVersionStep >= supplementMinSteps
      /** 补注送达：renew（默认，G1 活文档）= 条目并入任务补注文档、尾部 append 文档新版（换代，旧版等 A 遮蔽刀/手术吞）；
       *  rewrite（P1-7 旧默认）= 能原地改写活节点就改写；append = 零散新建 */
      const deliver = (list, source) => {
        const supp = a.supp
        if (supplementMode === 'renew') {
          // G1 文档模式（2026-08-21）：清单 → 任务知识文档。新条目先过 C 指纹判重（任务补注直达路径不经 enqueuePending），
          // 再挂到文档「新并入（待融合）」区——真正的融合改写由下一次消化的 workdoc 完成（零新增 LLM 调用）
          const fresh = list.filter(m => {
            if (supp.fps.has(suppFp(m.text))) { a.injectedIds.add(m.id); dbg(`inject: C 判重跳过 ${m.id}（内容已在文档）`); return false }
            return true
          })
          if (!fresh.length && !(supp.docDirty && supp.doc)) return
          if (fresh.length) {
            markInjected(sid, project, fresh, source)
            for (const m of fresh) supp.fps.add(suppFp(m.text))
            supp.ids = [...new Set([...supp.ids, ...fresh.map(m => m.id)])]
            const lines = fresh.map(m => formatMemoryLine(m))
            supp.doc = supp.doc.trim()
              ? ((supp.doc.includes(PENDING_MARK) || supp.doc.includes(PENDING_MARK_LEGACY))
                ? `${supp.doc}\n${lines.map(l => `· ${l}`).join('\n')}`
                : `${supp.doc}\n\n${PENDING_MARK}\n${lines.map(l => `· ${l}`).join('\n')}`)
              : lines.map((l, i) => `${i + 1}. ${l}`).join('\n')   // 初版 = 编号清单（与旧形态平滑衔接，rebuild 行匹配仍认）
          }
          extra.push(memMessage(`${SUPPLEMENT_HEAD_RENEW(++supp.version, session.seq)}\n${supp.doc}`))
          supp.docDirty = false
          supp.lastVersionStep = supp.steps
          dbg(`inject: 补注文档发版（${supp.doc.length} 字，新增 ${fresh.length} 条）`)
          return
        }
        markInjected(sid, project, list, source)
        if (supplementMode === 'append') { extra.push(memMessage(renderList(SUPPLEMENT_HEAD, list))); return }
        // 活节点已送出但还没定位到 seq：按 id 在转录里找（决策消息在本步被 dsh 落成 user/message）
        if (supp.id !== undefined && supp.seq === undefined) {
          const ev = session.events.find(e => e.type === 'user/message' && e.data?.id === supp.id)
          if (ev) { supp.seq = ev.seq; supp.pendingSteps = 0 }
          else if (++supp.pendingSteps > 4) { dbg(`inject: 补注活节点 ${supp.id} 4 步未落盘，视为丢失`); supp.id = undefined; supp.ids = []; supp.pendingSteps = 0 }
        }
        if (supp.seq !== undefined && isLiveNode(session, supp.seq)) {
          const ids = [...supp.ids.filter(id => !list.some(m => m.id === id)), ...list.map(m => m.id)]
          const all = ids.map(id => { const m = findById(store, id); return m ? resolveHead(store, m) : undefined }).filter(m => m && isActive(m))
          const msg = memMessage(renderList(SUPPLEMENT_HEAD, all))
          try {
            const prev = supp.seq
            const ev = session.append('user/message', msg, { surfaceOp: { op: 'replace', start: prev, end: prev }, sourceEventSeqs: [prev] })
            supp.seq = ev.seq; supp.id = msg.id; supp.ids = all.map(m => m.id)
            dbg(`inject: 补注活节点原地改写 seq ${prev} → ${ev.seq}（累计 ${all.length} 条，新增 ${list.length}）`)
            return
          } catch (e) { dbg(`inject: 补注活节点改写失败，改为新建 ${String(e).slice(0, 200)}`) }
        }
        const msg = memMessage(renderList(SUPPLEMENT_HEAD, list))
        extra.push(msg)
        a.supp = { id: msg.id, seq: undefined, ids: list.map(m => m.id), pendingSteps: 0 }
      }
      // ① 排队的主动补注先送（去掉期间已注/已失效的）；B：renew 模式受注版节流闸
      if (a.pendingInject.length && throttleOpen) {
        const fresh = a.pendingInject.splice(0).filter(m => isActive(m) && !a.injectedIds.has(m.id))
        if (fresh.length) deliver(fresh, 'proactive')
      }
      // ② 会话首条用户消息 → 任务补注（同步等挑选，超时改下一步送达）
      const firstUser = !a.taskDone ? (payload?.messages ?? []).find(m => m?.role === 'user' && m?.source?.kind === 'user') : undefined
      if (firstUser) {
        a.taskDone = true
        const query = textOf(firstUser).trim()
        const pool = notInjected(sid, project)
        if (query && pool.length && canSupplement(sid)) {
          const picked = pickMemories({ query, pool, sessionId: sid, allBelow: 0, purpose: 'trisoul-memory-inject' })
            .then(r => r.hits.slice(0, injectBatch)).catch((e) => { dbg(`inject: 任务补注挑选失败 ${String(e).slice(0, 200)}`); return [] })
          let timer
          const timeout = new Promise(res => { timer = setTimeout(() => res(undefined), injectPickTimeoutMs); timer.unref() })
          const hits = await Promise.race([picked, timeout])
          if (timer) clearTimeout(timer)
          if (hits === undefined) { dbg('inject: 任务补注挑选超时，改为下一步送达'); void picked.then(h => enqueuePending(sid, h)) }
          else if (hits.length) deliver(hits, 'task')
        }
      }
      // G1：消化的 workdoc 代谢改写了文档而本步没有别的发版 → 单独发一版（受同一节流闸；本步只发一版）
      if (supplementMode === 'renew' && a.supp.docDirty && a.supp.doc && throttleOpen && !extra.length) {
        extra.push(memMessage(`${SUPPLEMENT_HEAD_RENEW(++a.supp.version, session.seq)}\n${a.supp.doc}`))
        a.supp.docDirty = false
        a.supp.lastVersionStep = a.supp.steps
        dbg(`inject: 补注文档代谢版发布（${a.supp.doc.length} 字）`)
        report({ phase: 'inject', sessionId: sid, project, count: 0, source: 'renew-doc', ids: [] })
      }
      if (!extra.length) return decision
      return { ...decision, messages: [...extra, ...(Array.isArray(decision.messages) ? decision.messages : [])] }
    } catch (e) { warn(`补注失败(放行) ${String(e).slice(0, 200)}`); return decision }
  }, { global: true })

  // ---- 手术备料：预压缩稿查询（手术刀调用 ctx.bail('trisoul/memory-digest', {sessionId?, start, end}) → 文本或 undefined）----
  ctx.on('trisoul/memory-digest', (q) => lookupDigest(store, q ?? {}), { global: true })

  // ---- 手术判据（画布调用 ctx.bail('trisoul/memory-digested', {sessionId}) → [{start,end}]）----
  // 中枢是唯一读过内容的一方：已消化 + 有纪要 + 未标 compactable:false 的区间才准动刀。
  // 画布不再靠「表面总量撞阈值」决定何时整理（那是保险丝，见 dsh-canvas overThreshold）。
  ctx.on('trisoul/memory-digested', (q) => digestedRanges(store, q ?? {}), { global: true })

  // ---- 拉通道：recall 工具（按层过滤检索 + 按 seq 区间回捞原文）----
  const RECALL_CHARS = config.recallRawChars > 0 ? config.recallRawChars : 0   // 0 = 回捞原文不设字数上限
  const recallRaw = (session, range) => {
    const events = session.events
    const lo = Math.min(range.start, range.end), hi = Math.max(range.start, range.end)
    const items = []
    let total = 0, truncated = false
    for (const e of events) {
      if (e.seq < lo || e.seq > hi) continue
      const r = renderEvent(e, { skipPluginUser: true })
      if (!r) continue
      if (RECALL_CHARS > 0 && total + r.text.length > RECALL_CHARS) { truncated = true; break }
      total += r.text.length
      items.push(r)
    }
    return { items, truncated, lo, hi }
  }

  // ---- 挑选作业（#13，recall 与补注共用）：pool ≤ allBelow → 全部（mode all）；否则 LLM 按问题 + 状态区快照背景挑（mode llm）；
  //      失败 → 词面匹配按命中词数排序、不截（limit 默认 0；2026-08-18 用户令不砍前 N）（mode lexical）。返回 { hits, mode }。
  const canvasSnapshot = (sid) => {
    if (!sid) return ''
    let st
    try { st = ctx.bail?.('trisoul/canvas-state', sid) } catch { st = undefined }
    if (!st) return ''
    const parts = []
    if (Array.isArray(st.pinned) && st.pinned.length) parts.push(`Pinned: ${st.pinned.map(p => `· ${p}`).join(' ')}`)
    if (typeof st.status === 'string' && st.status.trim()) parts.push(`Status: ${st.status.trim()}`)
    return parts.join('\n')
  }
  // 08-30 S7：中文 query 没有空格，按空白切词整句成一个「词」→ 兜底恒 0 条。CJK 连续段改切二字组（单字段留单字），
  // 拉丁/数字整词照旧；纯标点/符号项剔除（「，」这类几乎所有条目都含，会给全员加分）
  const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]+/u
  const lexicalTerms = (query) => {
    const terms = new Set()
    for (const tok of query.toLowerCase().split(/\s+/).filter(Boolean)) {
      for (const part of tok.split(/([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]+)/u).filter(Boolean)) {
        if (/^[\p{P}\p{S}]+$/u.test(part)) continue
        if (!CJK.test(part)) { terms.add(part); continue }
        if (part.length === 1) terms.add(part)
        for (let i = 0; i + 1 < part.length; i++) terms.add(part.slice(i, i + 2))
      }
    }
    return [...terms]
  }
  const lexicalPick = (query, pool, limit = 0) => {
    const words = lexicalTerms(query)
    if (!words.length) return []
    return pool
      .map(m => ({ m, score: words.reduce((n, w) => n + (m.text.toLowerCase().includes(w) ? 1 : 0), 0) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.m)
      .slice(0, limit > 0 ? limit : undefined)
  }
  async function pickMemories({ query, pool, sessionId, allBelow = 8, purpose = 'trisoul-recall' }) {
    if (!pool.length) return { hits: [], mode: 'empty' }
    if (pool.length <= allBelow) return { hits: [...pool], mode: 'all' }
    try {
      const bg = canvasSnapshot(sessionId)
      const { text } = await runJob({
        purpose, sessionId,
        system: 'You are the memory retriever. Given the question (and the session\'s current state background), pick the relevant memory entries from the numbered candidates — better too few than too many. Output JSON only: {"indexes":[numbers]}; an empty array if nothing is relevant.',
        prompt: `${bg ? `Background (snapshot of the session's current working state):\n${bg}\n\n` : ''}Question: ${query}\n\nCandidate memories:\n${pool.map((m, i) => `${i}. [id=${m.id} · ${SCOPE_LABEL[m.scope] ?? m.scope}] ${m.text}`).join('\n')}`,
        ...(config.recallMaxTokens > 0 ? { maxTokens: config.recallMaxTokens } : {}), // 默认不设（推理模型的思考也计入预算）
      })
      const idx = parseJson(text)?.indexes ?? []
      const hits = [...new Set((Array.isArray(idx) ? idx : []).filter(i => Number.isInteger(i) && pool[i] !== undefined))].map(i => pool[i])
      return { hits, mode: 'llm' }
    } catch (e) {
      dbg(`pick: LLM 失败退化词面匹配 ${String(e).slice(0, 200)}`)
      return { hits: lexicalPick(query, pool), mode: 'lexical' }
    }
  }

  ctx.tools.register({
    name: 'trisoul_recall',
    description: 'Search your long-term memory, or retrieve the verbatim text behind a condensed work record. ' +
      '(1) Recall: pass query (natural language) to get related memories (scoped to what this project can see: global + cross-project + this project); optionally narrow with scope. ' +
      '(2) Retrieve originals: condensed records in the context are tagged with "seq a..b" — when you need the original content that was condensed away, pass seqRange:{start:a,end:b} to get the raw event text of that span verbatim (no model rewriting).',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to recall (natural language); when retrieving originals, state the purpose' },
        scope: { type: 'string', enum: ['all', 'global', 'cross', 'project'], description: 'Memory layer: all (default, everything visible to this project) / global / cross (cross-project) / project (this project)' },
        seqRange: {
          type: 'object',
          description: 'Retrieve originals: session event seq range (inclusive), from the "seq a..b" tag on a condensed record',
          properties: { start: { type: 'integer' }, end: { type: 'integer' } },
          required: ['start', 'end'],
          additionalProperties: false,
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          memories: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' },
          events: { type: 'array', items: { type: 'object', properties: { seq: { type: 'integer' }, role: { type: 'string' }, text: { type: 'string' } }, required: ['seq', 'role', 'text'], additionalProperties: false } },
        },
        required: ['memories', 'summary'],
        additionalProperties: false,
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.summary + '\n' + (Array.isArray(value.events) && value.events.length
          ? value.events.map(e => `  [seq ${e.seq} ${e.role}] ${e.text}`).join('\n')
          : value.memories.length
            ? value.memories.map((m, i) => `  ${i + 1}. ${m}`).join('\n')
            : '  (no relevant memories)'),
      }],
    },
    async execute(args, exec) {
      const query = String(args?.query ?? '')
      const session = exec?.agent?.session
      const project = projectOf(session)
      // 回捞原文
      if (args?.seqRange && Number.isInteger(args.seqRange.start) && Number.isInteger(args.seqRange.end)) {
        if (!session) return { memories: [], summary: '[memory] Retrieval failed: this call has no bound session, cannot read the event log' }
        const { items, truncated, lo, hi } = recallRaw(session, args.seqRange)
        dbg(`recall raw: seq ${lo}..${hi} → ${items.length} 条${truncated ? '（截断）' : ''}`)
        report({ phase: 'recall', kind: 'raw', sessionId: session.id, seqRange: { start: lo, end: hi }, items: items.length, truncated: !!truncated })
        return {
          memories: [],
          events: items.map(r => ({ seq: r.seq, role: r.role, text: r.text })),
          summary: `[memory] Retrieved ${items.length} raw events from seq ${lo}..${hi}${truncated ? ` (truncated at the ${RECALL_CHARS}-char cap; narrow the range and retry)` : ''}${items.length ? '' : ' — no readable conversation events in this span'}`,
        }
      }
      // 回忆（半径内检索：project 档池子只剩 project 层，session 档只剩本会话条目——此时 scope 参数只会滤空，语义上等同 all）
      const scope = SCOPES.includes(args?.scope) ? args.scope : 'all'
      const radius = session?.id ? radiusOf(session.id) : { cap: 'full' }
      const pool = visibleMemories(store, project, radius).filter(m => scope === 'all' || m.scope === scope)
      dbg(`recall: "${query}" scope=${scope} project=${project} (可见 ${pool.length}/${store.memories.length})`)
      const { hits, mode } = await pickMemories({ query, pool, sessionId: session?.id })
      if (hits.length) { noteUsageAll(hits, 'recalled', { sessionId: session?.id }); persistSoon() }  // 命中即使用痕迹（#10）；S5：防抖不卡工具返回
      report({ phase: 'recall', kind: 'memory', sessionId: session?.id ?? null, project, query: query.slice(0, 200), scope, visible: pool.length, hits: hits.length, mode })
      const memories = hits.map(formatMemoryLine)
      const summary = mode === 'empty' ? `[memory] ${scope === 'all' ? 'No memories visible to this project' : `No ${scope}-scope memories`}`
        : mode === 'all' ? `[memory] Small store — returning all ${pool.length} memories`
        : mode === 'llm' ? `[memory] Found ${hits.length} relevant memories out of ${pool.length} visible`
        : `[memory] Lexical match found ${hits.length} memories (LLM retrieval failed; degraded)`
      return { memories, summary }
    },
  })

  // ---- HTTP API（记忆库唯一所有者对外暴露：只读列表 + 用户直接编辑）：供 @trisoul/dsh-client-memory-ui 拉取/编辑。
  // 路由归 /trisoul/ 命名空间（/api 前缀归官方 apiProxy），按 prefix 注册一条、handler 内按 method+子路径分发。
  // disposer 交给 ctx.effect：热替换时路由随之注销。JSON 进出；错误 400（参数非法/JSON 坏）/404（id 不存在或路径未知）/
  // 405（方法不支持）/409（状态冲突：重复文本、目标已退役/已覆盖、未退役却要恢复）。
  //   GET    /trisoul/api/memory?scope=project|cross|global&project=<cwd>&includeSuperseded=1   → { memories, counts, projects, ... }
  //          ?sessionId=<sid>[&sessionOnly=1] → 附 session:{id,project,known,injected,recalls,rawRecalls,digests,touched}；每条加 visible（对该会话项目可见）/ touched（本会话消化产出）；
  //          sessionOnly=1 时列表只留对该会话可见的条目（project 参数缺席时）
  //   POST   /trisoul/api/memory              body {text, scope?='project', key?, project?}     → 201 { action:'added'|'updated', memory }
  //          （同 key 活跃条目存在时按 store 语义就地更新=supersede；同文本已存在 409）
  //   PATCH  /trisoul/api/memory/:id          body {text?, scope?, key?, project?}              → 200 { action:'updated', memory }
  //          （走 applyOps update：新条目 supersede 旧条目并带 history，source:'user'；允许降级 scope/改绑 project；无变化 200 action:'unchanged'）
  //   DELETE /trisoul/api/memory/:id                                                             → 200 { action:'retired', memory }（软删）
  //   DELETE /trisoul/api/memory/:id?hard=1                                                      → 200 { action:'deleted', deleted:[ids] }（物理删该条及其覆盖链上游）
  //   POST   /trisoul/api/memory/:id/restore                                                     → 200 { action:'restored', memory }
  //   POST   /trisoul/api/memory/batch        body {action:'retire'|'restore'|'delete'|'scope', ids:[…], scope?, project?}
  //          → 200 { action, memories|deleted, skipped:[{id,reason}] }（批量：逐条给跳过理由，部分成功不整体报错；400 仅入参形状非法）
  const ROUTE = '/trisoul/api/memory'
  const toWire = (m) => ({
    id: m.id, key: m.key, text: m.text, scope: m.scope, project: m.project, ...(m.session ? { session: m.session } : {}),
    ts: m.ts, updatedAt: m.updatedAt ?? m.ts, timestamp: m.ts, // timestamp = 旧字段兼容
    superseded: !isActive(m), retired: !!m.retiredAt,
    supersededBy: m.supersededBy, retiredAt: m.retiredAt, retiredReason: m.retiredReason, restoredAt: m.restoredAt,
    source: m.source, origin: m.origin, history: m.history ?? [],
    usage: m.usage ? { ...m.usage } : emptyUsage(),
  })
  const json = (res, status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
    res.end(JSON.stringify(body))
  }
  const readJson = async (req, limit = 256 * 1024) => {
    const chunks = []
    let size = 0
    for await (const chunk of req) {
      const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk
      size += buf.length
      if (size > limit) throw new Error('request body too large')
      chunks.push(buf)
    }
    const text = Buffer.concat(chunks).toString('utf8').trim()
    if (!text) return {}
    const parsed = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('body must be a JSON object')
    return parsed
  }
  const truthy = (v) => ['1', 'true', 'yes'].includes(String(v ?? '').toLowerCase())
  const optStr = (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)
  const isNil = (v) => v === undefined || v === null
  /** 会话 → 项目键：活着的 agent 会话（ctx.agents）优先，其次消化队列/活动账本里记下的 project。 */
  const projectForSession = (sid) => {
    let session
    try { session = ctx.agents?.get(sid)?.session } catch { session = undefined }
    if (!session) { try { session = ctx.sessions?.get(sid) } catch { session = undefined } }   // 打开但没在跑的会话（agent 未起）
    if (session) return projectOf(session)
    const known = pending.get(sid)?.project ?? activity.get(sid)?.project
    if (known) return known
    // 最后回退：该会话过去的预压缩稿记了 project
    for (let i = store.digests.length - 1; i >= 0; i--) { const d = store.digests[i]; if (d.sessionId === sid && d.project) return d.project }
    return undefined
  }
  /** GET ?sessionId= 的 session 段：项目键 + 注入/召回/消化活动 + 本会话消化产出的记忆 id。 */
  const sessionInfo = (sid) => {
    const project = projectForSession(sid) ?? null
    const a = activity.get(sid)
    return {
      id: sid, project, known: project !== null,
      memoryScope: store.sessionScopes[sid] ?? null,   // 该会话绑定的范围档（null = 尚未触达中枢）
      injected: a?.injected ? { ...a.injected, ids: [...a.injectedIds] } : null,
      recalls: a ? [...a.recalls] : [],
      rawRecalls: a?.raw.count ?? 0,
      digests: a ? { ...a.digests } : { ok: 0, fail: 0, ts: null },
      touched: a ? [...a.touched] : [],
    }
  }
  /** 自检（#11）：库规模/分层、usage 汇总、整理分片状态、进程内注入/召回计数。GET /trisoul/api/memory 的 health 段；bail trisoul/memory-health 同源。 */
  const healthOf = () => {
    const active = store.memories.filter(isActive)
    let injectedTotal = 0, recalledTotal = 0, neverUsed = 0
    for (const m of active) {
      const i = Number(m.usage?.injected) || 0, r = Number(m.usage?.recalled) || 0
      injectedTotal += i; recalledTotal += r
      if (i + r === 0) neverUsed++
    }
    // C3（2026-08-31 perf-audit）：crossCandidates（O(n²) 近似匹配）单次调用只算一次——旧写法 shardsOf + 逐分片 shardDirty 各自重算，同一请求 2~3 遍
    const cross = crossCandidates(store)
    const shards = shardsOf(store, cross).map(shard => ({
      shard, entries: shardEntries(store, shard).length,
      lastAt: store.curate.lastAt[shard] ?? null, cursor: store.curate.cursors[shard] ?? 0, dirty: shardDirty(store, shard, cross),
    }))
    const lastAts = shards.map(s => s.lastAt).filter(v => Number.isFinite(v))
    return {
      entries: store.memories.length, active: active.length,
      byScope: Object.fromEntries([...SCOPES, 'session'].map(sc => [sc, active.filter(m => m.scope === sc).length])),
      usage: { injectedTotal, recalledTotal, neverUsed },
      curate: { lastAt: lastAts.length ? Math.max(...lastAts) : null, shards },
      ...counters,
    }
  }
  ctx.on('trisoul/memory-health', () => healthOf(), { global: true })
  const listMemories = (params, res) => {
    const scope = params.get('scope')
    const sessionId = optStr(params.get('sessionId'))
    const session = sessionId ? sessionInfo(sessionId) : undefined
    const project = params.get('project') || (truthy(params.get('sessionOnly')) ? session?.project : undefined)
    const includeSuperseded = truthy(params.get('includeSuperseded'))
    // 记忆页是全局视图：session 条目也列出（scope 显示「本会话」）；按 project 过滤时放行该会话自己的私有条目
    const list = store.memories.filter(m =>
      (includeSuperseded || isActive(m)) &&
      (!scope || scope === 'all' || m.scope === scope) &&
      (!project || visibleTo(m, project) || (m.scope === 'session' && !!sessionId && m.session === sessionId)))
    const touched = session ? new Set(session.touched) : undefined
    // visible = 按该会话绑定的范围档判（终审 F2）：session 档会话的私有条目 visible=true、公共条目 false——「本会话」取景如实反映半径
    const cap = sessionId ? normalizeCap(store.sessionScopes[sessionId] ?? 'full') : 'full'
    const wire = session?.project
      ? (m) => ({ ...toWire(m), visible: visibleTo(m, session.project, { cap, session: sessionId }), touched: touched.has(m.id) })
      : session ? (m) => ({ ...toWire(m), touched: touched.has(m.id) }) : toWire
    const health = healthOf()   // C3：counts 与 health 同源复用，免同请求三遍全表扫
    json(res, 200, {
      memories: list.map(wire),
      ...(session ? { session } : {}),
      cursorBySession: { ...store.cursor },
      digestsCount: store.digests.length,
      storePath,
      health,
      // C3：entries/active/byScope 与旧三遍 filter 语义逐字节一致（health 内已按 isActive 同判据算过）
      counts: { total: health.entries, active: health.active, byScope: health.byScope },
      projects: [...new Set(store.memories.filter(m => m.project).map(m => m.project))],
    })
  }
  /** 用户写操作统一收口：manual 模式 applyOps + 落盘 + 日志。 */
  const userOps = (ops, project) => {
    const r = applyOps(store, ops, { project, source: 'user', manual: true })
    if (r.added.length || r.updated.length || r.retired.length) persist()
    return r
  }
  /** 校验 {text,scope,key,project} 字段形态；返回错误文案或 undefined。 */
  const fieldProblem = (body) => {
    if (!isNil(body.text) && typeof body.text !== 'string') return 'text 须为字符串'
    if (!isNil(body.scope) && body.scope !== '' && !SCOPES.includes(body.scope)) return `scope 非法：${String(body.scope)}（可选 ${SCOPES.join('|')}）`
    if (!isNil(body.key) && typeof body.key !== 'string') return 'key 须为字符串'
    if (!isNil(body.project) && typeof body.project !== 'string') return 'project 须为字符串'
    return undefined
  }
  // ---- 范围档改绑（composer 的记忆范围 chip）----
  // dsh 打开「新会话」页时 agent 已 start：开场注入与默认档绑定即刻发生。所以「创建时定死」的可选窗口
  // 是对话开始前（还没有用户消息/模型回复）：此时会话没有任何 LLM 调用、没有前缀缓存可砸，把开场注入
  // 原地改写（surfaceOp replace，补注活节点同机制）零成本——铁律「历史前部禁止原地改写」护的是已进缓存的前缀。
  // 一旦对话开始（读进来兜不住）→ locked，真正定死。
  const conversationStarted = (session) => {
    for (const e of session.events) {
      if (e.type === 'assistant/message') return true
      if (e.type === 'user/message' && e.data?.source?.kind === 'user') return true
    }
    return false
  }
  const agentObjOf = (sid) => { try { return ctx.agents?.get(sid) } catch { return undefined } }
  const sessionObjOf = (sid) => {
    let session = agentObjOf(sid)?.session
    if (!session) { try { session = ctx.sessions?.get(sid) } catch { session = undefined } }
    return session
  }
  // 2026-08-25 用户令:尾句「stable facts …can be searched with trisoul_recall」删除——
  // 病例 9bd772f3:该句教模型「本会话事实可搜」,它当场编出 scope:"session" 反复搜自己刚做的工作。
  const SESSION_SOLO_NOTE = "[Memory] This session's memory is standalone (session-scoped): the shared memory store is neither read nor written."
  const isOurNote = (msg) => msg?.source?.kind === 'plugin' && msg?.source?.plugin === 'trisoul-memory'
    && (textOf(msg).startsWith('[Long-term memory') || textOf(msg).startsWith('[Memory]')
      || textOf(msg).startsWith('【记忆中枢注入') || textOf(msg).startsWith('【记忆中枢】'))
  /** blank 会话的开场注入还躺在 agent inbox（尚未落地为 user/message 事件）：从两个 pending 列表里找我方消息 */
  const pendingOpening = (agent) => {
    for (const list of [agent?.inbox?.nextStep, agent?.inbox?.nextTurn])
      for (const m of (Array.isArray(list) ? list : [])) if (isOurNote(m)) return m
    return undefined
  }
  /** 本会话当前活表面上的我方开场注入消息（改绑可能已换过一代：取活着的那条） */
  const liveOpening = (session) => {
    return session.events.find(e => e.type === 'user/message' && isOurNote(e.data) && isLiveNode(session, e.seq))
  }
  const rebindScope = (sid, scope) => {
    const agent = agentObjOf(sid)
    const session = sessionObjOf(sid)
    if (!session) return { error: 'session-unavailable' }
    if (conversationStarted(session)) return { error: 'locked' }
    const prev = store.sessionScopes[sid]
    store.sessionScopes[sid] = scope
    const a = activityOf(sid)
    let reinjected = -1
    const project = projectOf(session)
    const renderOpening = () => {
      const list = openingMemories(store, project, { limit: injectLimit, cap: scope, session: sid })
      const text = list.length ? renderList(OPENING_HEAD(project), list)
        : scope === 'session' ? SESSION_SOLO_NOTE : `${OPENING_HEAD(project)}\n(no memories in the current scope yet)`
      return { list, text }
    }
    const commit = (list) => { a.injectedIds = new Set(list.map(m => m.id)); reinjected = list.length; if (list.length) noteUsageAll(list, 'injected', { sessionId: sid }) }
    // 主路径：注入还在 inbox（blank 会话的真实形态——inject 进 inbox，发消息前不产生 user/message 事件）
    const inboxMsg = pendingOpening(agent)
    if (inboxMsg && typeof agent?.inbox?.replace === 'function') {
      const { list, text } = renderOpening()
      try { agent.inbox.replace(inboxMsg.id, memMessage(text)); commit(list) }
      catch (e) { dbg(`scope: 改绑改写 inbox 失败 ${String(e).slice(0, 200)}`) }
    }
    // 回落：注入已落地为 user/message（内存假会话/宿主形态差异）→ 活表面原地改写
    if (reinjected < 0) {
      const opening = liveOpening(session)
      if (opening && typeof session.append === 'function') {
        const { list, text } = renderOpening()
        try {
          session.append('user/message', memMessage(text), { surfaceOp: { op: 'replace', start: opening.seq, end: opening.seq }, sourceEventSeqs: [opening.seq] })
          commit(list)
        } catch (e) { dbg(`scope: 改绑重注失败 ${String(e).slice(0, 200)}`) }
      }
    }
    persist()
    info(`会话 ${sid} 范围档改绑 ${prev ?? '(未绑)'} → ${scope}（开场注入改写为 ${reinjected < 0 ? 0 : reinjected} 条）`)
    return { scope, reinjected: reinjected < 0 ? 0 : reinjected }
  }

  // ---- 批量管理（记忆页多选）----
  const BATCH_ACTIONS = ['retire', 'restore', 'delete', 'scope']
  /**
   * 一次请求处理一批 id、一次落盘——不给 UI 循环打 N 次请求的机会（N 次落盘 + N 次列表刷新）。
   * retire/scope 聚合成一次 applyOps；restore/delete 数据层是单条动作，在这里循环后统一 persist。
   * 部分成功不整体 4xx：批量里混进一条已退役/坏 id 不该拖垮其余，逐条进 skipped 给理由；400 只留给入参形状非法。
   */
  const handleBatch = (body, res) => {
    const action = typeof body.action === 'string' ? body.action : ''
    if (!BATCH_ACTIONS.includes(action)) return json(res, 400, { error: `action 非法：${String(body.action)}（可选 ${BATCH_ACTIONS.join('|')}）` })
    if (!Array.isArray(body.ids) || body.ids.length === 0 || body.ids.some(v => typeof v !== 'string' || !v.trim()))
      return json(res, 400, { error: 'ids 须为非空字符串数组' })
    if (action === 'scope' && !SCOPES.includes(body.scope)) return json(res, 400, { error: `scope 非法：${String(body.scope)}（可选 ${SCOPES.join('|')}）` })
    if (!isNil(body.project) && typeof body.project !== 'string') return json(res, 400, { error: 'project 须为字符串' })
    const ids = [...new Set(body.ids.map(s => s.trim()))]
    const skipped = []
    if (action === 'restore') {
      const done = []
      for (const mid of ids) {
        const r = restoreMemory(store, mid)
        if (r.error) { skipped.push({ id: mid, reason: r.error }); continue }
        done.push(r.entry)
      }
      if (done.length) persist()
      info(`用户批量恢复记忆 ${done.length} 条${skipped.length ? `（跳过 ${skipped.length}）` : ''}`)
      return json(res, 200, { action: 'restored', memories: done.map(toWire), skipped })
    }
    if (action === 'delete') {
      const deleted = []
      const gone = new Set()
      for (const mid of ids) {
        if (gone.has(mid)) continue   // 同批里被前面条目的覆盖链连带删掉：目的已达成，不算跳过
        const removed = hardDeleteMemory(store, mid)
        if (!removed.length) { skipped.push({ id: mid, reason: 'not-found' }); continue }
        for (const m of removed) { deleted.push(m.id); gone.add(m.id) }
      }
      if (deleted.length) persist()
      info(`用户批量物理删除记忆 ${deleted.length} 条${skipped.length ? `（跳过 ${skipped.length}）` : ''}`)
      return json(res, 200, { action: 'deleted', deleted, skipped })
    }
    // retire / scope：目标校验放端点层——applyOps 的 skipped 以 op 为键，映射不回用户勾选的 id
    const ops = []
    const heads = new Set()
    for (const mid of ids) {
      const entry = findById(store, mid)
      if (!entry) { skipped.push({ id: mid, reason: 'not-found' }); continue }
      const head = resolveHead(store, entry)
      if (!isActive(head)) { skipped.push({ id: mid, reason: head.retiredAt ? 'already-retired' : 'superseded' }); continue }
      if (heads.has(head.id)) { skipped.push({ id: mid, reason: 'duplicate-target' }); continue }   // 旧版本与头部同选：只动一次
      heads.add(head.id)
      if (action === 'retire') { ops.push({ op: 'retire', target: head.id }); continue }
      if (head.scope === body.scope) { skipped.push({ id: mid, reason: 'no-change' }); continue }
      // 改层到 project 需要项目绑定：取请求给的 project（UI 传当前取景的项目）——store 语义下条目离开
      // project 层时绑定就被剥掉了，head.project 只为遗留数据兜底。没绑定就跳过而不是照写：
      // 无绑定的 project 条目任何项目都看不见，等于凭空消失（单条 PATCH 存在这个坑，批量不复制它）
      const bind = head.project ?? optStr(body.project)
      if (body.scope === 'project' && !bind) { skipped.push({ id: mid, reason: 'missing-project' }); continue }
      ops.push({ op: 'update', target: head.id, text: head.text, scope: body.scope, key: head.key, ...(bind ? { project: bind } : {}) })
    }
    const r = ops.length ? userOps(ops) : { retired: [], updated: [], skipped: [] }
    for (const s of r.skipped) skipped.push({ id: s.id ?? s.target ?? '', reason: s.reason })   // 兜底：正常都在上面拦掉了
    const done = action === 'retire' ? r.retired : r.updated
    info(`用户批量${action === 'retire' ? '退役' : '改层级'}记忆 ${done.length} 条${skipped.length ? `（跳过 ${skipped.length}）` : ''}`)
    return json(res, 200, { action: action === 'retire' ? 'retired' : 'updated', memories: done.map(toWire), skipped })
  }
  const handleHttp = async (req, res) => {
    let url
    try { url = new URL(req?.url ?? '/', 'http://x') } catch { url = new URL('/', 'http://x') }
    const method = String(req?.method ?? 'GET').toUpperCase()
    const rest = url.pathname === ROUTE ? '' : url.pathname.startsWith(`${ROUTE}/`) ? url.pathname.slice(ROUTE.length) : undefined
    if (rest === undefined) return json(res, 404, { error: 'not found' })
    let segs
    try { segs = rest.split('/').filter(Boolean).map(decodeURIComponent) } catch { return json(res, 400, { error: 'bad path encoding' }) }
    try {
      // 集合：GET 列表（同步应答，不经 await）/ POST 新增
      if (segs.length === 0) {
        if (method === 'GET' || method === 'HEAD') return listMemories(url.searchParams, res)
        if (method !== 'POST') return json(res, 405, { error: 'method not allowed' })
        const body = await readJson(req)
        const problem = fieldProblem(body)
        if (problem) return json(res, 400, { error: problem })
        const text = optStr(body.text)
        if (!text) return json(res, 400, { error: 'text 必填（非空字符串）' })
        const scope = optStr(body.scope) ?? 'project'
        const project = optStr(body.project)
        const r = userOps([{ op: 'add', text, scope, key: optStr(body.key), project }], project)
        const entry = r.added[0] ?? r.updated[0]
        if (!entry) {
          const why = r.skipped[0]
          if (why?.reason === 'duplicate-text') return json(res, 409, { error: '同样文本的记忆已存在', id: why.id })
          return json(res, 409, { error: `未写入：${why?.reason ?? 'unknown'}` })
        }
        info(`用户${r.added.length ? '新增' : '更新'}记忆 ${entry.id} [${entry.scope}] ${entry.text.slice(0, 60)}`)
        return json(res, 201, { action: r.added.length ? 'added' : 'updated', memory: toWire(entry) })
      }
      // 批量（先于单条 id 匹配：'batch' 是保留路径，不会撞真实 id 的 m_ 前缀）
      if (segs.length === 1 && segs[0] === 'batch') {
        if (method !== 'POST') return json(res, 405, { error: 'method not allowed' })
        return handleBatch(await readJson(req), res)
      }
      // 范围档：GET 查（chip 初始状态）/ POST 改绑（仅对话开始前）——'session-scope' 同为保留路径
      if (segs.length === 1 && segs[0] === 'session-scope') {
        if (method === 'GET' || method === 'HEAD') {
          const sid = optStr(url.searchParams.get('sessionId'))
          if (!sid) return json(res, 400, { error: 'sessionId 必填' })
          const bound = store.sessionScopes[sid] ?? null
          const session = sessionObjOf(sid)
          // 拿不到会话对象时的锁定判断保守：已绑 = 按锁定（宁可少给一次改绑机会）
          const locked = session ? conversationStarted(session) : bound !== null
          return json(res, 200, { scope: bound, locked, default: capForNew() })
        }
        if (method !== 'POST') return json(res, 405, { error: 'method not allowed' })
        const body = await readJson(req)
        const sid = optStr(body.sessionId)
        if (!sid) return json(res, 400, { error: 'sessionId 必填' })
        if (!CAPS.includes(body.scope)) return json(res, 400, { error: `scope 非法：${String(body.scope)}（可选 ${CAPS.join('|')}）` })
        const r = rebindScope(sid, body.scope)
        if (r.error === 'locked') return json(res, 409, { error: '对话已开始，范围档已定死（创建时定死，不可中途切换）', locked: true })
        if (r.error) return json(res, 409, { error: `改绑失败：${r.error}` })
        return json(res, 200, { scope: r.scope, reinjected: r.reinjected, locked: false })
      }
      // 单条：先查 id，不存在一律 404
      const id = segs[0]
      const entry = findById(store, id)
      if (!entry) return json(res, 404, { error: `memory ${id} not found` })
      if (segs.length === 1) {
        if (method === 'PATCH' || method === 'PUT') {
          const body = await readJson(req)
          const problem = fieldProblem(body)
          if (problem) return json(res, 400, { error: problem })
          const head = resolveHead(store, entry)  // 旧版本 id 也认，落到覆盖链头部
          if (!isActive(head)) return json(res, 409, { error: head.retiredAt ? '该记忆已退役，先恢复再编辑' : '该记忆已被覆盖且头部不可用' })
          const text = isNil(body.text) ? head.text : body.text.trim()
          if (!text) return json(res, 400, { error: 'text 不能为空' })
          const scope = optStr(body.scope) ?? head.scope
          const project = optStr(body.project) ?? head.project
          const r = userOps([{ op: 'update', target: head.id, text, scope, key: optStr(body.key) ?? head.key, project }], project)
          if (r.updated[0]) {
            info(`用户更新记忆 ${head.id} → ${r.updated[0].id} [${r.updated[0].scope}]`)
            return json(res, 200, { action: 'updated', memory: toWire(r.updated[0]) })
          }
          const why = r.skipped[0]
          if (why?.reason === 'no-change') return json(res, 200, { action: 'unchanged', memory: toWire(head) })
          if (why?.reason === 'duplicate-text') return json(res, 409, { error: '同样文本的记忆已存在', id: why.id })
          return json(res, 409, { error: `未写入：${why?.reason ?? 'unknown'}` })
        }
        if (method === 'DELETE') {
          if (truthy(url.searchParams.get('hard'))) {
            const removed = hardDeleteMemory(store, entry.id)
            persist()
            info(`用户物理删除记忆 ${entry.id}（连同覆盖链 ${removed.length} 条）`)
            return json(res, 200, { action: 'deleted', deleted: removed.map(m => m.id) })
          }
          const head = resolveHead(store, entry)
          if (!isActive(head)) return json(res, 409, { error: head.retiredAt ? '该记忆已退役' : '该记忆已被覆盖，无需退役' })
          const r = userOps([{ op: 'retire', target: head.id }], head.project)
          if (!r.retired[0]) return json(res, 409, { error: `未退役：${r.skipped[0]?.reason ?? 'unknown'}` })
          info(`用户退役记忆 ${head.id}`)
          return json(res, 200, { action: 'retired', memory: toWire(r.retired[0]) })
        }
        return json(res, 405, { error: 'method not allowed' })
      }
      if (segs.length === 2 && segs[1] === 'restore') {
        if (method !== 'POST') return json(res, 405, { error: 'method not allowed' })
        const r = restoreMemory(store, entry.id)
        if (r.error === 'not-retired') return json(res, 409, { error: entry.supersededBy ? '该条是被覆盖的旧版本，不是退役条目' : '该记忆未退役' })
        persist()
        info(`用户恢复记忆 ${entry.id}`)
        return json(res, 200, { action: 'restored', memory: toWire(r.entry) })
      }
      return json(res, 404, { error: 'not found' })
    } catch (e) {
      const msg = String(e?.message ?? e)
      const status = /JSON|body/i.test(msg) ? 400 : 500
      if (status === 500) warn(`HTTP ${method} ${url.pathname} 失败 ${msg.slice(0, 200)}`)
      return json(res, status, { error: msg })
    }
  }
  // HTTP 路由只在有 webServer 的 profile（web）里挂；headless/评测容器无此服务时中枢照常工作（无 UI 而已）
  ctx.inject(['webServer'], (sctx) => {
    sctx.effect(() => sctx.webServer.register({ kind: 'prefix', path: ROUTE, handler: handleHttp }), 'trisoul-memory: /trisoul/api/memory route')
  })

  // 启动即有待整理分片（首次装库 / 上次没轮完）→ 空闲后开始轮巡
  if (pickShard()) armIdleFlush()

  return {
    store, storePath, pending, effortResolver,
    digestSession: (sid) => digestSession(sid, { force: true }),
    digestNext, curate, scheduleCurate, armIdle: armIdleFlush, handleHttp, persist,
    visible: (project) => visibleMemories(store, project),
  }
}

export function apply(ctx, config = {}) {
  createMemoryHub(ctx, config)
}
