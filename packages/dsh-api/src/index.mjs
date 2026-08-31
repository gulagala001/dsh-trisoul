// TriSoul 中枢 API 插件（服务端）
// 职责：
// 1. 模型配置（统一/精细两模式）+ 灵魂数量：用 dsh 官方 settings 服务注册 `trisoul` 命名空间——
//    用户层落 ~/.dsh/settings.yaml（chokidar 热更新），cordis 层给 base 默认值；
//    共识过程参数（trace 旁白显示方式 / voteEffort 等）同样落 settings：共识插件经 `ctx.bail('trisoul/consensus-config')` 取。
//    灵魂名册写死 A/B/C（SOUL_ROSTER），settings 只有 `soulCount` ∈ {1,2,3}（2026-08-30 取代灵魂列表 + 三魂 effort 档位）：
//    共识插件每轮 `ctx.bail('trisoul/souls')` 取已解析列表（按魂数带官位与猛档人设）；
//    其它 TriSoul 插件在每次调用 LLM 前通过 `ctx.bail('trisoul/ai-config', id)` 取当前解析值，改配置即刻生效、无需重启。
// 2. 后台 AI 监控：包一层 `llm/stream` 瀑布，按 purpose 归因到 surgeon / memory / soul-<name> / main，累计 token 用量；
//    画布编排器（不调 LLM）通过 `trisoul/canvas` 事件上报手术次数。
// 3. HTTP 路由（/trisoul/api/*，走 ctx.webServer；/api 前缀归官方 apiProxy 所有，不占用）：
//    GET  /trisoul/api/state     → 配置 + 解析结果 + 灵魂列表 + 统计 + LLM 目录 + 最近共识轮次摘要 + 评测指标 metrics（面板一次拉齐）
//    POST /trisoul/api/settings  → { mode?, soulCount?, unified?, fine?, consensus?, memoryScope?, userRetirement? } 合并进用户层；{ reset: true } 清空用户层
//    GET  /trisoul/api/consensus → { rounds: [轻量摘要，最新在前] }；?turnId=… → 单轮全文（每魂思考链/两段盲稿/表决理由、tips/独走、定稿）
// 4. 共识轮次全文：订阅 `trisoul/consensus` 事件（start/draft/vote/tips/solo/done），按 turnId 聚合进内存环形缓冲（最近 ROUNDS_KEEP 轮）。
import Schema from '@deepseek-ai/schemastery'

export const name = 'trisoul-api'
export const inject = ['webServer', 'llm']

const NS = 'trisoul'
/** 需要模型配置的中枢 AI（画布编排器的小作业：状态区提炼 / 探针出题作答；灵魂是动态列表，见 souls） */
export const HUB_AI_IDS = Object.freeze(['surgeon', 'memory', 'canvas'])
export const AI_META = Object.freeze({
  surgeon: { label: '手术刀', role: '上下文区域手术（CompactionEngine）' },
  memory: { label: '记忆中枢', role: '事件消化 + recall 检索' },
  canvas: { label: '画布编排', role: '步边界量膨胀→圈区间→调手术刀；小作业：状态区提炼 / 探针（0 思考）' },
  main: { label: '主循环', role: '对话主请求（共识胜者重放）' },
})
const PERSONA_SUMMARY_CHARS = 120

const AiSchema = Schema.object({
  provider: Schema.string(),
  model: Schema.string(),
  temperature: Schema.number().min(0).max(2),
})
/** 共识过程参数：trace = 旁白去向（reasoning=折叠思维链 / none=完全隐藏 / text=明文） */
export const TRACE_MODES = Object.freeze(['reasoning', 'none', 'text'])
/** 表决调用的思考档位：off=不思考（省钱提速），inherit=沿用主请求的 reasoningEffort。 */
export const STAGE_EFFORTS = Object.freeze(['off', 'inherit'])
/** 胜者 raw 思考回灌：off=恒剥不回灌（现行为，默认），latest=胜者思考折进历史只活一轮（下下轮剥掉）。 */
export const REPLAY_REASONS = Object.freeze(['off', 'latest'])
const ConsensusSchema = Schema.object({
  trace: Schema.union(TRACE_MODES).default('reasoning'),
  voteMaxTokens: Schema.number().min(0).step(1),   // 0 = 不设限（默认）；08-30 撤 max(8000)（用户令 16000 填不进设置页；上限类默认不设限）
  soulRetries: Schema.number().min(0).max(5).step(1), // 灵魂调用失败自动重试次数（0=关；插件默认 2）
  soulTimeoutMs: Schema.number().min(0).step(1), // 单魂一次调用（盲写/表决）总时长硬上限 ms（0 = 不限，靠 idle 兜底；插件默认 900000 = 15 分钟）
  soulIdleTimeoutMs: Schema.number().min(1000).step(1), // 连续无流式输出判失联 ms（插件默认 60000；无 0 档——总上限不限时它是防挂死的最后防线）
  reasoningFuseChars: Schema.number().min(0).step(1), // 思考熔断阈值（字符，0 = 关；插件默认 200000——2026-08-26 用户拍板的上限类例外，防失控思维链）
  innerEvidence: Schema.boolean(), // 内层取证开关（缺省 = 开；false → 下发关闭，officer 专属工具也不放行）
  innerRounds: Schema.number().min(0).step(1), // C2 取证轮数上限（0 = 不限，插件默认；不设上限类默认，见参数纪律）
  // ⑬ 已摘死键（2026-08-23）：innerCalls——预算闸随内层瘦身整体拆除，残留配置被忽略
  voteEffort: Schema.union(STAGE_EFFORTS).default('off'),
  replayReasoning: Schema.union(REPLAY_REASONS).default('off').loose(), // loose：非法值（v1 档位残留 last/none/all 等）忽略回退 off，不响亮拒绝
  // 2026-08-27 补断头（插件 liveConsensusConfig 的 pick 一直在等这些键，schema 此前漏声明——settings.yaml/UI 都改不了）：
  ballotTool: Schema.boolean(), // 选票走工具调用（缺省 = 开；false = 文本选票旧路）
  soulRetryBackoffMs: Schema.number().min(0).step(1), // 重试退避基数 ms（插件默认 1000，按尝试指数放大）
  soulStaggerMs: Schema.number().min(0).step(1), // 多魂错峰启动间隔 ms（插件默认 250；0 = 齐发）
  nearIdentical: Schema.boolean(), // P2-4 近似免表决（缺省 = 开：工具调用相同 + 正文相似度全超阈 → 免表决放行）
  nearIdenticalSimilarity: Schema.number().min(0).max(1), // 阈值 ∈ (0,1]（插件默认 0.7）；schemastery 无 exclusive min，0 由 register 的 validate 钩子响亮拒绝——关请用 nearIdentical:false
  statusHeartbeatMs: Schema.number().min(0).step(1), // 表决/补枪/收官期 status 心跳 ms（插件默认 5000；0 = 关）
  // 已摘死键（2026-08-30 格式锁按协议）：jsonSchemaProviders / jsonObjectProviders——渠道名白名单退役，锁按协议（trisoul/provider-api）；残留键静默忽略
  exemptHostTools: Schema.array(String), // 内层豁免宿主工具（插件默认空；恢复 recall 取证 = ['trisoul_recall']）
  // 已摘死键（v2，2026-08-22）：mergeEffort/ballotTokens/replayReasoningKeep——
  // 融合稿、批准票、选票截断随 v1 共识退役；schema 不再声明，
  // 用户 settings.yaml 残留这些键会被静默忽略（不报错、不下发插件）。
  // replayReasoning 已随 submit_draft 工具化恢复（off/latest 两态，2026-08-22）。
})
/** 用户可改的设置（settings.yaml 的 `trisoul:` 段）。 */
export const SettingsSchema = Schema.object({
  mode: Schema.union(['unified', 'fine']).default('unified'),
  unified: Schema.object({ provider: Schema.string(), model: Schema.string() }),
  fine: Schema.dict(AiSchema),
  consensus: ConsensusSchema,
  // 灵魂数量（2026-08-30）：名册写死 A/B/C，只选用几个；官位按魂数见 OFFICERS_BY_COUNT。旧 souls[] / effort{} 键残留静默忽略（不校验不读）
  soulCount: Schema.number().min(1).max(3).step(1).default(3),
  // 记忆范围默认档（三档开关，2026-08-20）：full 完全版 / project 项目级 / session 会话级。
  // 只影响之后新开的会话——记忆插件在会话首触时读它并绑死（bail trisoul/memory-scope），已绑会话不随它变。
  memoryScope: Schema.union(['full', 'project', 'session']).default('full'),
  // ⑧ 用户原话退役（2026-08-23，默认关）：开时非最新一条用户消息可入手术区间（canvas 圈区 + surgeon 执法同步放行；
  // 最新一条永不入）。补偿链：约束进状态区恒真区（verbatim 引用）+ 原文按 seq 可回捞。bail trisoul/user-retirement 即刻生效。
  userRetirement: Schema.boolean().default(false),
})

/** cordis 层配置：base 默认值（对齐 profile 里各插件的静态 provider/model）。 */
export const Config = Schema.object({
  base: SettingsSchema,
  /** 监控 stats 保留的最近事件条数 */
  recentLimit: Schema.number().default(50),
})

