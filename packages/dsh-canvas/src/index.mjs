// TriSoul 画布编排器（M5 + C：状态区/探针）：步边界手术调度 + 会话内三分区状态维护 + 手术验收
// - 钩 agent/pre-step（waterfall，dispatcher 会把 agent 注入 payload）
// - 每步边界向记忆中枢要手术判据（bail 'trisoul/memory-digested' → 已消化且可压的 seq 区间，带 phaseClosedAt 阶段收尾点：
//   该点之前连未消化的洞也视为可整理），圈其中最老的连续段交给手术刀；
//   中枢缺席/落后时才退回「表面总量撞阈值 → 圈最老连续段」的保险丝（2026-08-18：整理由语义驱动，不再由字数驱动）
// - 恒真区（用户原话 + 运行时快照 + 本插件注入的状态区消息）永不入区间（canvas 跳过 + surgeon 拒收，双保险）；
//   区间沿 dsh 位置序活表面（session.surface.nodes）圈定——替换者占据被替换者的位置，按 seq 圈会漏掉位置上在区间里的活状态消息
// - 直通项（P1-2，2026-08-19）：手术检查点 / 记忆注入 / 其它非快照插件消息——不切断连续段、可入区间、不要求被中枢消化；
//   区间含 ≥2 个检查点即可合并（不看 token 门槛）：检查点可合并不可丢——旧「检查点钉死」让 74 刀检查点永不合并，长会话末步 44% 的 prompt 是检查点
// - 状态区（state.mjs）：LLM 小作业增量提炼恒真条目/状态摘要；P2-2 换代制——变更时尾部 append 新版
//   （纯追加零缓存破坏），只钉最新一版，旧版由下一刀顺路吞掉；ctx.bail('trisoul/canvas-state')
// - 探针（probe.mjs）：手术成功后出 1 道事实题拿检查点作答验收；失败仅告警不回滚；
//   P2-3 补记搭车——验收未过的问答攒着随下一刀写进新检查点（不再单独改写检查点烧缓存）
// - 手术/状态/探针失败都绝不阻塞主循环（catch 后放行 next()）
// 零 dsh 包依赖：surface 判据用 event.surfaceOp !== undefined（对齐 dsh-session isSurfaceEvent 源码）。
//
// config（2026-08-18 用户令：不要任何截断/预算类限制——下列字数/条数/输出上限默认全部不设，只在用户显式给正数时生效）：
//   手术：digested(true，用中枢的已消化区间当主判据；false = 只用阈值)
//         thresholdRatio(0.5，保险丝 = 主模型上下文窗口 × 比例，按 token 粗估表面总量；窗口来自 session.requestContext().contextWindow)
//         thresholdChars(0=自动；>0 时退回固定字符阈值旧语义) thresholdFallbackChars(1_000_000，窗口未知时的字符兜底)
//         keepTailEvents(30) minRegionEvents(3) minRegionTokens(4000，按真实内容估 token：user 文本 / assistant 正文+工具参数 / 工具结果，不含 reasoning；
//         P2-1：两个 minRegion 门槛都只计非检查点的新材料——检查点自身不计入，否则门槛永真每步动刀；
//         旧 minRegionChars 仍认，按 ÷3.5 折成 token) mergeCheckpoints(true；false = 检查点钉死的旧行为，A/B 对照) failCooldownSteps(3，同区间连败按连败次数放大)
//         surgeryCooldownSteps(3，连刀冷却：手术成功后歇 N 步再动刀——相邻步连刀每刀都砸一次前缀缓存，隔开让区间攒大合并；0 = 关)
//   小作业：provider/model（缺省 ark/deepseek-v4-flash；ctx.bail('trisoul/ai-config','canvas') 实时配置优先）
//           effort('off'|'inherit'，默认 off 经能力门控) jobTimeoutMs(120000)
//   遮蔽刀：shadowStale(⑦ 默认 0=关；>0 时同源换代注入——状态区/补注——活表面上已换代旧版 ≥N → pre-step 直接 replace 成空 assistant 删除件)
//   状态区：state(true) stateEvery(8) stateBatchMax(0=不限) statePinnedMax(0=不限) stateEventChars(0=全文) stateMaxTokens(0=不设)
//           stateFailCooldownSteps(3)
//   探针：probe(true) probeSourceChars(0=全文) probeMaxTokens(0=不设)
//         probePatch('ride'=补记攒着随下一刀写入，默认 | 'qa'=立即改写检查点补一行（旧行为）| 'material'=立即贴整份材料（更旧）)
//         probePatchChars(material 模式：0=全文)
// 契约：
//   ctx.bail('trisoul/canvas-state', sessionId) → { pinned:string[], status:string } | undefined
//   ctx.emit('trisoul/canvas', info)：
//     { phase:'surgery', start, end, chars, total, ok, sessionId, durationMs, compactionId?, checkpointChars? | error? }
//     { phase:'state', ok, sessionId, seqRange:{start,end}, durationMs, pinned?, pinnedAdded?, statusChars? | error? }
//     { phase:'probe', ok, sessionId, seqRange:{start,end}, durationMs, question?, expected?, got?, source?:'memory-digest'|'raw' | error? }
import { appendFileSync } from 'node:fs'
import { createJobRunner } from './job.mjs'
import { createStateZone } from './state.mjs'
import { createProber } from './probe.mjs'
import { surfaceEvents } from './surface.mjs'
import { contentTextOf } from './render.mjs'

