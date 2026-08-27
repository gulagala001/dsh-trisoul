// 画布状态区（架构图「工作上下文三分区」的会话内实现）：
// - 恒真区 pinned[]：用户原话里的硬约束/拍板决策/关键事实，只增不改
// - 状态区 status：当前计划/进度/结论的全量快照，原地改写
// 提炼：LLM 小作业（off 门控）从最近事件增量提炼；状态存内存（会话结束即弃，agent/disposed 清理）。
// 注入（P2-2 换代制，2026-08-20）：每次变更在 pre-step 边界（与手术刀同一安全点）session.append
//   surfaceOp:'append' 一版新状态消息——纯追加不改历史前部，前缀缓存零破坏。旧版失去钉死资格
//   （canvas 只钉最新一版），由下一刀手术顺路吞掉（手术步本来就要重付缓存，零额外破坏）。
//   旧「原地 replace」方案作废：真机 380 步改写 162 次，每次把状态消息（钉在会话早期位置）
//   之后的整场前缀缓存作废，是仅次于手术的第二大缓存杀手。
// 与记忆中枢的分工：记忆是跨会话长期事实（session-start 注入），状态区是会话内工作状态——提炼输入
//   跳过一切 plugin 注入消息（含记忆注入与状态区自身），互不重复、不自反馈。
// 与手术刀的契约：注入的状态消息 source={kind:'plugin',plugin:'trisoul-canvas'}，canvas 圈手术区间时按此过滤避开（恒真区禁入手术）。
import { renderEventText, formatRendered } from './render.mjs'
import { parseJson } from './job.mjs'

const STATE_SYSTEM = `You are the canvas scribe, maintaining the two zones of the current session's working context (session-scoped only; cross-session long-term facts belong to the memory hub — do not duplicate them):
- Pinned truths: hard constraints from the user's own words, explicitly settled decisions, key facts that must not be violated. Append-only, one fact per entry, short sentences, each understandable on its own.
- Status: a snapshot of the current task's plan / progress / conclusions, rewritten wholesale each time, concise.
Discipline: when unsure, keep it out of the pinned zone; process noise stays out of the status zone.`

const STATE_FORMAT = `Output JSON (JSON only):
{"pin":["newly appeared pinned entries…"],"status":"the rewritten full status snapshot"}
pin lists only pinned entries that newly appeared in this batch of events ([] if none; never repeat existing entries); status is the complete snapshot every time (carry over the still-valid parts of the old status, fold away what's finished or obsolete).
status is a metabolic snapshot, not a running log: collapse finished chunks into one-line conclusions, delete what was overturned or outdated, keep only the latest wording for any one matter — its length should shrink as the task converges, not grow monotonically over time (real-session pathology: one version bloated from 270 to 12000+ chars, all stale progress that was never metabolized).
Write both zones in English; when pinning a user constraint or decision, quote the user's exact words verbatim in their original language (never translate or paraphrase a direct quote).`

