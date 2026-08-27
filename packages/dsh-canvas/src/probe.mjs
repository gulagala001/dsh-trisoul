// 探针题验收：每次手术（compactRegion 成功）后，用 LLM 小作业（off 门控）验收检查点质量。
// 三步：①出题——从被压区间的预压缩稿（记忆中枢 ctx.bail('trisoul/memory-digest')）或原文回退渲染
//   抽 1 道事实探针题（有标准答案）；②作答——只拿「手术后的检查点文本」答题；③判分——本地归一化比对。
// 结果 ctx.emit('trisoul/canvas', {phase:'probe', ok, question, expected, got, seqRange, patched?})；
// 失败仅告警（不回滚）；判分未过（非作业错误）→ 补记（#8）：
//   P2-3（2026-08-20，默认 'ride' 搭车制）：「问题 → 期望答案」一行先攒在本插件内存（peekNotes/consumeNotes），
//   随下一刀手术写进新检查点（surgeon 把它并入纪要原料）——旧「立即 surfaceOp:replace 改写检查点」
//   一场 380 步多出 57 次计划外前缀缓存作废；久无下一刀时事实仍可 trisoul_recall 回捞，不丢。
//   config.probePatch='qa' 回「立即改写补一行」旧行为；'material' 回「立即贴整份材料」更旧行为
//   （P1-5，2026-08-19 取证：material 曾把 742 字检查点贴成 16063 字、病态膨胀 54%）。
import { parseJson } from './job.mjs'
import { renderEventText } from './render.mjs'

const ASK_SYSTEM = `You are the probe examiner. Write exactly 1 objective factual question from the given material: the answer must be directly findable in the material, unique, and short (a number / name / file / command / conclusion). No subjective questions, no multi-part questions.`
const ASK_FORMAT = `Output JSON (JSON only): {"question":"the question","expected":"the reference answer (as short as possible)"}`
const ANSWER_SYSTEM = `You are the answerer. Answer only from the given text; using any other knowledge is forbidden. If the answer is not in the text, output only UNKNOWN.`

/** 归一化：小写、去空白与常见中英标点——判分只看事实内核，不看措辞。
 *  数字间的小数点保留（"2.5" 剥成 "25" 会与真 25 混判），句读点照剥。 */