export const name = 'trisoul-canvas'
export const inject = ['compaction', 'llm']

// debug 日志默认写 cwd；评测容器等场景用 TRISOUL_DEBUG_DIR 指到别处（免得混进被评测仓库的 git 工作区）
const DBG_PATH = `${process.env.TRISOUL_DEBUG_DIR || '.'}/trisoul-canvas.debug.log`
const dbg = (msg) => { try { appendFileSync(DBG_PATH, `${new Date().toISOString()} ${msg}\n`) } catch {} }

/**
 * 圈「最老的连续可手术段」；不够膨胀 / 圈不出合规区间 → null。
 * 钉死项（切断连续段，永不入区间）：用户原话（恒真区）/ 运行时快照（form=snapshot）/ 本插件注入的状态区消息（plugin==='trisoul-canvas'）。
 * 直通项（不切断、可入区间、不要求已消化）：手术检查点（source.compactionId）/ 记忆注入 / 其它插件 user/message。
 * mergeCheckpoints=false 时检查点回到钉死（旧行为）。
 */
/** 手术检查点（dsh-compaction compactCheckpointSource：source.compactionId） */
export const isCheckpoint = (e) => e.type === 'user/message' && e.data?.source?.compactionId !== undefined
/** 粗估 token：CJK/假名/谚文每字 ≈1，其余（代码/英文）≈3.5 字符/token（与共识插件选票估算同口径） */
export function estTokens(s) {
  const cjk = (s.match(/[\u2e80-\u9fff\u3040-\u30ff\uac00-\ud7af\uff00-\uffef]/g) ?? []).length
  return Math.ceil(cjk + (s.length - cjk) / 3.5)
}
export const DEFAULT_THRESHOLD_RATIO = 0.5
export const DEFAULT_THRESHOLD_FALLBACK_CHARS = 1_000_000
export const DEFAULT_KEEP_TAIL_EVENTS = 30
export const DEFAULT_MIN_REGION_TOKENS = 4_000
/** 事件的真实内容 token（P1-6）：只算会进 prompt 的文本（不含 reasoning / 旁白 / JSON 包装） */
export const contentTokensOf = (e) => estTokens(contentTextOf(e))

// ---------- A 轻量遮蔽刀（2026-08-21 用户拍板；⑦ 2026-08-23 墓碑拆除→自动删除，默认关）----------
// 换代制注入（状态区 P2-2 / 补注 renew）的旧版本靠「下一刀手术顺路吞」——高频注入下吞速跟不上注速
//（MC 会话实测：末态 297k 上下文里 18 个已作废旧版 ≈43 万字符白占窗口）。同源存活旧版 ≥shadowStale
//（⑦ 默认 0=关——每次遮蔽都砸一次前缀缓存，默认交给手术顺路吞；用户显式设正数才开）
// → pre-step 直接用 replace 把全部已换代旧版替换成**空 content 的 assistant/message**（⑦ 自动删除：
// dsh deriveEventMessage 对空 content assistant 返回 null → 请求侧整条消失，零墓碑噪音；
// 旧版做法是插一行「【TriSoul 遮蔽】…」墓碑 user 消息，机制词直进模型上下文，已拆除）。
// 识别与 pickRegion 同判据（活表面上 seq 最大的一版是最新，其余=已换代）；无 LLM、无纪要、不占手术冷却；
// 删除件是直通项（isShadowDeletion），随下一刀手术一并被吞。
/** 删除件的 source.plugin（挂在 data.message.source 上）：不可用 'trisoul-canvas'——那会被状态区判定误当最新版钉死 */
export const SHADOW_PLUGIN = 'trisoul-canvas-shadow'
/** ⑦ 遮蔽删除件：空 content 的 assistant/message（请求侧不产生任何消息） */
export const isShadowDeletion = (e) => e.type === 'assistant/message' && e.data?.message?.source?.plugin === SHADOW_PLUGIN
/** 画布状态区消息（含新旧各版） */
export const isCanvasStateMsg = (e) => e.type === 'user/message' && e.data?.source?.kind === 'plugin' && e.data.source.plugin === 'trisoul-canvas'
/** 记忆补注消息（renew 换代制，含新旧各版） */
export const isMemSuppMsg = (e) => e.type === 'user/message' && e.data?.source?.kind === 'plugin' && e.data.source.plugin === 'trisoul-memory'
  && (contentTextOf(e).startsWith('[Task memory') || contentTextOf(e).startsWith('【记忆中枢补注'))
