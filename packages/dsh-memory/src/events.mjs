// 会话事件 → 消化/回捞用的净化文本。
// 真实结构（rc.6 持久化日志实测）：
//   user/message      event.data = UserMessage {content:[{type:'text',text}], source:{kind}, role, id}
//   assistant/message event.data = {turn, step, message:{content:[{type:'reasoning'|'text'|'tool-call',...}], source}, usage?}
//   tool/result       event.data = {turn, step, message:{content:[{type:'tool-result', toolCallId, content:[{type:'text',text}], isError}]}}
// 纪律：assistant 取 text、tool-call 与**蒸馏块**，丢其余 reasoning（共识旁白 [TriSoul] 与模型自己的
//       raw 思考都写在 reasoning 里，绝不能进记忆）；user 跳过 source.kind==='plugin'（注入/检查点不是对话事实）。
// C5（2026-08-25）：蒸馏块（trisoul==='distilled'）是 findings/plan 的唯一载体——整块丢会让「这一步想定的
//       方案」活不过第一次消化（蒸馏块寿命≈10 步）。只取 block.text；旁白全文躺在 note 暗字段上，照旧不取。
// 2026-08-18 用户令「不要任何截断和预算类限制」：默认全文，maxChars/toolCallArgs 只在调用方显式给正数时才裁。

export const DIGESTIBLE_TYPES = Object.freeze(['user/message', 'assistant/message', 'tool/result'])
/** 蒸馏思考块的标记值（与 dsh-plugin 的 DISTILLED_TAG 同源；中枢保持零 dsh-plugin 依赖，此处独立拷贝） */
const DISTILLED_TAG = 'distilled'

const clip = (s, n) => {
  const t = String(s ?? '')
  return (n > 0 && t.length > n) ? `${t.slice(0, n)}…(truncated ${t.length - n} chars)` : t
}

/** 把 content 块数组渲染成文本；只认 text / tool-call / tool-result（递归取 text）。 */
export function renderBlocks(blocks, { toolCallArgs = 0 } = {}) {
  if (!Array.isArray(blocks)) return ''
  const parts = []
  for (const b of blocks) {
    if (!b || typeof b !== 'object') continue
    if (b.type === 'text' && typeof b.text === 'string') parts.push(b.text)
    // C5：蒸馏块放行（只取 text——note/raw 暗字段照旧丢）；其余 reasoning 一律丢
    else if (b.type === 'reasoning' && b.trisoul === DISTILLED_TAG && typeof b.text === 'string') parts.push(b.text)
    else if (b.type === 'tool-call') parts.push(`<tool-call ${b.name ?? '?'} ${clip(b.arguments ?? '', toolCallArgs)}>`)
    else if (b.type === 'tool-result') {
      const inner = renderBlocks(b.content, { toolCallArgs })
      parts.push(`${b.isError ? '<tool-error>' : ''}${inner}`)
    }
    // 非蒸馏 reasoning（模型 raw 思考 / 共识旁白）、image、未知块：丢弃
  }
  return parts.join('\n')
}

/** 假消息（assistant/message 里 message 字段或直接含 content）取 content。 */
const messageOf = (data) => (data && typeof data === 'object' && data.message && typeof data.message === 'object') ? data.message : data

/**
 * 单事件 → {seq, type, role, text} 或 undefined（不该进消化的事件）。
 * @param opts.maxChars 单事件文本上限（0/缺省 = 不裁）
 * @param opts.skipPluginUser 跳过 plugin 注入的 user/message（消化=true；回捞=true 也合理，注入不是原文）
 */
export function renderEvent(event, { maxChars = 0, skipPluginUser = true } = {}) {
  if (!event || !DIGESTIBLE_TYPES.includes(event.type)) return undefined
  const data = event.data
  if (event.type === 'user/message') {
    const kind = data?.source?.kind
    if (skipPluginUser && kind === 'plugin') return undefined
    const text = renderBlocks(data?.content)
    if (!text.trim()) return undefined
    return { seq: event.seq, type: event.type, role: kind && kind !== 'user' ? `user:${kind}` : 'user', text: clip(text, maxChars) }
  }
  if (event.type === 'assistant/message') {
    const msg = messageOf(data)
    const text = renderBlocks(msg?.content)
    if (!text.trim()) return undefined
    return { seq: event.seq, type: event.type, role: 'assistant', text: clip(text, maxChars) }
  }
  // tool/result
  const msg = messageOf(data)
  const text = renderBlocks(msg?.content)
  if (!text.trim()) return undefined
  return { seq: event.seq, type: event.type, role: 'tool', text: clip(text, maxChars) }
}

/** 一批渲染结果 → 消化 prompt 里的事件段。 */
export function formatEvents(rendered) {
  return rendered.map(r => `[seq ${r.seq} ${r.role}] ${r.text}`).join('\n')
}