export function normalizeAnswer(s) {
  return String(s ?? '').toLowerCase()
    // 全角数字/字母 → 半角；乘号 ×/✕/ｘ → x（真机：期望「900x600」实得「900×600 像素」曾被误判失败）
    .replace(/[\uff10-\uff19\uff21-\uff3a\uff41-\uff5a]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[×✕✖⨯]/g, 'x')
    .replace(/(?<!\d)\.|\.(?!\d)/g, '')
    .replace(/[\s,，。、；;：:！!？?'"「」『』（）()[\]【】<>《》—\-–_*`~]/g, '')
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** 数字边界包含：needle 在 hay 中出现且两侧不是数字——"8080" 命中「端口 8080」，
 *  但 "3" 不命中 "13"、"8080" 不命中 "18080"、"v2" 不命中 "v20"（裸 includes 对短数字答案零边界，误判通过）。 */
const boundedIncludes = (hay, needle) => new RegExp(`(?<![0-9])${escapeRe(needle)}(?![0-9])`).test(hay)

/** 判分：got 为空/UNKNOWN 判负；否则归一化后按数字边界互相包含即判对（"8080" vs "端口 8080" 都算）。 */
export function judgeProbe(expected, got) {
  const rawGot = String(got ?? '').trim()
  if (!rawGot || /^unknown$/i.test(rawGot)) return false
  const a = normalizeAnswer(expected)
  const b = normalizeAnswer(rawGot)
  if (!a || !b) return false
  return boundedIncludes(a, b) || boundedIncludes(b, a)
}

export function createProber(ctx, { config = {}, runJob, report, warn, dbg = () => {} }) {
  const enabled = config.probe ?? true
  // 2026-08-18 用户令：不要任何截断/预算类限制——出题材料 / 补记 / 输出上限默认全部不设，用户显式给正数才生效
  const sourceChars = config.probeSourceChars > 0 ? config.probeSourceChars : 0
  const maxTokens = config.probeMaxTokens > 0 ? config.probeMaxTokens : undefined
  const patchChars = config.probePatchChars > 0 ? config.probePatchChars : 0
  // ride（默认）= 攒着随下一刀写入；qa = 立即改写检查点补一行（旧）；material = 立即贴整份材料（更旧）
  const patchMode = config.probePatch === 'material' ? 'material' : config.probePatch === 'qa' ? 'qa' : 'ride'
  const PATCH_HEAD = '[Addendum · key facts from the condensed span]'
  const PATCH_HEAD_LEGACY = '【探针补记 · 被压区间关键事实】'   // 旧中文头：存量检查点判重/续行双认（⑨ 2026-08-23）
  const hasPatchHead = (text) => text.includes(PATCH_HEAD) || text.includes(PATCH_HEAD_LEGACY)

  /** sessionId -> 待搭车的补记行（ride 模式） */
  const pending = new Map()
  // 会话结束即弃（终审 F8：prober 生命周期是进程，长驻 3081 会按 sessionId 无限累积，
  // 且同 id 会话 resume 时旧补记会搭上新会话的刀）；best-effort：精简 ctx 可能没这个事件位
  try {
    ctx.on('agent/disposed', (payload) => {
      const sid = (payload?.agent ?? payload)?.session?.id
      if (sid) pending.delete(sid)
    }, { global: true })
  } catch {}
  /** 待搭车补记快照（canvas 手术前取，交给 surgeon 并入纪要原料） */
  const peekNotes = (sid) => [...(pending.get(sid) ?? [])]
  /** 按快照逐条消账（canvas 手术成功后调）：只删写进检查点的那批，手术中途新到的留给下一刀 */
  const consumeNotes = (sid, lines) => {
    const cur = pending.get(sid)
    if (!cur) return
    const drop = new Set(lines)
    const left = cur.filter(l => !drop.has(l))
    if (left.length) pending.set(sid, left)
    else pending.delete(sid)
  }

  /** 找检查点消息：优先 compactionId 精确匹配；缺席时取最新的、sourceEventSeqs 覆盖 lo 的检查点（source.compactionId 存在）。 */
  const findCheckpoint = (session, compactionId, lo) => {
    const events = session.events
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i]
      if (e.type !== 'user/message' || e.data?.source?.compactionId === undefined) continue
      if (compactionId !== undefined ? e.data.source.compactionId === compactionId : (Array.isArray(e.sourceEventSeqs) && e.sourceEventSeqs.includes(lo))) return e
    }
    return undefined
  }
  /** 补记：把一行「问题 → 期望答案」（qa 模式）或整份材料（material 模式）追加进检查点并原地 replace；返回新事件 seq，找不到/失败返回 undefined。 */
  const patchCheckpoint = (session, compactionId, lo, { question, expected, material }) => {
    const cp = findCheckpoint(session, compactionId, lo)
    if (!cp) return undefined
    const blocks = Array.isArray(cp.data?.content) ? cp.data.content : []
    const oldText = blocks.filter(b => b?.type === 'text').map(b => b.text ?? '').join('\n')
    let text
    if (patchMode === 'material') {
      if (hasPatchHead(oldText)) return undefined  // 已补过（新旧头双认）
      text = `${oldText}\n\n${PATCH_HEAD}\n${patchChars > 0 ? String(material).slice(0, patchChars) : String(material)}`
    } else {
      const line = `- ${question} → ${expected}`
      if (oldText.includes(line)) return undefined  // 同一事实已补过
      // 已有补记头（新旧任一）就接着追加一行，否则起英文新头
      text = hasPatchHead(oldText) ? `${oldText}\n${line}` : `${oldText}\n\n${PATCH_HEAD}\n${line}`
    }
    const msg = { ...cp.data, id: `${cp.data?.id ?? 'cp'}-probe-${Date.now().toString(36)}`, content: [{ type: 'text', text }] }
    const ev = session.append('user/message', msg, { surfaceOp: { op: 'replace', start: cp.seq, end: cp.seq }, sourceEventSeqs: [cp.seq] })
    return ev.seq
  }

  /** 出题材料：优先记忆中枢的预压缩稿（手术备料）；缺席回退被压区间原文渲染（事件仍在日志里，只是被遮蔽）。 */
  const materialFor = (session, lo, hi) => {
    let digest
    try { digest = ctx.bail('trisoul/memory-digest', { sessionId: session.id, start: lo, end: hi }) } catch { digest = undefined }
    if (typeof digest === 'string' && digest.trim()) return { source: 'memory-digest', text: sourceChars > 0 ? digest.slice(0, sourceChars) : digest }
    const events = session.events
    const parts = []
    let total = 0
    for (const e of events) {
      if (e.seq < lo || e.seq > hi) continue
      const r = renderEventText(e, { skipPluginUser: true })
      if (!r) continue
      if (sourceChars > 0 && total + r.text.length > sourceChars) break
      total += r.text.length
      parts.push(`[seq ${r.seq} ${r.role}] ${r.text}`)
    }
    return parts.length ? { source: 'raw', text: parts.join('\n') } : undefined
  }

  /**
   * 跑一次探针验收。永不 throw（失败仅告警 + 上报），返回上报的 info（供测试/调用方观察）。
   * @param {{session:object, start:number, end:number, checkpointText:string, signal?:AbortSignal}} args
   */
  async function runProbe({ session, start, end, checkpointText, signal, compactionId }) {
    if (!enabled) return undefined
    const lo = Math.min(start, end)
    const hi = Math.max(start, end)
    const seqRange = { start: lo, end: hi }
    const sessionId = session.id
    const t0 = Date.now()
    const fail = (error, extra = {}) => {
      const info = { phase: 'probe', ok: false, sessionId, seqRange, error, durationMs: Date.now() - t0, ...extra }
      report(info)
      warn(`探针验收失败 seq ${lo}..${hi}: ${error}`)
      return info
    }
    try {
      if (typeof checkpointText !== 'string' || !checkpointText.trim()) return fail('no-checkpoint')
      const material = materialFor(session, lo, hi)
      if (!material) return fail('no-material')
      dbg(`探针出题: seq ${lo}..${hi} 材料=${material.source}(${material.text.length}字)`)
      // ① 出题
      const ask = await runJob({
        purpose: 'trisoul-canvas-probe-ask', system: ASK_SYSTEM,
        prompt: `Material (${material.source === 'memory-digest' ? 'pre-condensed draft' : 'verbatim excerpt'} of the condensed span seq ${lo}..${hi}):\n${material.text}\n\n${ASK_FORMAT}`,
        maxTokens, signal, sessionId,
      })
      const q = parseJson(ask.text)
      const question = typeof q?.question === 'string' ? q.question.trim() : ''
      const expected = typeof q?.expected === 'string' ? q.expected.trim() : ''
      if (!question || !expected) return fail('bad-question')
      // ② 作答：只看手术后的检查点文本
      const ans = await runJob({
        purpose: 'trisoul-canvas-probe-answer', system: ANSWER_SYSTEM,
        prompt: `Text:\n${checkpointText}\n\nQuestion: ${question}\n\nOutput JSON (JSON only): {"answer":"the answer, or UNKNOWN"}`,
        maxTokens, signal, sessionId,
      })
      const parsedAns = parseJson(ans.text)
      const got = (typeof parsedAns?.answer === 'string' ? parsedAns.answer : ans.text).trim()
      // ③ 判分
      const ok = judgeProbe(expected, got)
      const info = { phase: 'probe', ok, sessionId, question, expected, got, seqRange,
        source: material.source, durationMs: Date.now() - t0 }
      if (!ok) {
        // 补记（#8）：检查点答不出材料里的事实——ride 攒着随下一刀写入；qa/material 立即改写检查点（旧行为）
        if (patchMode === 'ride') {
          const line = `${question} → ${expected}`
          const cur = pending.get(sessionId) ?? []
          if (!cur.includes(line)) pending.set(sessionId, [...cur, line])
          info.patched = 'pending'
        } else {
          try {
            const seq = patchCheckpoint(session, compactionId, lo, { question, expected, material: material.text })
            if (seq !== undefined) { info.patched = true; info.patchedSeq = seq }
            else info.patched = false
          } catch (e) { info.patched = false; info.patchError = String(e).slice(0, 200) }
        }
      }
      report(info)
      if (ok) dbg(`探针通过: 「${question}」→「${got}」`)
      else warn(`探针验收未过 seq ${lo}..${hi}：问「${question}」期望「${expected}」实得「${got}」（${info.patched === 'pending' ? '问答已入补记队列，随下一刀写进检查点' : info.patched ? (patchMode === 'material' ? '已把材料补记进检查点' : '已把该问答补记进检查点') : '补记未成'}，不回滚）`)
      return info
    } catch (e) {
      return fail(String(e).slice(0, 300))
    }
  }

  return { enabled, runProbe, peekNotes, consumeNotes }
}