const SHADOW_SOURCES = [
  { key: 'state', label: '画布状态区', match: isCanvasStateMsg },
  { key: 'supp', label: '记忆补注', match: isMemSuppMsg },
]
/**
 * 扫一遍活表面：每个换代源（状态区/补注）的已换代旧版 ≥ shadowStale 就全部遮蔽。
 * 旧版沿表面位置分连续段（段间夹着别的活消息不能一刀），每段 append 一条空 assistant 删除件 replace 占位
 *（⑦：请求侧整条消失）——sourceEventSeqs 列全段内 seq（dsh 校验 replace 必须点名每个被遮蔽的活节点）。
 * @returns [{ source, versions, segments }]（本次各源的遮蔽汇总；没动手返回 []）
 */
export function sweepStale(session, { shadowStale = 0 } = {}) {
  if (!(shadowStale > 0)) return []
  const done = []
  for (const src of SHADOW_SOURCES) {
    const surface = surfaceEvents(session)   // 每源重取：上一源的 replace 已改活表面
    const live = surface.filter(src.match)
    if (live.length < 2) continue
    const liveSeq = live.reduce((m, e) => Math.max(m, e.seq), -1)
    const staleIdx = surface.flatMap((e, i) => (src.match(e) && e.seq !== liveSeq) ? [i] : [])
    if (staleIdx.length < shadowStale) continue
    // 沿表面位置分连续段
    const segments = []
    let run = [staleIdx[0]]
    for (const i of staleIdx.slice(1)) {
      if (i === run[run.length - 1] + 1) run.push(i)
      else { segments.push(run); run = [i] }
    }
    segments.push(run)
    for (const seg of segments) {
      const seqs = seg.map(i => surface[i].seq)
      // ⑦ 自动删除：空 content 的 assistant/message——deriveEventMessage 返回 null，请求里整条消失（零墓碑噪音）
      const msg = Object.freeze({
        id: `trisoul-shadow-${src.key}-${seqs[0]}-${seqs[seqs.length - 1]}`,
        role: 'assistant',
        content: Object.freeze([]),
        source: Object.freeze({ kind: 'plugin', plugin: SHADOW_PLUGIN }),
      })
      session.append('assistant/message', { message: msg }, { surfaceOp: { op: 'replace', start: seqs[0], end: seqs[seqs.length - 1] }, sourceEventSeqs: seqs })
    }
    done.push({ source: src.key, versions: staleIdx.length, segments: segments.length })
  }
  return done
}

/** 主模型上下文窗口（token）：dsh Session.requestContext() 由 request/context 事件维护；拿不到 → undefined */
export function contextWindowOf(session) {
  try {
    const rc = typeof session?.requestContext === 'function' ? session.requestContext() : session?.requestContext
    const cw = rc?.contextWindow
    return Number.isFinite(cw) && cw > 0 ? cw : undefined
  } catch { return undefined }
}

/**
 * 触发阈值（2026-08-18 用户令后的默认）：只在表面总量真的逼近主模型窗口时才动刀——
 * thresholdChars>0 → 固定字符阈值（旧语义）；否则 窗口已知 → 表面 token 粗估 > 窗口×thresholdRatio；窗口未知 → 字符数 > thresholdFallbackChars。
 * 旧默认 60000 字符（真机 profile 曾设 12000）让每步都动刀、读过的文件 2–3 步就被压走 → 模型反复重读。
 */