// ---------- 灵魂数量制（2026-08-30 用户拍板，取代三魂 effort 三栏档位 + 灵魂列表）----------
// 三魂名册写死：名字是身份（purpose `trisoul-<stage>/<name>`、监控 `soul-<name>`），温度按位固定；路由沿统一/精细分区
//（精细模式下 settings.yaml 手改 fine['soul-<name>'] 仍可给单魂指路由）。设置只剩 soulCount ∈ {1,2,3}。
// 官位按魂数：1 = 博识（单魂无表决，最缺的是查证）；2 = 对齐+实证（博识靠联网工具，工具面缺失时本就降级）；3 = 对齐+博识+实证。
// 人设恒「猛」档原文（OFFICER_PERSONAS）——轻/标准两档与库内老表人设随档位制退役（全文在 git）。
// 三官仍是灵魂、仍走经典表决制：dsh-api 在 trisoul/souls 里直接套好 persona/title/officer 下发，共识插件按 officer 加专属工具。
export const SOUL_COUNTS = Object.freeze([1, 2, 3])
export const SOUL_ROSTER = Object.freeze([
  Object.freeze({ name: 'A', temperature: 0.3 }),
  Object.freeze({ name: 'B', temperature: 0.6 }),
  Object.freeze({ name: 'C', temperature: 0.9 }),
])
export const OFFICERS_BY_COUNT = Object.freeze({
  1: Object.freeze(['erudite']),
  2: Object.freeze(['align', 'empiric']),
  3: Object.freeze(['align', 'erudite', 'empiric']),
})
export const OFFICER_META = Object.freeze({
  align: Object.freeze({ name: '对齐', title: '做什么', hint: '逐字对照用户要求与产出，抓被「差不多」带过去的缩水与偷换' }),
  erudite: Object.freeze({ name: '博识', title: '凭什么做', hint: '查证现状与参照，把「我记得」逼成有出处的事实，未知列清单' }),
  empiric: Object.freeze({ name: '实证', title: '做对没有', hint: '让现实验证结论，验过没验过分开说，推理踩现实锚点' }),
})
// 三份猛档人设（2026-08-26 最小核重构三句版；旧 1800 字符强迫性深挖版与轻/标准档全文在 git 与 promptlab 病例库）：
// 写思考方式不写行为规范，无身份叙事无称呼。同官跨轮 persona 不变、前缀缓存照常命中。
export const OFFICER_PERSONAS = Object.freeze({
  align: "Read the user's actual words closely — what they asked for, not an easier approximation of it. A short request is rarely a shallow one: think past the first reading to what it actually requires — the cases it must cover, the implications it carries — before deciding it's simple. Watch for requirements that quietly shrink: \"all\" becoming \"most\", \"real-time\" becoming \"manual refresh\". When something wasn't achieved, say so plainly instead of lowering the bar on the user's behalf.\n\nWhen you have enough information to act, act. Do not re-derive facts already established in the conversation, re-litigate a decision the user has already made, or narrate options you will not pursue. If you are weighing a choice, give a recommendation, not an exhaustive survey.\n\nYou are operating autonomously. The user is not watching in real time and cannot answer questions mid-task, so asking 'Want me to…?' or 'Shall I…?' will block the work. For reversible actions that follow from the original request, proceed without asking. Stop only for destructive actions or genuine scope changes the user must decide. Offering follow-ups after the task is done is fine; asking permission before doing the work is not.\n\nException: when the user is describing a problem, asking a question, or thinking out loud rather than requesting a change, the deliverable is your assessment. Report your findings and stop. Don't apply a fix until they ask for one.\n\nBefore ending your turn, check your last paragraph. If it is a plan, an analysis, a question, a list of next steps, or a promise about work you have not done ('I'll…', 'let me know when…'), do that work now with tool calls. That includes retrying after errors and gathering missing information yourself. Do not stop because the context or session is long. End your turn only when the task is complete or you are blocked on input only the user can provide. And measure \"complete\" against the request as actually worded: if a requirement quietly shrank along the way — \"all\" became \"most\", \"real-time\" became \"manual refresh\" — that is not completion; say plainly what wasn't achieved instead of lowering the bar on the user's behalf.\n\nBefore running a command that changes system state (such as restarts, deletes, or config edits), check that the evidence actually supports that specific action. A signal that pattern-matches to a known failure may have a different cause.\n\nFor actions that are hard to reverse or outward-facing, confirm first unless durably authorized or explicitly told to proceed without asking; approval in one context doesn't extend to the next. Sending content to an external service publishes it; it may be cached or indexed even if later deleted. Before deleting or overwriting, look at the target. If what you find contradicts how it was described, or you didn't create it, surface that instead of proceeding. Report outcomes faithfully: if tests fail, say so with the output; if a step was skipped, say that; when something is done and verified, state it plainly without hedging.",
  erudite: "Treat your own memory as unreliable: what feels like knowledge is often invention, and the surer it feels without a source, the more it needs checking. Confirm the current state by looking at it, and prefer a reference you can check over building from thin air. Mark what you couldn't confirm as conjecture. Knowing what you don't know is part of the output.\n\nWhen you have enough information to act, act. Do not re-derive facts already established in the conversation, re-litigate a decision the user has already made, or narrate options you will not pursue. If you are weighing a choice, give a recommendation, not an exhaustive survey. Note the difference: facts established in the conversation stand; \"facts\" you merely remember do not — if a step depends on something you haven't verified in this session, verifying it is part of acting, not a reason to stall.\n\nYou are operating autonomously. The user is not watching in real time and cannot answer questions mid-task, so asking 'Want me to…?' or 'Shall I…?' will block the work. For reversible actions that follow from the original request, proceed without asking. Stop only for destructive actions or genuine scope changes the user must decide. Offering follow-ups after the task is done is fine; asking permission before doing the work is not. Gathering missing information yourself includes resolving what you don't know by looking, not by asking the user what you could have checked.\n\nException: when the user is describing a problem, asking a question, or thinking out loud rather than requesting a change, the deliverable is your assessment. Report your findings and stop. Don't apply a fix until they ask for one. In that assessment, mark what you couldn't confirm as conjecture — knowing what you don't know is part of the output, and an unverified guess presented as fact is worse than no answer.\n\nBefore ending your turn, check your last paragraph. If it is a plan, an analysis, a question, a list of next steps, or a promise about work you have not done ('I'll…', 'let me know when…'), do that work now with tool calls. That includes retrying after errors and gathering missing information yourself. Do not stop because the context or session is long. End your turn only when the task is complete or you are blocked on input only the user can provide.\n\nBefore running a command that changes system state (such as restarts, deletes, or config edits), check that the evidence actually supports that specific action. A signal that pattern-matches to a known failure may have a different cause — the failure you remember is a hypothesis about this one, not a diagnosis; confirm the current state by looking at it before you act on the resemblance.\n\nFor actions that are hard to reverse or outward-facing, confirm first unless durably authorized or explicitly told to proceed without asking; approval in one context doesn't extend to the next. Sending content to an external service publishes it; it may be cached or indexed even if later deleted. Before deleting or overwriting, look at the target. If what you find contradicts how it was described, or you didn't create it, surface that instead of proceeding. Report outcomes faithfully: if tests fail, say so with the output; if a step was skipped, say that; when something is done and verified, state it plainly without hedging.",
  empiric: "When you have enough information to act, act. Do not re-derive facts already established in the conversation, re-litigate a decision the user has already made, or narrate options you will not pursue. If you are weighing a choice, give a recommendation, not an exhaustive survey.\n\nYou are operating autonomously. The user is not watching in real time and cannot answer questions mid-task, so asking 'Want me to…?' or 'Shall I…?' will block the work. For reversible actions that follow from the original request, proceed without asking. Stop only for destructive actions or genuine scope changes the user must decide. Offering follow-ups after the task is done is fine; asking permission before doing the work is not.\n\nException: when the user is describing a problem, asking a question, or thinking out loud rather than requesting a change, the deliverable is your assessment. Report your findings and stop. Don't apply a fix until they ask for one. Keep that assessment anchored in what you actually observed — confidence and correctness are unrelated, and a conclusion that \"looks right\" but rests on reasoning alone should be labeled as such.\n\nBefore ending your turn, check your last paragraph. If it is a plan, an analysis, a question, a list of next steps, or a promise about work you have not done ('I'll…', 'let me know when…'), do that work now with tool calls. That includes retrying after errors and gathering missing information yourself. Do not stop because the context or session is long. End your turn only when the task is complete or you are blocked on input only the user can provide. \"Complete\" means verified: decide beforehand what result would count, run the real check rather than settling for \"looks right\", and say \"unverified\" when something is — an unchecked success claim does not end the turn.\n\nBefore running a command that changes system state (such as restarts, deletes, or config edits), check that the evidence actually supports that specific action. A signal that pattern-matches to a known failure may have a different cause.\n\nFor actions that are hard to reverse or outward-facing, confirm first unless durably authorized or explicitly told to proceed without asking; approval in one context doesn't extend to the next. Sending content to an external service publishes it; it may be cached or indexed even if later deleted. Before deleting or overwriting, look at the target. If what you find contradicts how it was described, or you didn't create it, surface that instead of proceeding. Report outcomes faithfully: if tests fail, say so with the output; if a step was skipped, say that; when something is done and verified, state it plainly without hedging — \"verified\" here means a real check was run against a result decided in advance, not that nothing obviously broke.",
})
/** 灵魂在监控/设置里的默认标签 */
export function soulLabel(soul) {
  return soul.title ? `灵魂 ${soul.name} · ${soul.title}` : `灵魂 ${soul.name}`
}

