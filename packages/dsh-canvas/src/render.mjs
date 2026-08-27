// 会话事件 → 画布小作业（状态区提炼 / 探针备料回退）用的净化文本。
// 与记忆中枢 events.mjs 同纪律（独立拷贝，画布保持零 dsh 包依赖）：
// - assistant 取 text、tool-call 与**蒸馏块**，丢其余 reasoning（共识旁白与模型 raw 思考不能进提炼输入）
// - C5（2026-08-25）：蒸馏块（trisoul==='distilled'）是 findings/plan 的唯一载体，整块丢会让这一步想定的
//   方案活不过一次提炼；只取 block.text，旁白全文躺在 note 暗字段上照旧不取
// - user 跳过 source.kind==='plugin'（记忆注入/状态区注入/检查点不是对话事实，防自反馈）
// - 默认全文不截（2026-08-18 用户令：不要任何截断/预算类限制）；maxChars/toolCallArgs 只在调用方显式给正数时才裁

export const SURFACE_TEXT_TYPES = Object.freeze(['user/message', 'assistant/message', 'tool/result'])
/** 蒸馏思考块的标记值（与 dsh-plugin 的 DISTILLED_TAG 同源；画布零依赖，此处独立拷贝） */
const DISTILLED_TAG = 'distilled'

const clip = (s, n) => {
  const t = String(s ?? '')
  return (n > 0 && t.length > n) ? `${t.slice(0, n)}…(truncated ${t.length - n} chars)` : t
}

/** content 块数组 → 文本；只认 text / tool-call / tool-result（递归取 text）。 */
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

/** assistant/message 的 data.message 或（假消息）直接含 content 的 data。 */
const messageOf = (data) => (data && typeof data === 'object' && data.message && typeof data.message === 'object') ? data.message : data

/**
 * 单事件 → {seq, role, text} 或 undefined（不该进小作业输入的事件）。
 * @param opts.maxChars 单事件文本上限（0/缺省 = 不裁）
 * @param opts.skipPluginUser 跳过 plugin 注入的 user/message（默认 true）
 */
export function renderEventText(event, { maxChars = 0, skipPluginUser = true } = {}) {
  if (!event || !SURFACE_TEXT_TYPES.includes(event.type)) return undefined
  const data = event.data
  if (event.type === 'user/message') {
    const kind = data?.source?.kind
    if (skipPluginUser && kind === 'plugin') return undefined
    const text = renderBlocks(data?.content)
    if (!text.trim()) return undefined
    return { seq: event.seq, role: kind && kind !== 'user' ? `user:${kind}` : 'user', text: clip(text, maxChars) }
  }
  if (event.type === 'assistant/message') {
    const text = renderBlocks(messageOf(data)?.content)
    if (!text.trim()) return undefined
    return { seq: event.seq, role: 'assistant', text: clip(text, maxChars) }
  }
  // tool/result
  const text = renderBlocks(messageOf(data)?.content)
  if (!text.trim()) return undefined
  return { seq: event.seq, role: 'tool', text: clip(text, maxChars) }
}

/** 一批渲染结果 → prompt 里的事件段。 */
export function formatRendered(rendered) {
  return rendered.map(r => `[seq ${r.seq} ${r.role}] ${r.text}`).join('\n')
}

/**
 * 事件的「真实内容」文本（P1-6，2026-08-19）：真正会进 prompt 的那部分——
 * user/message 的 text 块（含插件注入 / 检查点 / 状态区：它们同样占 prompt）、assistant 的 text + tool-call 参数
 * + 蒸馏块正文（C5 后它常驻历史、确实占 prompt）、tool 结果文本；
 * 不含模型 raw reasoning（P0 后历史思考不再回灌）与旁白、不含 JSON 包装与元数据（旧 size=JSON.stringify(data).length 把 reasoning 与
 * 包装一起算进去，区间「够大」实际上没多少真实内容，刀刀落在小段上）。未知类型退回 JSON 原样。
 */
export function contentTextOf(event) {
  const data = event?.data
  if (!event || !SURFACE_TEXT_TYPES.includes(event.type)) return JSON.stringify(data ?? {})
  if (event.type === 'user/message') return renderBlocks(data?.content)
  return renderBlocks(messageOf(data)?.content)
}