export function overThreshold(session, surface, {
  thresholdChars = 0, thresholdRatio = DEFAULT_THRESHOLD_RATIO, thresholdFallbackChars = DEFAULT_THRESHOLD_FALLBACK_CHARS,
} = {}) {
  // 表面总量按真实内容算（P1-6）：reasoning 不再回灌、JSON 包装不进 prompt，旧口径把它们一起算会高估一倍以上
  const texts = surface.map(e => contentTextOf(e))
  const totalChars = texts.reduce((n, t) => n + t.length, 0)
  if (thresholdChars > 0) return { over: totalChars > thresholdChars, totalChars, limit: `${thresholdChars} 字符` }
  const cw = contextWindowOf(session)
  if (cw) {
    const totalTokens = texts.reduce((n, t) => n + estTokens(t), 0)
    const limitTokens = Math.floor(cw * thresholdRatio)
    return { over: totalTokens > limitTokens, totalChars, totalTokens, limitTokens, limit: `${limitTokens} token（窗口 ${cw} × ${thresholdRatio}）` }
  }
  return { over: totalChars > thresholdFallbackChars, totalChars, limit: `${thresholdFallbackChars} 字符（窗口未知）` }
}

/** assistant 消息里发起的 tool-call id。 */
const toolCallIdsOf = (e) => e.type === 'assistant/message'
  ? (e.data?.message?.content ?? []).filter(b => b?.type === 'tool-call').map(b => b?.id).filter(Boolean)
  : []
/** tool/result 事件回应的 tool-call id。 */
const toolResultIdsOf = (e) => e.type === 'tool/result'
  ? (e.data?.message?.content ?? []).filter(b => b?.type === 'tool-result').map(b => b?.toolCallId).filter(Boolean)
  : []
/**
 * 收缩区间两端，保证不把 tool-call 与它的 tool-result 拆散。
 * 拆散的后果不是「少点上下文」而是**整条会话报废**：模型消息序列变得非法，
 * DeepSeek 官方 API 直接 400「An assistant message with 'tool_calls' must be followed by
 * tool messages responding to each 'tool_call_id'」，agent 当场退出、零产出。
 * （ark-agent 不校验这条，所以此前一直没暴露。）
 */
export function trimUnpaired(events, surface) {
  let arr = events
  // 活表面上现存的调用/结果：只有「本来配着、被手术拆散」才需要保护；
  // 本来就孤立的（配对的一半早就被压进检查点了）压掉反而是清理。
  const live = surface
  const liveCalls = new Set(); const liveResults = new Set()
  for (const e of live) {
    for (const id of toolCallIdsOf(e)) liveCalls.add(id)
    for (const id of toolResultIdsOf(e)) liveResults.add(id)
  }
  for (let guard = arr.length; guard >= 0 && arr.length; guard--) {
    const calls = new Set(); const results = new Set()
    for (const e of arr) {
      for (const id of toolCallIdsOf(e)) calls.add(id)
      for (const id of toolResultIdsOf(e)) results.add(id)
    }
    // 结果在区间内、它的调用还活在区间外 → 压掉就成了没有 tool_calls 的孤儿 tool 消息
    const orphanResult = arr.findIndex(e =>
      toolResultIdsOf(e).some(id => !calls.has(id) && liveCalls.has(id)))
    if (orphanResult >= 0) { arr = arr.slice(orphanResult + 1); continue }
    // 调用在区间内、它的某个结果还活在区间外 → 压掉就成了没有 tool 响应的 tool_calls。
    // 必须**全区间**扫：一条 assistant 可一次发 N 个 tool-call，未配对的那个往往挂在区间开头
    // （真机 seq 3738：三个 call 只盖住两个 result，第三个结果落在 keepTail 里）。
    let orphanCall = -1
    for (let i = arr.length - 1; i >= 0; i--) {
      if (toolCallIdsOf(arr[i]).some(id => !results.has(id) && liveResults.has(id))) { orphanCall = i; break }
    }
    if (orphanCall >= 0) { arr = arr.slice(0, orphanCall); continue }
    break
  }
  return arr
}