export function createStateZone(ctx, { config = {}, runJob, report, warn, dbg = () => {} }) {
  const enabled = config.state ?? true
  const every = Math.max(1, config.stateEvery ?? 8)              // 攒够 N 条可提炼事件才跑一次小作业（⑤ 2026-08-23：4→8，降频提炼省小作业调用）
  // 2026-08-18 用户令：不要任何截断/预算类限制——单次喂入条数 / 恒真条目数 / 单事件字数 / 输出上限默认全部不设，用户显式给正数才生效
  const batchMax = config.stateBatchMax > 0 ? Math.max(every, config.stateBatchMax) : 0   // 0 = 积压全喂
  const maxPinned = config.statePinnedMax > 0 ? config.statePinnedMax : 0                 // 0 = 不限
  const failCooldown = config.stateFailCooldownSteps ?? 3        // 提炼失败冷却 N 步再试
  // 连续失败到这个数 → 状态区判定为降级，画布停止动刀（0 = 不熔断）。
  // 手术的正当性建立在「压走的原文有状态区接着」；提炼塌了还继续切，就是纯信息损失。
  const failLimit = config.stateFailLimit > 0 ? config.stateFailLimit : (config.stateFailLimit === 0 ? 0 : 2)
  const eventChars = config.stateEventChars > 0 ? config.stateEventChars : 0             // 0 = 全文
  const maxTokens = config.stateMaxTokens > 0 ? config.stateMaxTokens : undefined

  /** sessionId -> 会话内状态（内存态，会话结束即弃） */
  const sessions = new Map()
  const recordOf = (sid) => {
    let s = sessions.get(sid)
    if (!s) {
      s = { pinned: [], status: '', cursor: -1, dirty: false, running: false, cooldown: 0, failures: 0, counter: 0, adopted: false }
      sessions.set(sid, s)
    }
    return s
  }

  // 对外契约：ctx.bail('trisoul/canvas-state', sessionId) → { pinned:[], status:'' }（未见过的会话 → undefined）
  ctx.on('trisoul/canvas-state', (sessionId) => {
    const s = sessions.get(sessionId)
    return s ? { pinned: [...s.pinned], status: s.status } : undefined
  }, { global: true })

  // 会话结束即弃（best-effort：假 ctx / 精简 ctx 可能没这个事件位）
  try {
    ctx.on('agent/disposed', (payload) => {
      const sid = (payload?.agent ?? payload)?.session?.id
      if (sid) sessions.delete(sid)
    }, { global: true })
  } catch {}

  // ⑩ 水印（2026-08-23）：英文头带 snapshot vN · as of seq S · supersedes 换代语义；旧中文头/分区行双认（resume 接管存量会话）
  const HEAD = (s) => `[Working state · snapshot v${s.counter} · as of seq ${Math.max(0, s.cursor)} · supersedes all earlier versions]`
  const HEAD_RE = /^\[Working state · snapshot v\d+ · as of seq \d+ · supersedes all earlier versions\]$/
  const HEAD_LEGACY = '【TriSoul 画布状态区 · 会话内（按版本追加，永远只看最新一条，旧版一律作废）】'
  const HEAD_LEGACY_REPLACE = '【TriSoul 画布状态区 · 会话内（本条会被原地改写，永远只看最新版）】'   // 旧 replace 制的头（resume 接管旧会话用）
  const PIN_HEAD = '◆ Pinned truths (user constraints / decisions; append-only)'
  const PIN_HEAD_LEGACY = '◆ 恒真区（用户约束/决策，只增不改）'
  const STATUS_HEAD = '◆ Status (current plan / progress / conclusions)'
  const STATUS_HEAD_LEGACY = '◆ 状态区（当前计划/进度/结论）'
  const ID_PREFIX = 'trisoul-canvas-state-'
  const renderStateText = (s) => {
    const parts = [HEAD(s)]
    if (s.pinned.length) {
      parts.push(PIN_HEAD)
      parts.push(s.pinned.map((p, i) => `${i + 1}. ${p}`).join('\n'))
    }
    if (s.status.trim()) {
      parts.push(STATUS_HEAD)
      parts.push(s.status.trim())
    }
    return parts.join('\n')
  }
  /** renderStateText 的逆：从状态消息文本解析回 {pinned,status}（会话 resume 时接管转录里已有的状态消息用）。 */
  const parseStateText = (text) => {
    const lines = String(text ?? '').split('\n')
    if (!HEAD_RE.test(lines[0]) && lines[0] !== HEAD_LEGACY && lines[0] !== HEAD_LEGACY_REPLACE) return undefined
    const pinned = []
    const statusLines = []
    let zone = null
    for (const line of lines.slice(1)) {
      if (line === PIN_HEAD || line === PIN_HEAD_LEGACY) { zone = 'pin'; continue }
      if (line === STATUS_HEAD || line === STATUS_HEAD_LEGACY) { zone = 'status'; continue }
      if (zone === 'pin') { const m = line.match(/^\d+\. (.*)$/); if (m) pinned.push(m[1]) }
      else if (zone === 'status') statusLines.push(line)
    }
    return { pinned, status: statusLines.join('\n').trim() }
  }
  /**
   * 会话 resume（新进程/新 canvas 实例，内存态已丢）：转录里若已有本插件的状态消息，接管最新一条——
   * 恢复 pinned/status、把它当作最新一版（后续变更继续 append 换代；旧 replace 制会话的头文案也认），
   * 并把提炼游标推到它之后，别重复注入、别重提旧事件。
   */
  const adoptExisting = (session, s) => {
    s.adopted = true
    const events = session.events
    let last
    for (const e of events) {
      if (e.type === 'user/message' && e.data?.source?.kind === 'plugin' && e.data?.source?.plugin === 'trisoul-canvas'
        && typeof e.data?.id === 'string' && e.data.id.startsWith(ID_PREFIX)) last = e
    }
    if (!last) return
    const parsed = parseStateText(last.data.content?.find(b => b?.type === 'text')?.text)
    if (!parsed) return
    s.pinned = maxPinned > 0 ? parsed.pinned.slice(0, maxPinned) : [...parsed.pinned]
    s.status = parsed.status
    s.cursor = Math.max(s.cursor, last.seq)
    const n = last.data.id.slice(ID_PREFIX.length).match(/-(\d+)$/)
    if (n) s.counter = Math.max(s.counter, Number(n[1]))
    dbg(`状态区接管转录里的状态消息 seq ${last.seq}（pinned ${s.pinned.length} 条）`)
  }

  const buildMessage = (s, sid) => Object.freeze({
    id: `trisoul-canvas-state-${sid}-${++s.counter}`,
    role: 'user',
    content: Object.freeze([Object.freeze({ type: 'text', text: renderStateText(s) })]),
    source: Object.freeze({ kind: 'plugin', plugin: 'trisoul-canvas' }),
  })

  /**
   * 注入维护（P2-2 换代制）：有变更就在尾部 append 一版新状态消息（首版与换代同一操作）。
   * 纯追加不改历史前部——前缀缓存零破坏；旧版失去钉死资格（定位靠 ID_PREFIX 扫描、取 seq 最大者），
   * 由下一刀手术当作直通材料顺路吞掉。不再走 agent.inject/inbox（append 在 pre-step 边界即时生效，
   * 与手术刀同一安全点，也免去「注入未被 claim 视为丢失重注」的整套机器）。
   */
  function maintainInjection(agent, s, sid) {
    const session = agent.session
    if (!s.dirty) return
    if (!s.pinned.length && !s.status.trim()) return
    const msg = buildMessage(s, sid)
    try {
      const ev = session.append('user/message', msg, { surfaceOp: 'append' })
      s.dirty = false
      dbg(`状态区换代注入: seq ${ev.seq}`)
    } catch (e) { warn(`状态区注入失败 ${String(e).slice(0, 200)}`) }
  }

  /** 提炼作业：从 cursor 之后的可提炼事件增量提炼恒真条目 + 改写状态摘要。 */
  async function distill(agent, s, sid, signal) {
    const events = agent.session.events
    let fresh = []
    for (const e of events) {
      if (!(e.seq > s.cursor)) continue
      const r = renderEventText(e, { maxChars: eventChars, skipPluginUser: true })
      if (r) fresh.push(r)
    }
    if (fresh.length < every) return
    if (batchMax > 0 && fresh.length > batchMax) fresh = fresh.slice(-batchMax) // 用户自设上限时积压保最新
    const start = fresh[0].seq
    const end = fresh[fresh.length - 1].seq
    s.running = true
    const t0 = Date.now()
    try {
      const prompt = `Existing pinned truths (append-only):\n${s.pinned.length ? s.pinned.map((p, i) => `${i + 1}. ${p}`).join('\n') : '(empty)'}` +
        `\n\nCurrent status zone:\n${s.status.trim() || '(empty)'}` +
        `\n\nNew events (seq ${start}..${end}):\n${formatRendered(fresh)}\n\n${STATE_FORMAT}`
      const { text, truncated } = await runJob({
        purpose: 'trisoul-canvas-state', system: STATE_SYSTEM, prompt, maxTokens, signal, sessionId: sid,
      })
      if (truncated) warn(`状态区提炼输出被 maxTokens${maxTokens ? `(${maxTokens})` : '（提供方默认）'} 截断`)
      const parsed = parseJson(text)
      if (!parsed) {
        if (!truncated) warn('状态区提炼输出不是 JSON，本批跳过')
        s.cooldown = failCooldown
        s.failures++
        report({ phase: 'state', ok: false, sessionId: sid, seqRange: { start, end }, error: 'not-json', durationMs: Date.now() - t0 })
        return
      }
      const before = s.pinned.length
      if (Array.isArray(parsed.pin)) {
        for (const p of parsed.pin) {
          const t = typeof p === 'string' ? p.trim() : ''
          if (t && !s.pinned.includes(t) && (maxPinned === 0 || s.pinned.length < maxPinned)) s.pinned.push(t)
        }
      }
      let statusChanged = false
      if (typeof parsed.status === 'string' && parsed.status.trim() !== s.status) {
        s.status = parsed.status.trim()
        statusChanged = true
      }
      s.cursor = end
      s.failures = 0
      if (s.pinned.length > before || statusChanged) s.dirty = true
      dbg(`状态区提炼: seq ${start}..${end} pinned+${s.pinned.length - before} status=${s.status.length}字`)
      report({ phase: 'state', ok: true, sessionId: sid, seqRange: { start, end },
        pinned: s.pinned.length, pinnedAdded: s.pinned.length - before, statusChars: s.status.length,
        durationMs: Date.now() - t0 })
    } catch (e) {
      s.cooldown = failCooldown
      s.failures++
      warn(`状态区提炼失败 ${String(e).slice(0, 300)}`)
      report({ phase: 'state', ok: false, sessionId: sid, seqRange: { start, end },
        error: String(e).slice(0, 300), durationMs: Date.now() - t0 })
    } finally { s.running = false }
  }

  /**
   * 步边界钩子（由 index 的 agent/pre-step 调用）：先维护注入，再调度提炼。
   * 提炼异步跑、不阻塞主循环；返回的 Promise 仅供测试 await。
   */
  function onPreStep(agent, signal) {
    if (!enabled || !agent?.session) return
    const sid = agent.session.id
    const s = recordOf(sid)
    if (!s.adopted) { try { adoptExisting(agent.session, s) } catch (e) { warn(`状态区接管失败 ${String(e).slice(0, 200)}`) } }
    try { maintainInjection(agent, s, sid) } catch (e) { warn(`状态区注入维护失败 ${String(e).slice(0, 200)}`) }
    if (s.cooldown > 0) { s.cooldown--; return }
    if (s.running) return
    return distill(agent, s, sid, signal).catch((e) => { warn(`状态区作业异常 ${String(e).slice(0, 200)}`) })
  }

  /** 状态区是否已降级（连续失败达 stateFailLimit）——画布据此停止动刀。 */
  function degraded(sessionId) {
    if (!enabled || failLimit <= 0) return false
    return (sessions.get(sessionId)?.failures ?? 0) >= failLimit
  }

  return { enabled, onPreStep, sessions, degraded, failLimit }
}