export function apply(ctx, config = {}) {
  const base = SettingsSchema(config.base ?? {})
  const recentLimit = config.recentLimit ?? 50
  let current = base
  let revision = 0
  let scope = null // settings scope（settings 服务缺席时为 null → 只读 base）
  let settingsService
  /** 宿主桥的 settings 命名空间与内建适配器固定表（与 dsh-plugin ADAPTER_API 同源） */
  const PI_AI_NS = 'llm-pi-ai'
  const ADAPTER_API = Object.freeze({ 'deepseek-official': 'deepseek' })
  function protocolOf(provider) {
    if (typeof provider !== 'string' || !provider) return undefined
    if (ADAPTER_API[provider]) return ADAPTER_API[provider]
    let section
    try { section = typeof settingsService?.get === 'function' ? settingsService.get(PI_AI_NS) : undefined } catch { return undefined }
    const api = section?.providers?.[provider]?.api
    return (typeof api === 'string' && api) ? api : undefined
  }
  let directory = [] // LLM 目录缓存（第 3 节填充；resolveSouls 校验 reasoningEffort 时查）
  let directoryPromise = null
  const summarize = (text) => (typeof text === 'string' && text.length > PERSONA_SUMMARY_CHARS ? `${text.slice(0, PERSONA_SUMMARY_CHARS)}…` : text)

  // ---------- 1. 设置：注册 settings 命名空间（服务缺席时退回 base） ----------
  ctx.inject(['settings'], (sctx) => {
    settingsService = sctx.settings
    scope = sctx.settings.register(NS, SettingsSchema, {
      base,
      // 用户层写入 / settings.yaml 手改 都过这里：坏列表不落盘（热更时服务保留上一份好值）
      validate: (value) => {
        // 语义域 (0,1]：schemastery 无 exclusive min，0 在这里响亮拒绝——否则 state 回显 0、插件静默跑 0.7 三方背离
        if (value.consensus?.nearIdenticalSimilarity === 0) throw new Error('nearIdenticalSimilarity 必须大于 0（关闭近似免表决请用 nearIdentical: false）')
      },
    })
    current = scope.get()
    sctx.effect(() => scope.watch(() => {
      current = scope.get(); revision++
      ctx.logger?.info(`trisoul-api: 配置更新 mode=${current.mode} souls=${(resolveSouls() ?? []).map(s => s.name).join(',') || '(static)'}`)
      ctx.emit('trisoul/config-updated', snapshotConfig())
    }), 'trisoul-api: settings watch')
    sctx.effect(() => () => { scope = null; current = base }, 'trisoul-api: settings detach')
  })

  /** 当前魂数（settings 层 → base 层 → 3）；非法值到不了这里（schema 拦） */
  function soulCountOf() {
    const n = current.soulCount ?? base.soulCount ?? 3
    return SOUL_COUNTS.includes(n) ? n : 3
  }
  /** 全名册（三条）：前 soulCount 条启用并按位挂官位 / 猛档人设 / 官名 title，其余 enabled:false（设置页与 aiMeta 用） */
  function rosterSouls() {
    const n = soulCountOf()
    const officers = OFFICERS_BY_COUNT[n]
    return SOUL_ROSTER.map((s, i) => (i < n
      ? { ...s, title: OFFICER_META[officers[i]].name, persona: OFFICER_PERSONAS[officers[i]], officer: officers[i], enabled: true }
      : { ...s, enabled: false }))
  }
  /**
   * 解析当前启用灵魂列表（provider/model 已按模式解析）。
   * 统一模式：全部用 unified 并下发 followMain（共识插件用对话框模型覆盖；unified 值仍是中枢 AI 路由与主请求无路由时的兜底）。
   * 精细模式：旧版 fine[soul-<name>]（settings.yaml 手改仍可给单魂指路由）→ unified。
   * 温度按名册写死。unified 缺 provider/model 且 fine 无路由 → undefined，共识插件退回 cordis 静态 souls。
   * 共识插件仍按 `ctx.bail('trisoul/souls', sessionId)` 调用——会话级档位绑定已随档位制拆除，参数忽略。
   */
  function resolveSouls() {
    const unified = current.unified ?? base.unified ?? {}
    const fineMode = current.mode === 'fine'
    const out = []
    for (const s of rosterSouls()) {
      if (!s.enabled) continue
      const legacy = current.fine?.[`soul-${s.name}`] ?? {}
      const provider = fineMode ? (legacy.provider || unified.provider) : unified.provider
      const model = fineMode ? (legacy.model || unified.model) : unified.model
      if (!provider || !model) continue // 不可解析的灵魂不下发（共识插件拿到无路由的灵魂只会失联）
      out.push({
        name: s.name, title: s.title, persona: s.persona, officer: s.officer,
        provider, model,
        ...(fineMode ? {} : { followMain: true }),
        temperature: s.temperature,
        enabled: true,
      })
    }
    return out.length ? out : undefined
  }
  /** 解析某个 AI 当前应使用的 provider/model/temperature；soul-<name> 从灵魂列表找同名（找不到走旧版 fine 路径） */
  function resolveAi(id) {
    if (typeof id === 'string' && id.startsWith('soul-')) {
      const found = resolveSouls()?.find(s => `soul-${s.name}` === id)
      if (found) {
        return {
          provider: found.provider, model: found.model,
          ...(found.temperature === undefined ? {} : { temperature: found.temperature }),
          ...(found.reasoningEffort ? { reasoningEffort: found.reasoningEffort } : {}),
        }
      }
    }
    const fine = current.fine?.[id] ?? {}
    const temperature = fine.temperature ?? base.fine?.[id]?.temperature
    const unified = current.unified ?? base.unified ?? {}
    const pick = current.mode === 'fine'
      ? { provider: fine.provider ?? unified.provider, model: fine.model ?? unified.model }
      : { provider: unified.provider, model: unified.model }
    return { ...pick, ...(temperature === undefined ? {} : { temperature }) }
  }
  /** 共识过程参数（settings 层 → base 层 → 内建默认）；voteEffort/replayReasoning 默认 off。
   *  v2 已摘死键 mergeEffort/ballotTokens/replayReasoningKeep（见 ConsensusSchema 注释）——
   *  用户层/base 层残留直接不读，静默忽略。 */
  function resolveConsensus() {
    const c = current.consensus ?? {}, b = base.consensus ?? {}
    return {
      trace: c.trace ?? b.trace ?? 'reasoning',
      ...(c.voteMaxTokens ?? b.voteMaxTokens) !== undefined ? { voteMaxTokens: c.voteMaxTokens ?? b.voteMaxTokens } : {},
      ...(c.soulRetries ?? b.soulRetries) !== undefined ? { soulRetries: c.soulRetries ?? b.soulRetries } : {},
      ...(c.soulTimeoutMs ?? b.soulTimeoutMs) !== undefined ? { soulTimeoutMs: c.soulTimeoutMs ?? b.soulTimeoutMs } : {},
      ...(c.soulIdleTimeoutMs ?? b.soulIdleTimeoutMs) !== undefined ? { soulIdleTimeoutMs: c.soulIdleTimeoutMs ?? b.soulIdleTimeoutMs } : {},
      ...(c.reasoningFuseChars ?? b.reasoningFuseChars) !== undefined ? { reasoningFuseChars: c.reasoningFuseChars ?? b.reasoningFuseChars } : {},
      ...((c.innerEvidence ?? b.innerEvidence) === false ? { innerEvidence: false } : {}),
      ...(c.innerRounds ?? b.innerRounds) !== undefined ? { innerRounds: c.innerRounds ?? b.innerRounds } : {},
      voteEffort: c.voteEffort ?? b.voteEffort ?? 'off',
      replayReasoning: c.replayReasoning ?? b.replayReasoning ?? 'off',
      ...(c.ballotTool ?? b.ballotTool) !== undefined ? { ballotTool: c.ballotTool ?? b.ballotTool } : {},
      ...(c.soulRetryBackoffMs ?? b.soulRetryBackoffMs) !== undefined ? { soulRetryBackoffMs: c.soulRetryBackoffMs ?? b.soulRetryBackoffMs } : {},
      ...(c.soulStaggerMs ?? b.soulStaggerMs) !== undefined ? { soulStaggerMs: c.soulStaggerMs ?? b.soulStaggerMs } : {},
      ...(c.nearIdentical ?? b.nearIdentical) !== undefined ? { nearIdentical: c.nearIdentical ?? b.nearIdentical } : {},
      ...(c.nearIdenticalSimilarity ?? b.nearIdenticalSimilarity) !== undefined ? { nearIdenticalSimilarity: c.nearIdenticalSimilarity ?? b.nearIdenticalSimilarity } : {},
      ...(c.statusHeartbeatMs ?? b.statusHeartbeatMs) !== undefined ? { statusHeartbeatMs: c.statusHeartbeatMs ?? b.statusHeartbeatMs } : {},
      // 数组两枚：schema 对缺键物化 []，与「用户显式空数组」不可区分——非空才下发，空 = 回落下一层（base → 插件默认）
      ...(c.exemptHostTools?.length ? { exemptHostTools: c.exemptHostTools } : b.exemptHostTools?.length ? { exemptHostTools: b.exemptHostTools } : {}),
    }
  }
  /** 监控/设置用的 AI 元数据：固定四个 + 名册三魂（含停用的，recent 表要能标注旧调用）。
   *  魂名跨魂数恒定——soul-A 位在魂数变化时归因不断流（历史 stats 键恒定）。 */
  function aiMeta() {
    const meta = { ...AI_META }
    for (const s of rosterSouls()) {
      meta[`soul-${s.name}`] = { label: soulLabel(s), role: '共识盲写/表决', soul: s.name, ...(s.title ? { title: s.title } : {}), enabled: s.enabled }
    }
    for (const id of Object.keys(stats)) {
      if (id.startsWith('soul-') && !(id in meta)) meta[id] = { label: `灵魂 ${id.slice(5)}`, role: '共识盲写/表决（已不在列表）', soul: id.slice(5), enabled: false }
    }
    return meta
  }
  function snapshotConfig() {
    const souls = resolveSouls() ?? []
    return {
      mode: current.mode,
      soulCount: soulCountOf(),
      memoryScope: current.memoryScope ?? base.memoryScope ?? 'full',
      userRetirement: (current.userRetirement ?? base.userRetirement) === true,
      unified: current.unified ?? {},
      fine: current.fine ?? {},
      consensus: resolveConsensus(),
      souls: rosterSouls(),   // 全名册 + 启用位（设置页「当前生效路由」与会话头部魂数用）
      base,
      resolved: Object.fromEntries([
        ...HUB_AI_IDS.map(id => [id, resolveAi(id)]),
        ...souls.map(s => [`soul-${s.name}`, resolveAi(`soul-${s.name}`)]),
      ]),
      persisted: scope !== null,
      revision,
    }
  }
  // 供其它 TriSoul 插件按需查询：ctx.bail('trisoul/ai-config', 'soul-A' | 'surgeon' | 'memory' | 'canvas') → { provider, model, temperature?, reasoningEffort? }
  ctx.on('trisoul/ai-config', (id) => (
    (HUB_AI_IDS.includes(id) || (typeof id === 'string' && id.startsWith('soul-'))) ? resolveAi(id) : undefined
  ), { global: true })
  // 共识插件按轮查询：ctx.bail('trisoul/consensus-config') → { trace, voteMaxTokens?, soulRetries?, soulTimeoutMs?, soulIdleTimeoutMs?, innerEvidence?:false, innerRounds?, voteEffort, replayReasoning }
  // （旧键 mergeRounds 已废弃；mergeEffort/ballotTokens/replayReasoningKeep 已随 v1 融合稿/批准票/选票截断退役，残留被忽略；replayReasoning 已恢复为 off/latest 两态）
  ctx.on('trisoul/consensus-config', () => resolveConsensus(), { global: true })
  // 记忆插件在会话首触时查询默认范围档（绑定后不再问）：ctx.bail('trisoul/memory-scope') → 'full'|'project'|'session'
  ctx.on('trisoul/memory-scope', () => current.memoryScope ?? base.memoryScope ?? 'full', { global: true })
  // ⑧ 用户原话退役开关（默认关）：canvas 圈区 / surgeon 执法每次动刀前查询，改设置即刻生效
  ctx.on('trisoul/user-retirement', () => (current.userRetirement ?? base.userRetirement) === true, { global: true })
  // 共识插件每轮开始查询：ctx.bail('trisoul/souls', sessionId?) → [{ name, title, persona, officer, provider, model, temperature, followMain?, enabled:true }]
  // 只含启用魂（前 soulCount 条）；路由无一可解析时 undefined → 共识插件退回 cordis 静态 souls。sessionId 忽略（会话级绑定已拆）
  ctx.on('trisoul/souls', () => resolveSouls(), { global: true })
  // 渠道协议（2026-08-30 格式锁按协议）：共识插件 / 记忆中枢按 provider 问「这渠道说什么协议」，据此挑格式锁字段。
  // 来源：不经桥的内建适配器固定表；桥自定义渠道读宿主 settings `llm-pi-ai.providers.<id>.api`（用户在 dsh 设置→模型填的就是它；
  // 桥内建预设不写 api → undefined，插件请求时再从 pi-ai 递来的 model.api 探明）。只读不写、不校验、不落盘。
  ctx.on('trisoul/provider-api', (provider) => protocolOf(provider), { global: true })

  // ---------- 2. 监控：llm/stream 归因统计 ----------
  const stats = Object.fromEntries([...HUB_AI_IDS, 'main'].map(id => [id, freshStat()]))
  for (const s of SOUL_ROSTER) stats[`soul-${s.name}`] = freshStat()
  const recent = []
  // ---------- 2.1 会话分桶：监控按会话看（轮次 / 时间线 / 最近调用），全局视图跨会话合并 ----------
  // 每会话保留最近 ROUNDS_KEEP 轮全文、TIMELINE_KEEP 条时间线（每次 LLM 调用 / 手术 / 状态区 / 探针 / 记忆动作 / 共识步起止）
  // 与 RECENT_SESSION_KEEP 条最近调用；会话数超 SESSIONS_KEEP 时淘汰最久没动静的。sessionId 缺失归 '?'。
  const SESSIONS_KEEP = 24, TIMELINE_KEEP = 800, RECENT_SESSION_KEEP = 120
  const sessions = new Map()
  /** ⑫ 每会话最新一帧盲写请求结构投影（phase:'context'）：sid → { ts, frame, souls }；插入序即最旧序，超额淘汰 */
  const contextFrames = new Map()
  function sessionOf(sid, touch = true) {
    const key = sid === undefined || sid === null || sid === '' ? '?' : String(sid)
    let b = sessions.get(key)
    if (!b) {
      b = { id: key, rounds: [], timeline: [], recent: [], stats: {}, totals: freshTotals(), consensus: freshConsensus(), firstAt: Date.now(), lastAt: Date.now() }
      sessions.set(key, b)
      if (sessions.size > SESSIONS_KEEP) {
        let oldest = null
        for (const x of sessions.values()) if (!oldest || x.lastAt < oldest.lastAt) oldest = x
        if (oldest) sessions.delete(oldest.id)
      }
    }
    if (touch) b.lastAt = Date.now()
    return b
  }
  /** 只读查看：不建桶（监控轮询未知会话不该污染会话列表） */
  const EMPTY_BUCKET = Object.freeze({ id: '?', rounds: [], timeline: [], recent: [] })
  const peekSession = (sid) => sessions.get(sid === undefined || sid === null || sid === '' ? '?' : String(sid)) ?? { ...EMPTY_BUCKET, id: String(sid) }
  /** 时间线条目：{ ts, durationMs, id, stage, ok, error?, note?, turnId?, sid } */
  function pushTimeline(sid, entry) {
    const b = sessionOf(sid)
    b.timeline.push({ ...entry, sid: b.id })
    if (b.timeline.length > TIMELINE_KEEP) b.timeline.splice(0, b.timeline.length - TIMELINE_KEEP)
  }
  /** 全局时间线：各会话合并按 ts 升序，取最新 TIMELINE_KEEP 条 */
  function mergedTimeline() {
    const all = []
    for (const b of sessions.values()) all.push(...b.timeline)
    all.sort((a, b) => a.ts - b.ts)
    return all.length > TIMELINE_KEEP ? all.slice(all.length - TIMELINE_KEEP) : all
  }
  // ---------- 2.5 评测指标（架构图 D）：进程生命周期内存累计，GET /trisoul/api/state → metrics ----------
  // 结构约定：率只存原始分子/分母计数（UI 算百分比）；均值项统一 { sum, count }（count=样本数）。
  const metrics = {
    // 共识健康（来自 trisoul/consensus 事件）
    consensus: {
      started: 0,               // start 事件数
      done: 0,                  // done 事件数（含 aborted）
      completed: 0,             // 非 aborted 完成数（各率分母）
      aborted: 0,
      identical: 0,             // 免表决（各稿一致直接放行）
      winner: 0,                // 选胜者定稿
      fallback: 0,              // 真降级（all-dead / 多魂死剩一魂）；单魂模式（mode:'single'）不计
      tieBreaks: 0,             // 候选平票（轮换裁定）次数（分母=winner）
      soulTimeouts: 0,          // 盲写超时（魂 × 次；重试用尽后仍超时才计）
      soulFailures: 0,          // 盲写失联（非超时错误，魂 × 次；重试用尽后仍失败才计）
      soulRetries: 0,           // 自动重试次数（phase:'retry' 事件；draft/vote 各阶段都算）
      retryRecovered: 0,        // 重试后成功的调用数（draft 稿 attempts>1 且无 error；vote 票 attempts>1 且 parsed）
      truncated: 0,             // 被输出上限截断的稿（finish max-tokens；稿不完整但存活）
      innerCalls: 0,            // 内层取证：插件当场执行的只读工具调用次数（phase:'inner' calls 数）
      innerErrors: 0,           // 其中报错的
      innerChars: 0,            // 结果字符累计（喂回前的原始长度）
      innerDrafts: 0,           // 取证过（innerRounds>0）的稿数
      // ⑬ 已摘：innerExhausted 计数——预算闸随内层瘦身拆除，插件不再发该字段
      ballotVia: { tool: 0, text: 0, none: 0 }, // 选票来源：cast_ballot 工具调用 / 正文 JSON 文本解析 / 弃权（结构化选票的落地率）
      ballots: 0,               // 表决总票数（弃权率分母）
      abstentions: 0,           // 弃权票：未选出候选（picks 空且非「不放行」/ parsed:false）
      winsBySoul: {},           // 胜者分布 name → 次数（winner/identical/single/solo；分母=各值之和）
      picksByLabel: {},         // 票选中的候选编号分布（选票顺序已随机化——编号分布明显不均=位置偏置回归；两魂互审「不放行」单独一桶）
      duration: { sum: 0, count: 0 }, // 完成轮次耗时 ms（非 aborted）
      // v2 tips 闸门（接替 v1 收编，2026-08-22）：知情率见 divergence.withFork；solo = 独走触发数、final = 收官补一轮数
      tips: {
        rounds: 0,              // 触发 tips 的轮数（phase:'tips' 事件数；一轮至多一次）
        claims: 0,              // 送达胜者的平行时间线条数（2026-08-28 起 = tips 条目数：分叉 / reference / unassessed）
        solo: 0,                // dest:'solo'——工具步挂账，下一步胜者独走吸收
        final: 0,               // dest:'final'——收官步放行前胜者补一轮吸收
      },
      // v2 独走步：单发胜者魂吸收挂账 tips（无盲写无表决）；失败 → 丢弃 tips 回退共识
      solo: { runs: 0, failed: 0 },
      // divergence 位（2026-08-28 表决重设计，接替 salvage：票面恒带 divergence 键）：非空率 = withFork/ballots = 知情票率
      divergence: {
        ballots: 0,             // 带 divergence 位的选票总数（分母）
        withFork: 0,            // divergence 非空的票数（知情票）
      },
      innerByTool: {},          // 内层取证按工具名计数（H 专属工具使用率：task_original / web_search / run_verify 等）
    },
    // 压缩健康（来自 trisoul/canvas 事件；phase 缺省视为 surgery，未知 phase 忽略不崩）
    compaction: {
      surgeries: 0,
      surgeryOk: 0,
      surgeryFailed: 0,
      regionChars: { sum: 0, count: 0 },       // 每次手术区间字符
      // 压缩比：事件同时带 chars 与 checkpointChars 才累计（现行 surgery 事件无检查点长度 → count 0 = null，不猜）
      ratio: { inChars: 0, outChars: 0, count: 0 },
      probes: { total: 0, passed: 0 },         // phase:'probe' { ok } 出现后自动累计
      probePatched: 0,                          // 探针未过后把材料补记进检查点的次数（#8）
      cooldowns: 0,             // 同一区间连续失败触发冷却的次数（对齐 canvas failCooldownSteps 判据）
      // A 轻量遮蔽刀（2026-08-21）：同源注入存活旧版 ≥K → pre-step 直接 shadow（无 LLM）
      shadows: { sweeps: 0, versions: 0 },     // 扫次数 / 累计遮蔽的旧版条数
    },
    // 记忆健康（来自 trisoul/memory 事件 + 手术事件的 sessionId 关联）
    memory: {
      recalls: { total: 0, hit: 0, items: 0 },        // 记忆回忆调用：次数 / 命中（≥1 条）/ 返回条数（埋点回忆率 = hit/total）
      rawRecalls: { total: 0, items: 0 },             // 原文回捞（seqRange）调用与返回事件数
      recallAfterSurgery: { surgeries: 0, recalled: 0 }, // 压后回捞率：成功手术中其区间后来被回捞过的（同会话 seq 区间相交）
      digests: { total: 0, ok: 0, added: 0, updated: 0, retired: 0, noJson: 0, truncated: 0 },
      curates: { total: 0, ok: 0, added: 0, updated: 0, retired: 0 },
      injections: { total: 0, memories: 0 },
    },
    // 思考用量
    reasoning: {
      // 共识事件侧：各 stage 思考链字符累计（draft 只计成功稿；count=样本数便于均值。
      // v2 无融合轮——稿思考只分 draft/vote 两桶，独走步/收官补一轮的稿仍按 draft 计）
      stageChars: {
        draft: { sum: 0, count: 0 },
        vote: { sum: 0, count: 0 },
      },
      // llm/stream 侧：`${stage}/${reasoningEffort ?? 'default'}` → { count, durationMs, reasoningTokens }
      // off vs 思考档位效率对比；表决 off 采用率 = vote/off.count ÷ Σ vote/*.count
      efforts: {},
    },
  }
  let lastFailedRegion = null // 冷却判据：上一次手术失败的区间 key（成功清零）
  const bumpKey = (map, key) => { map[key] = (map[key] ?? 0) + 1 }
  const addSample = (slot, v) => { if (typeof v === 'number' && Number.isFinite(v)) { slot.sum += v; slot.count++ } }
  /** 共识摘要（主循环行）：全局一份 + 每会话桶一份 */
  function freshConsensus() {
    return { turns: 0, inflight: 0, results: {}, lastMode: null, lastResult: null, lastRounds: null, lastWinner: null, lastDurationMs: null, lastAt: null, lastVotes: null }
  }
  function freshStat() {
    return { calls: 0, inflight: 0, errors: 0, input: 0, output: 0, cache: 0, reasoning: 0, context: 0,
      lastCall: null, lastDurationMs: null, lastError: null, lastPurpose: null, provider: null, model: null, stages: {} }
  }
  /** 整体用量（所有 TriSoul 组件的 LLM 调用合计，纯 token 账）：不从 stats 槽位加总——canvas 槽的 input 被复用装区间字符数。
   *  缓存率 = cache/(cache+input)（usage 口径：inputTokens=未命中，cacheReadTokens=命中），UI 算百分比。 */
  function freshTotals() {
    return { calls: 0, errors: 0, input: 0, output: 0, cache: 0, reasoning: 0 }
  }
  const totals = freshTotals()
  /** 统计槽按需创建：灵魂可增删改名，soul-<name> 首次出现时建槽 */
  function statOf(id) {
    return stats[id] ?? (stats[id] = freshStat())
  }
  /** 会话桶里的同名统计槽（组件状态按会话取景：本会话 / 全部）；sid 缺席归 '?' 桶 */
  function sessionStatOf(sid, id) {
    const b = sessionOf(sid)
    return b.stats[id] ?? (b.stats[id] = freshStat())
  }
  /** 全局槽 + 会话槽一起改：每处统计变更都对这两个目标各做一遍 */
  const bothStats = (id, sid) => [statOf(id), sessionStatOf(sid, id)]
  /** 会话视图的 stats：槽位与全局对齐（没记录的组件给零值槽），UI 不用判缺 */
  const sessionStats = (b) => Object.fromEntries(Object.keys(stats).map(k => [k, b.stats?.[k] ?? freshStat()]))
  function attribute(purpose) {
    if (!purpose) return { id: 'main', stage: 'turn' }
    const text = String(purpose)
    const slash = text.indexOf('/')
    const head = slash < 0 ? text : text.slice(0, slash)
    const who = slash < 0 ? '' : text.slice(slash + 1) // 名册魂名不含 '/'，但归因对脏 purpose 也要稳：取整个余部
    // v2 灵魂调用只剩 draft/vote 两 purpose（融合稿 trisoul-merge 与批准票 trisoul-approve 已随 v1 退役）
    if (head === 'trisoul-draft' || head === 'trisoul-vote') {
      return { id: who ? `soul-${who}` : 'main', stage: head.replace('trisoul-', '') }
    }
    if (head === 'trisoul-surgery') return { id: 'surgeon', stage: 'surgery' }
    if (head === 'trisoul-memory-digest') return { id: 'memory', stage: 'digest' }
    if (head === 'trisoul-recall') return { id: 'memory', stage: 'recall' }
    if (head === 'trisoul-memory-curate') return { id: 'memory', stage: 'curate' }
    if (head === 'trisoul-memory-inject') return { id: 'memory', stage: 'inject-pick' }  // 补注挑选（任务/主动/压缩后重注）
    // 画布小作业：状态区提炼 / 探针出题 / 探针作答（purpose trisoul-canvas-state / -probe-ask / -probe-answer）
    if (head === 'trisoul-canvas-state') return { id: 'canvas', stage: 'state' }
    if (head === 'trisoul-canvas-probe-ask' || head === 'trisoul-canvas-probe-answer') return { id: 'canvas', stage: 'probe' }
    return null // 其它辅助调用（compaction/session-title 等）不归 TriSoul
  }
  function pushRecent(entry, sid) {
    recent.unshift(entry)
    if (recent.length > recentLimit) recent.length = recentLimit
    const b = sessionOf(sid)
    b.recent.unshift(entry)
    if (b.recent.length > RECENT_SESSION_KEEP) b.recent.length = RECENT_SESSION_KEEP
  }
  ctx.on('llm/stream', (options, next) => {
    const who = attribute(options.purpose)
    if (!who) return next()
    const started = Date.now()
    const sid = options.sessionId ?? null
    const targets = bothStats(who.id, sid)
    const s = targets[0]
    for (const t of targets) {
      t.calls++; t.inflight++; t.lastCall = started; t.lastPurpose = options.purpose ?? null
      t.provider = options.provider; t.model = options.model
      t.stages[who.stage] = (t.stages[who.stage] ?? 0) + 1
    }
    const downstream = next()
    return (async function* () {
      let usage, failure = null
      // 未计量兜底：流被掐（abort/超时/熔断）时 usage 帧到不了，被掐的往往正是最大笔
      //（真机病例：24 分钟 100 万字思考 usage 0/0，看板全程隐形）——按已收增量累计字符，收尾时无计量就挂 approx
      let approxReasonChars = 0, approxTextChars = 0
      try {
        for await (const c of downstream) {
          if (c.type === 'usage') usage = c.usage
          else if (c.type === 'reasoning-delta') approxReasonChars += (c.text ?? '').length
          else if (c.type === 'text-delta') approxTextChars += (c.text ?? '').length
          else if (c.type === 'finish' && (c.reason?.kind === 'error' || c.reason?.kind === 'aborted')) {
            failure = c.reason?.failure?.message ?? c.reason?.kind
          }
          yield c
        }
      } catch (e) {
        failure = String(e); throw e
      } finally {
        const unmetered = !(usage?.outputTokens > 0) && (approxReasonChars + approxTextChars > 0)
          ? { reasoningChars: approxReasonChars, textChars: approxTextChars } : null
        const dur = Date.now() - started
        for (const t of targets) {
          t.inflight--
          t.lastDurationMs = dur
          if (failure) { t.errors++; t.lastError = failure.slice(0, 300) }
          if (usage) {
            t.input += usage.inputTokens ?? 0
            t.output += usage.outputTokens ?? 0
            t.cache += usage.cacheReadTokens ?? 0
            t.reasoning += usage.reasoningTokens ?? 0
            t.context = (usage.inputTokens ?? 0) + (usage.cacheReadTokens ?? 0)
          }
        }
        // 整体账（全局 + 会话桶）：每次组件 LLM 调用都计 calls/errors；token 只在拿到 usage 时累计
        for (const tt of [totals, sessionOf(sid).totals]) {
          tt.calls++
          if (failure) tt.errors++
          if (usage) {
            tt.input += usage.inputTokens ?? 0
            tt.output += usage.outputTokens ?? 0
            tt.cache += usage.cacheReadTokens ?? 0
            tt.reasoning += usage.reasoningTokens ?? 0
          }
        }
        // 评测：共识两 stage 按档位分桶（off vs 思考档位效率对比、表决 off 采用率）
        if (who.stage === 'draft' || who.stage === 'vote') {
          const key = `${who.stage}/${options.reasoningEffort ?? 'default'}`
          const bucket = metrics.reasoning.efforts[key] ?? (metrics.reasoning.efforts[key] = { count: 0, durationMs: 0, reasoningTokens: 0 })
          bucket.count++
          if (typeof s.lastDurationMs === 'number') bucket.durationMs += s.lastDurationMs
          bucket.reasoningTokens += usage?.reasoningTokens ?? 0
        }
        pushRecent({ ts: started, id: who.id, stage: who.stage, provider: options.provider, model: options.model,
          effort: options.reasoningEffort ?? null,
          durationMs: s.lastDurationMs, usage: usage ?? null, error: failure, sid: sid ?? '?',
          ...(unmetered ? { unmetered } : {}) }, sid)
        // 时间线：归到该会话正在进行的共识步（灵魂调用一定属于它；中枢作业可能在步与步之间，turnId 为 null）
        const inflightTurn = (who.id.startsWith('soul-') || who.id === 'main') ? (sessionOf(sid, false).rounds.find(r => r.inflight)?.turnId ?? null) : null
        pushTimeline(sid, { ts: started, durationMs: s.lastDurationMs, id: who.id, stage: who.stage, ok: !failure,
          ...(failure ? { error: failure.slice(0, 200) } : {}), ...(inflightTurn !== null ? { turnId: inflightTurn } : {}),
          ...(usage ? { tokens: (usage.inputTokens ?? 0) + (usage.cacheReadTokens ?? 0), out: usage.outputTokens ?? 0 } : {}) })
      }
    })()
  })
  // 共识插件上报（trisoul/consensus）：phase start/draft/vote/tips/solo/done（v2：融合/批准/收编相位已删，新增 tips 闸门与独走步）；main 行 = 共识轮次统计（主请求被共识拦截，不落 llm/stream 下游）
  const consensus = freshConsensus()
  // 共识轮次全文环形缓冲（最新在前）：start 事件带 turnId/prompt/ts；后续事件按 turnId 归并（缺 turnId 时归到最近一轮未完成的）
  const rounds = []
  // 2026-08-23 用户报「只有 30 轮不够用」：环形缓冲扩到 200（全文在内存，摘要列表轻量、全文按 turnId 单取）
  const ROUNDS_KEEP = 200
  // 全文进缓冲，不截（2026-08-18 用户令：不要任何截断/预算类限制；旧 TEXT_CAP=200k 已去）
  const cap = (v) => v
  const soulName = (v) => (v && typeof v === 'object' ? (v.name ?? v.soul ?? null) : (v ?? null))
  function openRound(info) {
    const turnId = info.turnId ?? `turn-${info.ts ?? Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const b = sessionOf(info.sessionId)
    const r = {
      turnId, ts: info.ts ?? Date.now(), prompt: cap(info.prompt ?? null), inflight: true,
      sessionId: b.id, promptSeq: typeof info.promptSeq === 'number' ? info.promptSeq : null,
      mode: info.mode ?? null, result: null, winner: null, rounds: null, durationMs: null, doneAt: null, finalText: null,
      souls: Array.isArray(info.souls) ? info.souls.map(soulName).filter(Boolean) : [],
      drafts: [], votes: [], retries: [], inner: [], tips: null, solo: null,
      // T4 心跳最新状态（phase:'status'）：{ stage, elapsedMs, ts }；段结束或本轮 done 时清空
      status: null,
      // 盲写实况（phase:'draft-delta'，真流式 2026-08-25）：{ [soul]: { ts, stage, round, attempt, textChars, reasoningChars, textTail, reasoningTail } }；
      // 高频幂等快照只留最新一帧（轮询端拿它=准流式），本轮 done 时清空——全文由 drafts 承载，live 不留双份
      live: null,
    }
    rounds.unshift(r)
    if (rounds.length > ROUNDS_KEEP) rounds.length = ROUNDS_KEEP
    b.rounds.unshift(r)
    if (b.rounds.length > ROUNDS_KEEP) b.rounds.length = ROUNDS_KEEP
    return r
  }
  function roundOf(info) {
    // 先在事件所属会话桶里找（同 turnId 只会在一个会话里；缺 turnId 归该会话最近未完成的一轮），再退回全局
    const b = info.sessionId !== undefined && info.sessionId !== null ? peekSession(info.sessionId) : null
    if (info.turnId !== undefined) return b?.rounds.find(r => r.turnId === info.turnId) ?? rounds.find(r => r.turnId === info.turnId) ?? findRoundEverywhere(info.turnId)
    return b?.rounds.find(r => r.inflight) ?? rounds.find(r => r.inflight) ?? null
  }
  function findRoundEverywhere(turnId) {
    for (const b of sessions.values()) { const r = b.rounds.find(x => String(x.turnId) === String(turnId)); if (r) return r }
    return null
  }
  function noteSoul(r, name) {
    if (name && !r.souls.includes(name)) r.souls.push(name)
  }
  function recordDraft(r, d, round) {
    if (!d || typeof d !== 'object') return
    const soul = soulName(d.soul ?? d.name)
    noteSoul(r, soul)
    r.drafts.push({
      round: d.round ?? round ?? 1, soul, title: d.title ?? null, provider: d.provider ?? null, model: d.model ?? null,
      reasoningEffort: d.reasoningEffort ?? null, reasoning: cap(d.reasoning ?? null),
      reasoningChars: typeof d.reasoningChars === 'number' ? d.reasoningChars : (typeof d.reasoning === 'string' ? d.reasoning.length : 0),
      // v2 两段式稿：splitDraft 拆出的 thinking/output 原样透传（没写标记 → thinking 空、output 全文）；旧形状事件不带这两键，不补
      text: cap(d.text ?? null),
      ...(typeof d.thinking === 'string' ? { thinking: d.thinking } : {}),
      ...(typeof d.output === 'string' ? { output: d.output } : {}),
      toolCalls: d.toolCalls ?? 0, tools: Array.isArray(d.tools) ? d.tools.map(String).slice(0, 32) : [], durationMs: d.durationMs ?? null, error: d.error ?? null,
      attempts: typeof d.attempts === 'number' ? d.attempts : 1,
      retries: Array.isArray(d.retries) ? d.retries.map(x => ({ attempt: x?.attempt ?? null, error: cap(String(x?.error ?? '')) })) : [],
      truncated: d.truncated === true,
      innerRounds: typeof d.innerRounds === 'number' ? d.innerRounds : 0,
      // 补枪记录（2026-08-29 补漏：插件 draftInfo 一直带 mend，这里没接——真机排查只能靠活捉；高频 = 该渠道盲写依从差）
      ...(d.mend && typeof d.mend === 'object' ? { mend: { kind: d.mend.kind ?? null, reason: cap(String(d.mend.reason ?? '')), attempts: typeof d.mend.attempts === 'number' ? d.mend.attempts : 1, durationMs: d.mend.durationMs ?? null, ...(d.mend.autofilled ? { autofilled: true } : {}) } } : {}),
      // 盲写多步思考链（2026-08-25 用户令）：取证 trail 每轮的 raw reasoning 透传（漏掉它=UI 只能看实时 inner 事件）
      inner: Array.isArray(d.inner) ? d.inner.map(x => ({ name: x?.name ?? null, args: cap(String(x?.args ?? '')), chars: x?.chars ?? 0, ok: x?.ok !== false, durationMs: x?.durationMs ?? null, ...(x?.reasoning ? { reasoning: String(x.reasoning) } : {}) })) : [],
    })
  }
  // ---------- 盲写实况 SSE（真流式，2026-08-25 用户拍板）----------
  // 订阅者收四类轻量帧：start（展开三栏）/ draft-delta（每魂快照）/ status（无流段心跳）/ done（收起）；
  // 其余（drafts 全文/表决/取证）照旧走轮询——SSE 只负责「正在写」的实时性，全文由现有 API 承载
  const streamClients = new Set()
  const wireOf = (info) => {
    const base = { phase: info.phase, ts: info.ts ?? Date.now(), turnId: info.turnId ?? null, sessionId: info.sessionId ?? null }
    if (info.phase === 'draft-delta') {
      return { ...base, soul: soulName(info.soul), stage: info.stage ?? null, round: info.round ?? null, attempt: info.attempt ?? null,
        textChars: info.textChars ?? 0, reasoningChars: info.reasoningChars ?? 0,
        textTail: typeof info.textTail === 'string' ? info.textTail : '', reasoningTail: typeof info.reasoningTail === 'string' ? info.reasoningTail : '' }
    }
    if (info.phase === 'status') return { ...base, stage: info.stage ?? null, elapsedMs: info.elapsedMs ?? null, ended: info.ended === true }
    if (info.phase === 'start') return { ...base, souls: Array.isArray(info.souls) ? info.souls.map(soulName).filter(Boolean) : [] }
    if (info.phase === 'done') return { ...base, mode: info.mode ?? null, result: info.result ?? null, winner: soulName(info.winner), rounds: info.rounds ?? null, durationMs: info.durationMs ?? null }
    return null
  }
  const broadcast = (info) => {
    if (!streamClients.size) return
    const wire = wireOf(info)
    if (!wire) return
    const data = `data: ${JSON.stringify(wire)}\n\n`
    for (const c of streamClients) {
      if (c.sessionId && String(wire.sessionId ?? '') !== c.sessionId) continue
      try { c.res.write(data) } catch { streamClients.delete(c) }
    }
  }
  ctx.on('trisoul/consensus', (info) => {
    if (!info || typeof info !== 'object') return
    broadcast(info)   // wireOf 只认 start/draft-delta/status/done，其余相位返回 null 不发
    // 盲写实况快照：只更新轮记录 live 桶（最新一帧），不进 drafts/timeline/metrics——高频幂等帧，done 时清
    if (info.phase === 'draft-delta') {
      const rs = roundOf(info)
      if (rs) {
        if (!rs.live || typeof rs.live !== 'object') rs.live = {}
        rs.live[soulName(info.soul) ?? '?'] = { ts: info.ts ?? Date.now(), stage: info.stage ?? null, round: info.round ?? null, attempt: info.attempt ?? null,
          textChars: typeof info.textChars === 'number' ? info.textChars : 0, reasoningChars: typeof info.reasoningChars === 'number' ? info.reasoningChars : 0,
          textTail: typeof info.textTail === 'string' ? info.textTail : '', reasoningTail: typeof info.reasoningTail === 'string' ? info.reasoningTail : '' }
      }
      return
    }
    // ⑫ 上下文框架：盲写主请求结构投影（每会话只留最新一帧）——不开轮、不进时间线，state ?sessionId= 暴露
    if (info.phase === 'context') {
      const sid = info.sessionId != null && info.sessionId !== '' ? String(info.sessionId) : '?'
      contextFrames.delete(sid)
      contextFrames.set(sid, { ts: info.ts ?? Date.now(), frame: info.frame ?? null, souls: Array.isArray(info.souls) ? info.souls : [] })
      if (contextFrames.size > SESSIONS_KEEP) { const oldest = contextFrames.keys().next().value; contextFrames.delete(oldest) }
      return
    }
    if (info.phase === 'start') {
      metrics.consensus.started++
      const r0 = openRound(info)
      for (const c of [consensus, sessionOf(r0.sessionId).consensus]) { c.turns++; c.inflight++ }
      for (const m of bothStats('main', r0.sessionId)) { m.calls++; m.inflight++; m.lastCall = info.ts ?? Date.now(); m.lastPurpose = 'consensus' }
      pushTimeline(info.sessionId, { ts: r0.ts, durationMs: null, id: 'main', stage: 'start', ok: true, turnId: r0.turnId,
        ...(r0.promptSeq !== null ? { promptSeq: r0.promptSeq } : {}), note: typeof r0.prompt === 'string' ? summarize(r0.prompt) : null })
      return
    }
    // T4 UI 心跳（phase:'status'）：表决/补枪/收官这几段没有流式输出，插件每 5s 报一次「还在跑、跑了多久」。
    // 只更新最新状态、不开轮（心跳开不出轮次：没有 start 就没有这一步）；ended = 该段结束，清掉。
    if (info.phase === 'status') {
      const rs = roundOf(info)
      if (rs) {
        rs.status = info.ended === true ? null : {
          stage: info.stage ?? null,
          elapsedMs: typeof info.elapsedMs === 'number' ? info.elapsedMs : null,
          ts: info.ts ?? Date.now(),
        }
      }
      return
    }
    const r = roundOf(info) ?? (info.phase === 'done' ? null : openRound({ ...info, prompt: null }))
    if (info.phase === 'inner') {
      // 内层取证：一轮里执行的只读工具调用（结果不进事件——只在该魂私有上下文）
      const calls = Array.isArray(info.calls) ? info.calls : []
      metrics.consensus.innerCalls += calls.length
      for (const c of calls) {
        if (c?.ok === false) metrics.consensus.innerErrors++
        if (typeof c?.chars === 'number') metrics.consensus.innerChars += c.chars
        bumpKey(metrics.consensus.innerByTool, String(c?.name ?? '?'))   // H 专属工具使用率的分子（按名分桶）
      }
      if (r) {
        r.inner.push({ ts: info.ts ?? Date.now(), stage: info.stage ?? null, soul: soulName(info.soul), round: info.round ?? null,
          // 盲写多步思考链（2026-08-25 用户令）：该取证轮盲写稿的 raw 思考——实时监控可看,不再只活在魂私有上下文
          ...(info.reasoning ? { reasoning: String(info.reasoning) } : {}),
          calls: calls.map(c => ({ name: c?.name ?? null, args: cap(String(c?.args ?? '')), chars: c?.chars ?? 0, ok: c?.ok !== false, durationMs: c?.durationMs ?? null })) })
        if (r.inner.length > 200) r.inner.shift()
      }
      return
    }
    if (info.phase === 'tips') {
      // v2 tips 闸门：败者时间线（分叉 / 全量送稿）→ 工具步挂账下一步独走（dest:'solo'）/ 收官步放行前补一轮（dest:'final'）
      const claims = Array.isArray(info.claims) ? info.claims : []
      metrics.consensus.tips.rounds++
      metrics.consensus.tips.claims += claims.length
      if (info.dest === 'solo') metrics.consensus.tips.solo++
      else if (info.dest === 'final') metrics.consensus.tips.final++
      if (r) {
        r.tips = { round: info.round ?? null, winner: soulName(info.winner) ?? null, dest: info.dest ?? null,
          claims: claims.map(c => ({ voter: soulName(c?.voter) ?? null, claim: cap(String(c?.claim ?? '')) })) }
      }
      pushTimeline(info.sessionId, { ts: info.ts ?? Date.now(), durationMs: null, id: 'main', stage: 'tips', ok: true,
        turnId: r?.turnId ?? info.turnId ?? null, note: `${claims.length} 条 claim 指向胜稿 ${soulName(info.winner) ?? '?'} → ${info.dest === 'final' ? '收官补一轮' : '独走吸收'}` })
      return
    }
    if (info.phase === 'solo') {
      // v2 独走步：上一步挂账的 tips 由胜者单发吸收（无盲写无表决）；失败 → 丢弃 tips 回退正常共识
      metrics.consensus.solo.runs++
      if (info.error) metrics.consensus.solo.failed++
      if (r) {
        r.solo = { winner: soulName(info.winner) ?? null, tips: typeof info.tips === 'number' ? info.tips : null,
          durationMs: info.durationMs ?? null, ...(info.error ? { error: String(info.error) } : {}) }
      }
      pushTimeline(info.sessionId, { ts: info.ts ?? Date.now(), durationMs: info.durationMs ?? null, id: 'main', stage: 'solo', ok: !info.error,
        turnId: r?.turnId ?? info.turnId ?? null, ...(info.error ? { error: String(info.error).slice(0, 200) } : {}),
        note: `灵魂 ${soulName(info.winner) ?? '?'} 独走（吸收 ${typeof info.tips === 'number' ? info.tips : '?'} 条 tips）` })
      return
    }
    if (info.phase === 'retry') {
      // 灵魂调用自动重试（draft/vote）：计数 + 轮次缓冲留痕（监控看得到「谁在第几次因为什么重试」）
      metrics.consensus.soulRetries++
      if (r) {
        r.retries.push({ ts: info.ts ?? Date.now(), stage: info.stage ?? null, soul: soulName(info.soul), attempt: info.attempt ?? null,
          next: info.next ?? null, delayMs: info.delayMs ?? null, error: cap(String(info.error ?? '')) })
        if (r.retries.length > 200) r.retries.shift()
      }
      return
    }
    if (info.phase === 'draft') {
      // 评测：盲写超时/失联计数 + 成功稿思考字符（与轮次缓冲无关，r 缺失也照记）
      const rawDrafts = Array.isArray(info.drafts) ? info.drafts : (info.soul !== undefined || info.draft) ? [info.draft ?? info] : []
      for (const d of rawDrafts) {
        if (!d || typeof d !== 'object') continue
        if (d.error) { if (d.timedOut) metrics.consensus.soulTimeouts++; else metrics.consensus.soulFailures++ }
        else {
          // v2 无重写轮：稿思考统一进 draft 桶（独走步/收官补一轮的稿也是 draft）
          addSample(metrics.reasoning.stageChars.draft,
            typeof d.reasoningChars === 'number' ? d.reasoningChars : (typeof d.reasoning === 'string' ? d.reasoning.length : 0))
          if (typeof d.attempts === 'number' && d.attempts > 1) metrics.consensus.retryRecovered++
          if (d.truncated === true) metrics.consensus.truncated++
        }
        if (typeof d.innerRounds === 'number' && d.innerRounds > 0) metrics.consensus.innerDrafts++
      }
      if (!r) return
      if (Array.isArray(info.drafts)) info.drafts.forEach(d => recordDraft(r, d, info.round))
      else if (info.soul !== undefined || info.draft) recordDraft(r, info.draft ?? info, info.round)
    } else if (info.phase === 'vote') {
      // 评测：票数/弃权/位置分布/平票轮换（票面 picks 形状为主；best/label 为旧形状兼容）
      if (Array.isArray(info.votes)) {
        const winnerVote = info.mode === 'winner' || info.votes.some(v => v && typeof v === 'object' && ('best' in v || 'label' in v || 'picks' in v))
        for (const v of info.votes) {
          if (!v || typeof v !== 'object') continue
          if (Array.isArray(v.picks)) {
            // picks = [灵魂名]（每魂 1 票只投别人），labels = 选票上的编号；空 picks 且非「不放行」= 弃权
            metrics.consensus.ballots += Math.max(1, v.picks.length)
            if (v.picks.length === 0 && v.reject !== true) metrics.consensus.abstentions++
            // divergence 位（票面恒带 divergence 键，空串也算带位）：非空 = 知情票（tips 触发 + 平票破平的信号）
            if ('divergence' in v) { metrics.consensus.divergence.ballots++; if (typeof v.divergence === 'string' && v.divergence.trim()) metrics.consensus.divergence.withFork++ }
            { const via = v.via === 'tool' || v.via === 'text' ? v.via : (v.picks.length === 0 || v.via === 'none') ? 'none' : 'text'; metrics.consensus.ballotVia[via]++ }
            if (typeof v.attempts === 'number' && v.attempts > 1 && v.parsed !== false && v.picks.length > 0) metrics.consensus.retryRecovered++
            for (const lb of (Array.isArray(v.labels) ? v.labels : [])) bumpKey(metrics.consensus.picksByLabel, String(lb))
          } else {
            metrics.consensus.ballots++
            if (winnerVote) {
              if (v.best === null || v.best === undefined) metrics.consensus.abstentions++
              else if (typeof v.label === 'number') bumpKey(metrics.consensus.picksByLabel, String(v.label))
            } else if (v.parsed === false) metrics.consensus.abstentions++
            if (v.via === 'tool' || v.via === 'text' || v.via === 'none') metrics.consensus.ballotVia[v.via]++
          }
          addSample(metrics.reasoning.stageChars.vote, typeof v.reasoning === 'string' ? v.reasoning.length : 0)
        }
        // v2 平票不改判融合而是轮换定胜者：tie=true 且真选出了胜者才算轮换——
        // 全员弃权（decision:'abstain'）时 counts 全零 tie 也恒 true，混进来会把「平票率」推成假数据
        if (winnerVote && info.tie === true && info.decision !== 'abstain') metrics.consensus.tieBreaks++
      }
      for (const c of [consensus, sessionOf(r?.sessionId ?? info.sessionId).consensus]) c.lastVotes = { round: info.round, total: info.total, decision: info.decision ?? null, winner: soulName(info.winner) ?? null }
      if (!r) return
      const votes = Array.isArray(info.votes) ? info.votes.map(v => ({
        soul: soulName(v?.soul ?? v?.name), ...(v?.best !== undefined ? { best: v.best } : {}),
        ...(Array.isArray(v?.picks) ? { picks: v.picks.map(x => soulName(x)) } : {}),
        ...(v?.reject === true ? { reject: true } : {}),
        ...(typeof v?.attempts === 'number' ? { attempts: v.attempts } : {}),
        ...(typeof v?.parsed === 'boolean' ? { parsed: v.parsed } : {}),
        ...(v?.via === 'tool' || v?.via === 'text' || v?.via === 'none' ? { via: v.via } : {}),
        ...(typeof v?.raw === 'string' && v.raw ? { raw: cap(v.raw) } : {}),
        ...(typeof v?.divergence === 'string' && v.divergence.trim() ? { divergence: cap(v.divergence) } : {}),
        reason: cap(v?.reason ?? null), reasoning: cap(v?.reasoning ?? null),
      })) : []
      votes.forEach(v => noteSoul(r, v.soul))
      r.votes.push({ round: info.round ?? r.votes.length + 1, total: info.total ?? null, votes,
        ...(info.decision ? { decision: info.decision, ballots: info.ballots ?? null,
          counts: Array.isArray(info.counts) ? info.counts.map(c => ({ soul: soulName(c?.soul), votes: c?.votes ?? 0 })) : null,
          winner: soulName(info.winner) ?? null, tie: info.tie === true,
          ...(typeof info.tieKind === 'string' ? { tieKind: info.tieKind } : {}) } : {}) })
    } else if (info.phase === 'done') {
      // 评测：结果分布 / 全票·免表决·降级 / 每魂胜率 / 平均耗时（aborted 不进率的分母与均值）
      {
        const mc = metrics.consensus
        const mode = info.mode ?? '?', result = info.result ?? '?'
        mc.done++
        if (result === 'aborted') mc.aborted++
        else {
          mc.completed++
          addSample(mc.duration, info.durationMs)
          if (result === 'identical') mc.identical++
          else if (result === 'winner') mc.winner++
          else if (mode === 'fallback') mc.fallback++ // 真降级才计（all-dead / 多魂死剩一魂都带 mode:'fallback'）；单魂模式 done 是 mode:'single'，不进降级账
          const w = soulName(info.winner)
          if (w) bumpKey(mc.winsBySoul, String(w))
        }
      }
      const key = `${info.mode ?? '?'}/${info.result ?? '?'}`
      const doneSid = r?.sessionId ?? info.sessionId
      for (const c of [consensus, sessionOf(doneSid).consensus]) {
        c.inflight = Math.max(0, c.inflight - 1)
        c.lastMode = info.mode ?? null; c.lastResult = info.result ?? null
        c.lastRounds = info.rounds ?? null; c.lastWinner = info.winner ?? null
        c.lastDurationMs = info.durationMs ?? null; c.lastAt = info.ts ?? Date.now()
        c.results[key] = (c.results[key] ?? 0) + 1
      }
      for (const m of bothStats('main', doneSid)) {
        m.inflight = Math.max(0, m.inflight - 1)
        m.lastDurationMs = info.durationMs ?? null
        m.stages[key] = (m.stages[key] ?? 0) + 1
      }
      pushRecent({ ts: info.ts ?? Date.now(), id: 'main', stage: key, durationMs: info.durationMs ?? null, usage: null, error: null,
        note: info.winner ? `胜者 ${info.winner}` : (info.rounds ? `${info.rounds} 轮` : null), sid: r?.sessionId ?? info.sessionId ?? '?' }, r?.sessionId ?? info.sessionId)
      pushTimeline(r?.sessionId ?? info.sessionId, { ts: r?.ts ?? ((info.ts ?? Date.now()) - (info.durationMs ?? 0)), durationMs: info.durationMs ?? null,
        id: 'main', stage: key, ok: info.result !== 'aborted' && info.mode !== 'fallback', turnId: r?.turnId ?? info.turnId ?? null,
        ...(info.winner ? { note: String(soulName(info.winner)) } : {}), ...(info.error ? { error: String(info.error).slice(0, 200) } : {}) })
      if (r) {
        r.inflight = false; r.doneAt = info.ts ?? Date.now(); r.status = null; r.live = null
        r.mode = info.mode ?? r.mode; r.result = info.result ?? null; r.rounds = info.rounds ?? null
        r.winner = soulName(info.winner) ?? null; r.durationMs = info.durationMs ?? null; r.finalText = cap(info.finalText ?? null)
        // ②（2026-08-23）旁白全文归档：主视图不再显示旁白（block-end 落蒸馏块），全文只活在这里（?turnId= 单轮可取）
        if (typeof info.narration === 'string' && info.narration !== '') r.narration = info.narration
        if (info.error) r.error = String(info.error).slice(0, 300)
      }
    }
  }, { global: true })
  /** 票面摘要（列表一眼看每步表决：谁投谁 / 计票 / 平票轮换；v2 一轮至多一次表决，取最近一条），全文仍在 ?turnId= */
  const ballotBrief = (r) => {
    const winnerVote = r.votes.length ? r.votes[r.votes.length - 1] : null
    if (!winnerVote) return null
    return {
      decision: winnerVote.decision ?? null, tie: winnerVote.tie === true,
      counts: winnerVote.counts ?? null,
      picks: winnerVote.votes.map(v => ({ soul: v.soul, pick: Array.isArray(v.picks) ? (v.picks[0] ?? null) : (v.best ?? null), reject: v.reject === true, via: v.via ?? null })),
    }
  }
  /** 轮次轻量摘要（state 3s 轮询与 /consensus 列表用；全文只在 ?turnId= 单轮；tips/solo 见 v2 闸门/独走） */
  const roundSummary = (r) => ({
    ballot: ballotBrief(r),
    turnId: r.turnId, ts: r.ts, prompt: typeof r.prompt === 'string' ? summarize(r.prompt) : r.prompt, inflight: r.inflight,
    sessionId: r.sessionId ?? null, promptSeq: r.promptSeq ?? null,
    mode: r.mode, result: r.result, winner: r.winner, rounds: r.rounds, durationMs: r.durationMs, souls: r.souls,
    drafts: r.drafts.length, votes: r.votes.length, retries: r.retries?.length ?? 0, inner: r.inner?.length ?? 0,
    ...(r.status ? { status: r.status } : {}), ...(r.tips ? { tips: r.tips } : {}), ...(r.solo ? { solo: r.solo } : {}), ...(r.error ? { error: r.error } : {}),
  })

  // 画布编排器上报（不调 LLM）：phase 缺省 = 'surgery' { start, end, chars, total, ok, error?, durationMs? }；
  // 未来 phase:'probe' { ok, question, seqRange } 渐进消费；其它未知 phase（如 'state'）忽略不崩、不计手术。
  /** sessionId → 成功手术区间 [{start,end,recalled}]（有界；用于压后回捞率） */
  const surgeryRanges = new Map()
  const SURGERY_SESSIONS_KEEP = 200, SURGERY_RANGES_KEEP = 200
  ctx.on('trisoul/canvas', (info) => {
    const phase = (info && typeof info.phase === 'string') ? info.phase : 'surgery'
    if (phase === 'probe') {
      metrics.compaction.probes.total++
      if (info.ok === true) metrics.compaction.probes.passed++
      // 失败文案：作业本身出错 → 错误串；出题作答都成功但判分未过 → 「验收未过：期望「x」实得「y」」（检查点丢了这条事实，仅告警不回滚）
      const probeError = info.ok === false
        ? (info.error != null ? String(info.error) : `验收未过：期望「${String(info.expected ?? '').slice(0, 60)}」实得「${String(info.got ?? '').slice(0, 60)}」${info.patched === true ? '（已补记进检查点）' : ''}`)
        : null
      if (info.patched === true) metrics.compaction.probePatched = (metrics.compaction.probePatched ?? 0) + 1
      const probeNote = typeof info.question === 'string'
        ? (info.ok === true && info.got != null ? `${info.question} → ${String(info.got).slice(0, 60)}` : info.question)
        : null
      pushRecent({ ts: Date.now(), id: 'canvas', stage: 'probe', durationMs: info.durationMs ?? null, usage: null,
        error: probeError ? probeError.slice(0, 300) : null,
        note: probeNote ? probeNote.slice(0, 200) : null, sid: info.sessionId ?? '?' }, info.sessionId)
      pushTimeline(info.sessionId, { ts: Date.now() - (info.durationMs ?? 0), durationMs: info.durationMs ?? null, id: 'canvas', stage: 'probe-result', ok: info.ok === true,
        ...(probeError ? { error: probeError.slice(0, 200) } : {}), note: probeNote ? probeNote.slice(0, 160) : null })
      return
    }
    if (phase === 'state') {
      pushTimeline(info.sessionId, { ts: Date.now() - (info.durationMs ?? 0), durationMs: info.durationMs ?? null, id: 'canvas', stage: 'state-result', ok: info.ok !== false,
        ...(info.ok === false ? { error: String(info.error ?? '').slice(0, 200) } : {}) })
      return
    }
    if (phase === 'shadow') {
      // A 轻量遮蔽刀：同源注入存活旧版 ≥K → pre-step 直接 shadow（无 LLM、不占手术冷却）
      metrics.compaction.shadows.sweeps++
      if (typeof info.versions === 'number') metrics.compaction.shadows.versions += info.versions
      pushTimeline(info.sessionId, { ts: Date.now(), durationMs: null, id: 'canvas', stage: 'shadow', ok: info.ok !== false,
        ...(info.ok === false ? { error: String(info.error ?? '').slice(0, 200) } : {}),
        note: `遮蔽旧版 ${info.versions ?? '?'} 条（${info.source ?? '?'}）` })
      return
    }
    if (phase !== 'surgery') return
    const canvasTargets = bothStats('canvas', info?.sessionId)
    const s = canvasTargets[0]
    for (const t of canvasTargets) {
      t.calls++; t.lastCall = Date.now(); t.lastPurpose = 'surgery'
      if (info?.ok === false) { t.errors++; t.lastError = String(info.error ?? '').slice(0, 300) }
      if (typeof info?.durationMs === 'number') t.lastDurationMs = info.durationMs
      if (typeof info?.chars === 'number') t.input += info.chars
      if (typeof info?.total === 'number') t.context = info.total
    }
    // 评测：手术次数/成败、区间字符、压缩比（chars→checkpointChars，事件没带就不计=null 不猜）、失败冷却
    const mcp = metrics.compaction
    mcp.surgeries++
    addSample(mcp.regionChars, info?.chars)
    if (info?.ok === false) {
      mcp.surgeryFailed++
      const key = (info.start !== undefined && info.end !== undefined) ? `${info.start}-${info.end}` : null
      if (key !== null && key === lastFailedRegion) mcp.cooldowns++ // 同一区间连续失败 → canvas 侧会进入冷却
      lastFailedRegion = key
    } else if (info?.ok === true) {
      mcp.surgeryOk++
      lastFailedRegion = null
      // 压后回捞：记下该会话的成功手术区间，等原文回捞事件来对
      if (typeof info.start === 'number' && typeof info.end === 'number') {
        const sid = info.sessionId ?? '?'
        let list = surgeryRanges.get(sid)
        if (!list) { surgeryRanges.set(sid, list = []); if (surgeryRanges.size > SURGERY_SESSIONS_KEEP) surgeryRanges.delete(surgeryRanges.keys().next().value) }
        list.push({ start: info.start, end: info.end, recalled: false })
        if (list.length > SURGERY_RANGES_KEEP) list.shift()
        metrics.memory.recallAfterSurgery.surgeries++
      }
      if (typeof info.chars === 'number' && typeof info.checkpointChars === 'number') {
        mcp.ratio.inChars += info.chars; mcp.ratio.outChars += info.checkpointChars; mcp.ratio.count++
      }
    }
    pushRecent({ ts: s.lastCall, id: 'canvas', stage: 'surgery', durationMs: info?.durationMs ?? null, usage: null,
      error: info?.ok === false ? String(info.error ?? '') : null, region: info ? { start: info.start, end: info.end, chars: info.chars } : null, sid: info?.sessionId ?? '?' }, info?.sessionId)
    pushTimeline(info?.sessionId, { ts: s.lastCall - (info?.durationMs ?? 0), durationMs: info?.durationMs ?? null, id: 'surgeon', stage: 'surgery-result', ok: info?.ok !== false,
      ...(info?.ok === false ? { error: String(info.error ?? '').slice(0, 200) } : {}),
      note: info && typeof info.start === 'number' ? `seq ${info.start}..${info.end} · ${info.chars ?? '?'} chars` : null })
  }, { global: true })

  // 记忆中枢上报（trisoul/memory）：回忆/回捞/消化/整理/注入 → 记忆健康指标；原文回捞与同会话手术区间相交 → 该手术记「回捞过」
  ctx.on('trisoul/memory', (info) => {
    if (!info || typeof info !== 'object') return
    const mm = metrics.memory
    if (info.phase === 'recall') {
      if (info.kind === 'raw') {
        mm.rawRecalls.total++
        if (typeof info.items === 'number') mm.rawRecalls.items += info.items
        const r = info.seqRange
        if (r && typeof r.start === 'number' && typeof r.end === 'number') {
          for (const g of surgeryRanges.get(info.sessionId ?? '?') ?? []) {
            if (!g.recalled && g.start <= r.end && r.start <= g.end) { g.recalled = true; mm.recallAfterSurgery.recalled++ }
          }
        }
      } else {
        mm.recalls.total++
        const hits = typeof info.hits === 'number' ? info.hits : 0
        if (hits > 0) mm.recalls.hit++
        mm.recalls.items += hits
      }
      // 记忆回忆走 LLM 时 recent 已由 llm/stream 归因记一行（memory/recall），这里只给不调 LLM 的原文回捞补一行
      if (info.kind === 'raw') {
        pushRecent({ ts: Date.now(), id: 'memory', stage: 'recall-raw', durationMs: null, usage: null, error: null,
          note: `seq ${info.seqRange?.start}..${info.seqRange?.end} → ${info.items ?? 0}`, sid: info.sessionId ?? '?' }, info.sessionId)
        pushTimeline(info.sessionId, { ts: Date.now(), durationMs: null, id: 'memory', stage: 'recall-raw', ok: true, note: `seq ${info.seqRange?.start}..${info.seqRange?.end} → ${info.items ?? 0}` })
      } else {
        pushTimeline(info.sessionId, { ts: Date.now(), durationMs: null, id: 'memory', stage: 'recall-result', ok: true, note: `${info.hits ?? 0}/${info.visible ?? '?'} · ${info.mode ?? ''}` })
      }
    } else if (info.phase === 'digest') {
      pushTimeline(info.sessionId, { ts: Date.now(), durationMs: null, id: 'memory', stage: 'digest-result', ok: info.ok === true,
        ...(info.ok === true ? { note: `+${info.added ?? 0} ~${info.updated ?? 0} -${info.retired ?? 0}` } : { error: String(info.error ?? 'digest failed').slice(0, 200) }) })
      mm.digests.total++
      if (info.ok === true) {
        mm.digests.ok++
        mm.digests.added += info.added ?? 0; mm.digests.updated += info.updated ?? 0; mm.digests.retired += info.retired ?? 0
        if (info.noJson === true) mm.digests.noJson++
        if (info.truncated === true) mm.digests.truncated++
      }
    } else if (info.phase === 'curate') {
      mm.curates.total++
      if (info.ok === true) { mm.curates.ok++; mm.curates.added += info.added ?? 0; mm.curates.updated += info.updated ?? 0; mm.curates.retired += info.retired ?? 0 }
      // 整理不属于某个会话（分片级）：时间线记到 '?' 桶（全局视图可见），note 带分片与触发方式
      const shardNote = `${info.shard ?? '?'}${info.trigger ? ` · ${info.trigger}` : ''}`
      pushTimeline(info.sessionId, { ts: Date.now(), durationMs: null, id: 'memory', stage: 'curate-result', ok: info.ok === true,
        ...(info.ok === true
          ? { note: `${shardNote} · +${info.added ?? 0} ~${info.updated ?? 0} -${info.retired ?? 0}${info.truncated ? ` · 截断 ${info.truncated}` : ''}` }
          : { error: String(info.error ?? 'curate failed').slice(0, 200), note: shardNote }) })
    } else if (info.phase === 'inject') {
      mm.injections.total++
      mm.injections.memories += typeof info.count === 'number' ? info.count : 0
      pushTimeline(info.sessionId, { ts: Date.now(), durationMs: null, id: 'memory', stage: 'inject', ok: true, note: `${info.count ?? 0}${info.source ? ` · ${info.source}` : ''}` })
    }
  }, { global: true })

  // ---------- 3. LLM 目录（provider → models → 推理等级），面板下拉用；adapters 变化时重拉 ----------
  const refreshDirectory = () => {
    directoryPromise = (async () => {
      const providers = ctx.llm.listProviders()
      const rows = await Promise.all(providers.map(async p => {
        try {
          const models = await ctx.llm.listModels(p.id)
          const withEfforts = await Promise.all(models.map(async m => {
            const row = { id: m.id, name: m.name ?? m.id }
            // 精确路由元数据（适配器本地解析，不走网络）：
            //   reasoning = { defaultEffort?, efforts: [id…] }（可选推理等级，如 off/high/max）| null（无推理能力）| 缺省（解析失败=未知）
            //   efforts = 同一列表带显示名（UI 下拉标签用）
            try {
              const info = typeof ctx.llm.resolveModelInfo === 'function' ? await ctx.llm.resolveModelInfo(p.id, m.id) : undefined
              if (info) {
                const efforts = (info.reasoning?.efforts ?? []).map(e => ({ id: e.id, name: e.name ?? e.id, ...(e.description ? { description: e.description } : {}) }))
                row.efforts = efforts
                row.reasoning = efforts.length
                  ? { efforts: efforts.map(e => e.id), ...(info.reasoning?.defaultEffort ? { defaultEffort: info.reasoning.defaultEffort } : {}) }
                  : null
                if (info.reasoning?.defaultEffort) row.defaultEffort = info.reasoning.defaultEffort
                if (info.context?.contextWindow) row.contextWindow = info.context.contextWindow
              }
            } catch { /* 目录里的模型解析失败：reasoning 未知（缺省），UI 退化为自定义输入 */ }
            return row
          }))
          return { id: p.id, name: p.name, models: withEfforts }
        } catch (e) {
          return { id: p.id, name: p.name, models: [], error: String(e).slice(0, 200) }
        }
      }))
      directory = rows
      return rows
    })().catch(e => { ctx.logger?.warn(`trisoul-api: 目录刷新失败 ${e}`); return directory })
    return directoryPromise
  }
  refreshDirectory()
  ctx.on('llm/adapters-updated', () => { refreshDirectory() }, { global: true })

  // ---------- 4. HTTP 路由 ----------
  const json = (res, status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
    res.end(JSON.stringify(body))
  }
  const readJson = async (req, limit = 256 * 1024) => {
    let body = ''
    for await (const chunk of req) {
      body += chunk
      if (body.length > limit) throw new Error('request body too large')
    }
    return body ? JSON.parse(body) : {}
  }
  /** 会话摘要（监控「全部会话」视图列出各会话）：轮数 / 最近活动 / 进行中 */
  const sessionSummary = (b) => ({ id: b.id, rounds: b.rounds.length, firstAt: b.firstAt, lastAt: b.lastAt,
    inflight: b.rounds.some(r => r.inflight), lastPrompt: (() => { const r = b.rounds[0]; return r && typeof r.prompt === 'string' ? summarize(r.prompt) : null })() })
  const state = async (sessionId) => {
    const b = sessionId ? peekSession(sessionId) : null
    return {
      ts: Date.now(),
      config: snapshotConfig(),
      // 已解析的启用灵魂（顺序=名册顺序）：监控卡片按此生成；persona 只给摘要（全文在 config.souls）
      souls: (resolveSouls() ?? []).map(s => ({ ...s, ...(s.persona ? { persona: summarize(s.persona) } : {}) })),
      ai: aiMeta(),
      // 会话作用域：?sessionId= 时组件状态（stats / 共识摘要）、轮次、时间线、最近调用只给该会话；否则全局累计
      stats: b ? sessionStats(b) : stats,
      // 整体用量（作用域跟随 stats）：所有组件 LLM 调用合计——输入(未命中)/输出/缓存命中/推理，缓存率 = cache/(cache+input)
      totals: b ? (b.totals ?? freshTotals()) : totals,
      consensus: b ? (b.consensus ?? freshConsensus()) : consensus,
      // 该会话绑定的记忆范围档（记忆插件 bail；null = 未绑定/插件缺席）；默认档在 config.memoryScope
      memoryScope: b ? memoryScopeOf(b.id) : null,
      // ⑫ 上下文框架：该会话最新一步盲写请求的消息结构投影 + 各魂 cacheReadTokens（缓存命中分界线）；全局视图 null
      contextFrame: b ? (contextFrames.get(b.id) ?? null) : null,
      scope: b ? { sessionId: b.id } : { sessionId: null },
      sessions: [...sessions.values()].filter(x => x.rounds.length || x.timeline.length).sort((x, y) => y.lastAt - x.lastAt).map(sessionSummary),
      consensusRounds: (b ? b.rounds : rounds).map(roundSummary),
      timeline: b ? b.timeline : mergedTimeline(),
      metrics,
      // 记忆中枢自检（#11）：库规模/usage 汇总/整理分片/进程计数——向记忆插件 bail 取，缺席（插件未装）为 null
      memoryHealth: memoryHealth(),
      recent: b ? b.recent : recent,
      directory: directory.length ? directory : await (directoryPromise ?? refreshDirectory()),
    }
  }
  function memoryHealth() {
    try { const h = ctx.bail('trisoul/memory-health'); return h && typeof h === 'object' ? h : null } catch { return null }
  }
  function memoryScopeOf(sid) {
    try { return ctx.bail('trisoul/memory-scope-of', sid) ?? null } catch { return null }
  }

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact', path: '/trisoul/api/state',
    handler: async (req, res) => {
      if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' })
      try {
        const url = new URL(req.url ?? '/', 'http://local')
        json(res, 200, await state(url.searchParams.get('sessionId') || null))
      } catch (e) { json(res, 500, { error: String(e) }) }
    },
  }), 'trisoul-api: /trisoul/api/state')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact', path: '/trisoul/api/settings',
    handler: async (req, res) => {
      if (req.method === 'GET') return json(res, 200, snapshotConfig())
      if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' })
      try {
        const body = await readJson(req)
        if (!scope) return json(res, 503, { error: 'settings service unavailable (namespace not persisted)' })
        if (body.reset === true) {
          await scope.replace({})
        } else {
          const patch = {}
          if (body.mode !== undefined) patch.mode = body.mode
          if (body.memoryScope !== undefined) patch.memoryScope = body.memoryScope
          if (body.userRetirement !== undefined) patch.userRetirement = body.userRetirement
          if (body.soulCount !== undefined) {
            // 1~3 整数；null/字符串/越界都响亮拒绝（schema 对 null 会当缺省回 3，这里先拦）。旧 souls/effort 键不认
            if (!SOUL_COUNTS.includes(body.soulCount)) return json(res, 400, { error: `soulCount 必须是 ${SOUL_COUNTS.join(' / ')}（收到 ${JSON.stringify(body.soulCount)}）` })
            patch.soulCount = body.soulCount
          }
          if (body.unified !== undefined) patch.unified = body.unified
          if (body.fine !== undefined) patch.fine = body.fine
          if (body.consensus !== undefined) patch.consensus = body.consensus
          SettingsSchema(patch) // 先过 schema：非法值响亮拒绝，不写盘
          await scope.update(patch)
        }
        current = scope.get()
        json(res, 200, snapshotConfig())
      } catch (e) {
        json(res, 400, { error: String(e?.message ?? e) })
      }
    },
  }), 'trisoul-api: /trisoul/api/settings')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact', path: '/trisoul/api/consensus',
    handler: async (req, res) => {
      if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' })
      try {
        const url = new URL(req.url ?? '/', 'http://local')
        const turnId = url.searchParams.get('turnId')
        if (turnId) {
          // turnId 来自 URL 是字符串，共识插件 emit 的是数字——按字符串形态比对；先全局环形缓冲，再各会话桶
          const r = rounds.find(x => String(x.turnId) === turnId) ?? findRoundEverywhere(turnId)
          return r ? json(res, 200, { round: r }) : json(res, 404, { error: 'round not found (only the latest rounds are kept in memory)' })
        }
        const sessionId = url.searchParams.get('sessionId')
        const list = sessionId ? peekSession(sessionId).rounds : rounds
        json(res, 200, { rounds: list.map(roundSummary), keep: ROUNDS_KEEP, ...(sessionId ? { sessionId } : {}) })
      } catch (e) { json(res, 500, { error: String(e) }) }
    },
  }), 'trisoul-api: /trisoul/api/consensus')

  // 盲写实况 SSE：EventSource 长连接，?sessionId= 可选过滤；15s 心跳防中间层断连；插件卸载时全体收尾
  ctx.effect(() => {
    const un = ctx.webServer.register({
      kind: 'exact', path: '/trisoul/api/consensus/stream',
      handler: (req, res) => {
        if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' })
        const url = new URL(req.url ?? '/', 'http://local')
        const sessionId = url.searchParams.get('sessionId')
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', 'x-accel-buffering': 'no' })
        res.write(': connected\n\n')
        const client = { res, sessionId: sessionId || null }
        streamClients.add(client)
        req.on('close', () => streamClients.delete(client))
      },
    })
    const beat = setInterval(() => {
      for (const c of streamClients) { try { c.res.write(': ping\n\n') } catch { streamClients.delete(c) } }
    }, 15_000)
    beat.unref?.()   // 心跳不 hold 事件循环（server 自身保活进程；测试环境 effect 不跑 disposer 也不挂）
    return () => {
      clearInterval(beat)
      for (const c of streamClients) { try { c.res.end() } catch {} }
      streamClients.clear()
      if (typeof un === 'function') un()
    }
  }, 'trisoul-api: /trisoul/api/consensus/stream')

  ctx.logger?.info('trisoul-api: 已注册 /trisoul/api/state, /trisoul/api/settings, /trisoul/api/consensus')
}