export function pickRegion(session, {
  digestedRanges = null,
  thresholdChars = 0,
  thresholdRatio = DEFAULT_THRESHOLD_RATIO,
  thresholdFallbackChars = DEFAULT_THRESHOLD_FALLBACK_CHARS,
  keepTailEvents = DEFAULT_KEEP_TAIL_EVENTS,
  minRegionEvents = 3,
  minRegionTokens = undefined,   // 缺省 DEFAULT_MIN_REGION_TOKENS（4000 真实 token）
  minRegionChars = 0,            // 旧键：>0 且未给 minRegionTokens 时按 ÷3.5 折成 token
  mergeCheckpoints = true,       // P1-2：检查点直通可合并；false = 钉死（旧行为）
  userRetirement = false,        // ⑧（2026-08-23，默认关）：开时非最新一条用户消息可入区间（最新一条永远钉死；surgeon 同款执法双保险）
} = {}) {
  const minTokens = minRegionTokens > 0 ? minRegionTokens : (minRegionChars > 0 ? Math.ceil(minRegionChars / 3.5) : DEFAULT_MIN_REGION_TOKENS)
  // 区间大小按真实内容估 token（P1-6）：user 文本 / assistant 正文+工具参数 / 工具结果文本；不含 reasoning、旁白、JSON 包装
  const size = (e) => contentTokensOf(e)
  const charsOf = (e) => contentTextOf(e).length
  // 位置序活表面（surface.mjs，与手术刀共用）：被 replace 遮蔽的死事件不在其中（否则手术后总量不降、死事件被二次动刀）；
  // 替换者（如原地改写后的状态区消息）位于被替换者的位置——沿位置序切段，钉死项才切在它真正所在的地方
  const surface = surfaceEvents(session)
  const gate = overThreshold(session, surface, { thresholdChars, thresholdRatio, thresholdFallbackChars })
  const total = gate.totalChars
  // 恒真区：用户原话 / 手术检查点 / 运行时上下文快照 / 本插件状态区的最新一版。
  // form='snapshot' 的插件注入（dsh-system-prompt 那类）自带「新的顶替旧的」语义——把它当工作材料压掉，
  // dsh 只会立刻重注一条，压→重注循环白烧钱又堆重复（DeepSWE 容器会话实测堆了 38 条逐字相同的快照）。
  // 不含普通插件注入（如记忆）：那些压掉能按 seq 回捞或 recall，不算恒真。
  // P2-2（2026-08-20，状态区换代制）：状态区更新改为尾部 append 新版（纯追加零缓存破坏；
  // 旧「原地 replace」一场 380 步改写 162 次、每次把其后整场前缀缓存作废）——于是只有最新一版是恒真区，
  // 旧版已被换代，降级为直通项：可入区间、由下一刀手术顺路吞掉（手术步本来就要重付缓存，零额外破坏）。
  const isCanvasMsg = isCanvasStateMsg   // 模块级判据（A 遮蔽刀共用）
  const liveStateSeq = surface.reduce((m, e) => (isCanvasMsg(e) && e.seq > m) ? e.seq : m, -1)
  // 记忆补注（renew 换代制，2026-08-21）：已换代的旧版与状态区旧版同款——surgeon 会把它剔出纪要原料，
  // 门槛若计入它就可能圈出「原料只剩几字」的空刀（终审 F1 同款）；只有活表面上 seq 最大的补注版算最新
  const isMemSupp = isMemSuppMsg
  const liveSuppSeq = surface.reduce((m, e) => (isMemSupp(e) && e.seq > m) ? e.seq : m, -1)
  // ⑧ 用户原话退役：开时只有最新一条用户消息是恒真区；退役的旧用户消息成普通材料（可压，verbatim 可按 seq 回捞，
  // 约束由状态区恒真区 verbatim 引用接住）。默认关 = 全部用户消息钉死（旧行为）。
  const liveUserSeq = userRetirement
    ? surface.reduce((m, e) => (e.type === 'user/message' && e.data?.source?.kind === 'user' && e.seq > m) ? e.seq : m, -1)
    : -1
  const pinned = (e) => e.type === 'user/message'
    && ((e.data?.source?.kind === 'user' && (!userRetirement || e.seq === liveUserSeq))
      || (!mergeCheckpoints && e.data?.source?.compactionId !== undefined)
      || e.data?.source?.form === 'snapshot'
      || (isCanvasMsg(e) && e.seq === liveStateSeq))
  // 直通项：非钉死的插件 user/message（检查点 / 记忆注入 / 其它插件注入）——中枢不消化它们（不是对话事实），
  // 但它们占着 prompt；不让它们切断连续段、也不要求它们被消化，否则每条注入都是一个「洞」，前面的段永远圈不整
  const passthrough = (e) => (e.type === 'user/message' && e.data?.source?.kind === 'plugin' && !pinned(e)) || isShadowDeletion(e)
  const cutoff = surface.length - keepTailEvents
  const evalRun = (rawEvents, via) => {
    const events = trimUnpaired(rawEvents, surface)
    if (!events.length) return null
    const checkpoints = mergeCheckpoints ? events.filter(isCheckpoint).length : 0
    const tokens = events.reduce((n, e) => n + size(e), 0)
    // 合规：≥2 个检查点（合并，不看门槛）；否则 新材料（非检查点事件）≥ minRegionEvents 且 ≥ minTokens。
    // P2-1（2026-08-20）：门槛只计新材料——旧口径把区间里旧检查点自身的 token/事件数也计入，
    // 检查点长过 minTokens 后门槛永真：每 2~3 条新事件就动刀（真机 380 步 254 刀、170 刀只折 3 条事件，
    // 手术刀累计输出为主线 6~8 倍，且每刀把检查点之后的整场前缀缓存作废）。
    if (checkpoints < 2) {
      // 终审 F1：状态区旧版也不算新材料——surgeon 侧会把它剔出纪要原料（isCanvasState 过滤），
      // 若这里计入，一条大旧版就能单独顶过门槛，圈出「原料只剩几字」的空刀 → 必被 requireShorter 拒。
      // （区间里的 canvas 消息必是旧版：最新一版被 pinned，进不了区间。）补注旧版同理（最新版是直通项可入区间，仍算材料）。
      const fresh = events.filter(e => !isCheckpoint(e) && !isCanvasMsg(e) && !isShadowDeletion(e) && !(isMemSupp(e) && e.seq !== liveSuppSeq))
      if (fresh.length < minRegionEvents) return null
      if (fresh.reduce((n, e) => n + size(e), 0) < minTokens) return null
    }
    const chars = events.reduce((n, e) => n + charsOf(e), 0)
    return { start: events[0].seq, end: events[events.length - 1].seq, chars, tokens, total, via, checkpoints,
      ...(gate.totalTokens !== undefined ? { totalTokens: gate.totalTokens, limitTokens: gate.limitTokens } : {}) }
  }
  /** 沿位置序切段：isBreak 为真的事件切断连续段；返回最老的合规段（尾段也算一段）。 */
  const scan = (isBreak, via) => {
    let run = []
    for (let i = 0; i < cutoff; i++) {
      const e = surface[i]
      if (isBreak(e)) { const r = evalRun(run, via); if (r) return r; run = [] }
      else run.push(e)
    }
    return evalRun(run, via)
  }
  // 判据 #1/#2（主判据）：中枢给出的「已消化 + 有纪要 + 未标 compactable:false」区间才可动刀——
  // 与表面总量无关：一段内容的使命完成了就该整理，不必等到快撑爆才急救。未消化的事件切断连续段。
  const ranges = Array.isArray(digestedRanges) ? digestedRanges : null
  if (ranges?.length) {
    // 阶段收尾点（P1-3）：中枢判定某批标志一个阶段收尾 → 该点及之前的一切（含没消化到的洞）都视为可整理，一次圈整段
    const closedBefore = Math.max(-1, ...ranges.map(r => Number.isInteger(r.phaseClosedAt) ? r.phaseClosedAt : -1))
    const digested = (e) => passthrough(e) || e.seq <= closedBefore || ranges.some(r => e.seq >= r.start && e.seq <= r.end)
    const r = scan((e) => pinned(e) || !digested(e), 'digested')
    if (r) return r
  }
  // 判据 #3（保险丝）：中枢缺席 / 消化落后太多，而表面真的逼近上下文窗口 → 才退回「圈最老的连续段」
  if (!gate.over) return null
  return scan(pinned, 'threshold')
}

/** 创建画布并接线；返回句柄供测试驱动（apply 不返回它——cordis 会把非空返回值当 effect 校验）。 */
export function createCanvas(ctx, config = {}) {
  const regionOpts = {
    thresholdChars: config.thresholdChars > 0 ? config.thresholdChars : 0,   // >0 = 固定字符阈值（旧语义）；0 = 按主模型窗口比例自动
    thresholdRatio: config.thresholdRatio > 0 ? config.thresholdRatio : DEFAULT_THRESHOLD_RATIO,
    thresholdFallbackChars: config.thresholdFallbackChars > 0 ? config.thresholdFallbackChars : DEFAULT_THRESHOLD_FALLBACK_CHARS,
    keepTailEvents: config.keepTailEvents ?? DEFAULT_KEEP_TAIL_EVENTS,     // 最近 N 个 surface 事件是工作区尾部，不动
    minRegionEvents: config.minRegionEvents ?? 3,    // 区间太碎不值得动刀
    // 区间最小真实内容 token（P1-6）；旧 minRegionChars 仍认（÷3.5 折算）
    minRegionTokens: config.minRegionTokens > 0 ? config.minRegionTokens : (config.minRegionChars > 0 ? Math.ceil(config.minRegionChars / 3.5) : DEFAULT_MIN_REGION_TOKENS),
    mergeCheckpoints: config.mergeCheckpoints !== false,   // P1-2：检查点直通可合并（false = 钉死旧行为）
  }
  // ⑧ 用户原话退役（默认关）：插件配置显式给了就用它（无头/测试场景）；否则每次圈区时问 dsh-api 的 live 开关
  const userRetirementOf = () => {
    if (config.userRetirement !== undefined) return config.userRetirement === true
    try { return ctx.bail?.('trisoul/user-retirement') === true } catch { return false }
  }
  const failCooldownSteps = config.failCooldownSteps ?? 3 // 同一区间手术失败后冷却 N 步再试（避免每步白烧一次手术刀）
  // 连刀冷却（2026-08-21 用户拍板）：手术成功后也冷却 N 步——真机 10 刀里 2 组连刀（相邻步连续动刀），
  // 每刀都把检查点之后的整场前缀缓存作废；隔几步再动，区间攒大合并成一刀，少吃原文少砸缓存。0 = 关。
  const surgeryCooldownSteps = config.surgeryCooldownSteps ?? 3
  let busy = false
  let cooldown = 0
  let lastFailedKey = null
  let failStreak = 0   // 同一区间连败次数：冷却按它放大（连败的区间别每 N 步白烧一次手术刀）
  dbg(`apply: 判据=${config.digested === false ? '仅阈值' : '中枢已消化区间（阈值兜底）'} 保险丝=${regionOpts.thresholdChars > 0 ? `${regionOpts.thresholdChars} 字符` : `窗口×${regionOpts.thresholdRatio}（未知窗口兜底 ${regionOpts.thresholdFallbackChars} 字符）`} keepTail=${regionOpts.keepTailEvents} minRegion=${regionOpts.minRegionEvents}事件/${regionOpts.minRegionTokens}token probe=${config.probe ?? true} state=${config.state ?? true}`)
  // 上报给 @trisoul/dsh-api 监控；无监听者时静默。phase: 'surgery' | 'state' | 'probe'
  const report = (info) => { try { ctx.emit('trisoul/canvas', info) } catch (e) { dbg(`EMIT-FAIL trisoul/canvas ${String(e?.message ?? e)}`) } }
  const warn = (m) => { dbg(`WARN ${m}`); ctx.logger?.warn(`trisoul-canvas: ${m}`) }

  /** 中枢的手术判据（唯一读过内容的一方）：ctx.bail('trisoul/memory-digested') → [{start,end}]；中枢缺席/报错 → null（退回阈值保险丝）。 */
  const digestedOf = (session) => {
    if (config.digested === false) return null   // 显式关掉语义判据 = 回到纯阈值模式
    try {
      const r = ctx.bail?.('trisoul/memory-digested', { sessionId: session.id })
      return Array.isArray(r) ? r : null
    } catch { return null }
  }

  const runner = createJobRunner(ctx, config)
  const stateZone = createStateZone(ctx, { config, runJob: runner.run, report, warn, dbg })
  const prober = createProber(ctx, { config, runJob: runner.run, report, warn, dbg })
  let probeTail = Promise.resolve() // 最近一次探针作业（fire-and-forget；测试可 await canvas.probeDone()）

  // A 遮蔽刀：同源换代注入的存活旧版 ≥ N 才动手（0 = 关；用户拍板默认 3）
  const shadowStale = config.shadowStale ?? 0   // ⑦ 默认关（旧默认 3）：遮蔽刀砸前缀缓存，默认交给手术顺路吞
  ctx.on('agent/pre-step', async (payload, next) => {
    const agent = payload?.agent
    // 状态区：注入维护 + 提炼调度（提炼异步跑，不阻塞本步）
    try { if (agent?.session) stateZone.onPreStep(agent, payload.signal) } catch (e) { dbg(`状态区失败(放行): ${String(e).slice(0, 300)}`) }
    // A 遮蔽刀（先于手术判据）：直接 replace 已换代旧版为一行墓碑——无 LLM、不占手术冷却，失败放行
    try {
      if (agent?.session && shadowStale > 0) {
        const t0 = Date.now()
        for (const s of sweepStale(agent.session, { shadowStale })) {
          dbg(`遮蔽刀: ${s.source} 旧版 ${s.versions} 条 → ${s.segments} 条删除件（请求侧消失）`)
          report({ phase: 'shadow', ok: true, sessionId: agent.session.id, ...s, durationMs: Date.now() - t0 })
        }
      }
    } catch (e) { dbg(`遮蔽刀失败(放行): ${String(e).slice(0, 300)}`) }
    try {
      if (cooldown > 0) cooldown--
      // 状态区降级 = 压走的原文没地方接着：宁可让上下文涨，也不做「只切不补」的手术。
      // （真机取证：容器里 canvas provider 配错致提炼 100% 失败，手术仍切了 91 次，读过的内容直接蒸发。）
      if (!busy && cooldown === 0 && agent?.session && stateZone.degraded(agent.session.id)) {
        warn(`状态区降级（提炼连续失败 ≥ ${stateZone.failLimit}），本步不动刀——先修好状态区再压`)
      } else if (!busy && cooldown === 0 && agent?.session) {
        const region = pickRegion(agent.session, { ...regionOpts, userRetirement: userRetirementOf(), digestedRanges: digestedOf(agent.session) })
        if (region) {
          busy = true
          const t0 = Date.now()
          try {
            dbg(`手术[${region.via}]: seq ${region.start}..${region.end}（区间 ${region.chars} 字符 ≈${region.tokens} token${region.checkpoints ? `，含 ${region.checkpoints} 个检查点` : ''} / 表面总量 ${region.total} 字符${region.totalTokens !== undefined ? ` ≈${region.totalTokens} token，阈 ${region.limitTokens}` : ''}）`)
            // 探针补记搭车（P2-3）：验收未过攒下的问答随这刀写进新检查点（旧「立即改写检查点」
            // 一场多出 57 次计划外前缀缓存作废）；成功后按快照逐条消账，手术中途新到的留给下一刀
            const sid0 = agent.session.id
            const probeNotes = prober.peekNotes(sid0)
            const r = await ctx.compaction.compactRegion(region.start, region.end, agent, payload.signal,
              probeNotes.length ? { probeNotes } : undefined)
            dbg(`手术完成: compactionId=${r?.compactionId} 遮蔽 ${r?.shadowedSeqs?.length} 事件`)
            const checkpointText = typeof r?.summary?.[0]?.text === 'string' ? r.summary[0].text : ''
            // 终审 F3：消账前核实该行真进了检查点——纪要模型可能无视「原样保留」；只清确实保留的，
            // 未保留的留队列搭下一刀（否则事实静默丢失：检查点里没有、队列也清了）
            if (probeNotes.length) {
              const kept = probeNotes.filter(l => checkpointText.includes(l))
              if (kept.length) prober.consumeNotes(sid0, kept)
              if (kept.length < probeNotes.length) warn(`探针补记 ${probeNotes.length - kept.length}/${probeNotes.length} 条未见于新检查点，留队列等下一刀`)
            }
            // checkpointChars：检查点长度，供 D 评测算压缩比（chars → checkpointChars）
            report({ phase: 'surgery', ...region, ok: true, sessionId: agent.session.id, durationMs: Date.now() - t0, compactionId: r?.compactionId,
              ...(checkpointText ? { checkpointChars: checkpointText.length } : {}) })
            lastFailedKey = null; failStreak = 0
            cooldown = surgeryCooldownSteps   // 连刀冷却：这刀成功后歇 N 步，让下一刀的区间长大合并
            // 探针验收：拿手术后的检查点文本答从预压缩稿抽出的事实题；异步跑，失败仅告警
            if (prober.enabled) {
              probeTail = prober.runProbe({
                session: agent.session, start: region.start, end: region.end,
                checkpointText, signal: payload.signal, compactionId: r?.compactionId,
              })
              probeTail.catch(() => {})
            }
          } catch (e) {
            report({ phase: 'surgery', ...region, ok: false, sessionId: agent.session.id, durationMs: Date.now() - t0, error: String(e).slice(0, 300) })
            // 失败即冷却，同一区间连败越多冷却越长，别每步都重试
            //（旧版首败不设冷却、下一步立即重试；且区间尾端外扩会换 key 让冷却永不生效——任何失败都要歇）
            const key = `${region.start}-${region.end}`
            failStreak = key === lastFailedKey ? failStreak + 1 : 1
            cooldown = failCooldownSteps * failStreak
            lastFailedKey = key
            throw e
          } finally { busy = false }
        }
      }
    } catch (e) { dbg(`手术失败(放行): ${String(e).slice(0, 300)}`) }
    return next()
  }, { global: true })

  return {
    stateZone, prober, runner,
    pickRegion: (session) => pickRegion(session, { ...regionOpts, userRetirement: userRetirementOf(), digestedRanges: digestedOf(session) }),
    probeDone: () => probeTail,
  }
}

export function apply(ctx, config = {}) {
  createCanvas(ctx, config)
}
