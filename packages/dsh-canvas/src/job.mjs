// 画布小作业公共壳：状态区提炼 / 探针出题·作答共用一个 LLM 调用入口。
// - 档位：默认请求 reasoningEffort 'off'（0 思考省钱提速），经能力门控——只有该路由声明 off 档才传，
//   否则不传用提供商默认（dsh-llm 对未声明档位会抛 UNSUPPORTED_REASONING_EFFORT）。
//   门控实现直接复用 dsh-plugin 的 smallJobEffort（同仓库兄弟包相对引用，dsh-surgeon 已用同法）。
// - 路由：ctx.bail('trisoul/ai-config','canvas') 实时配置优先（dsh-api 已登记 canvas：统一模式跟随 unified，细分模式可单配），
//   缺席退回静态 config.provider/model，再退默认 ark/deepseek-v4-flash（与手术刀一致）。
// - 超时：沿用小作业超时口径（默认 120s，同共识 soulTimeoutMs）；定时器 + 上游 signal 合并 abort，
//   并对 iterator.next() 做 race——适配器无视 signal（Ark 挂起流）也能按时抛 TIMEOUT。
import { smallJobEffort } from '../../dsh-plugin/src/effort.mjs'

export class JobTimeoutError extends Error {
  constructor(ms) {
    super(`小作业超时（${ms}ms）`)
    this.code = 'TIMEOUT'
    this.timeoutMs = ms
  }
}

/** 宽松取 JSON：平衡扫描顶层 {...} 段、取最后一个能解析的（指令都是「JSON 收尾」，模型的 JSON 在末尾；
 *  旧版贪婪正则从第一个 { 吞到最后一个 }，正文里任何带花括号的说明文字都会把整批判废）。 */
export const parseJson = (text) => {
  const s = String(text ?? '')
  let best, depth = 0, start = -1, inStr = false, esc = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"' && depth > 0) inStr = true
    else if (ch === '{') { if (depth === 0) start = i; depth++ }
    else if (ch === '}' && depth > 0 && --depth === 0 && start >= 0) {
      try { best = JSON.parse(s.slice(start, i + 1)) } catch {}
    }
  }
  return best
}

export function createJobRunner(ctx, config = {}) {
  const timeoutMs = config.jobTimeoutMs ?? 120_000
  const wantOff = (config.effort ?? 'off') === 'off'

  const route = (role = 'canvas') => {
    let live
    try { live = ctx.bail('trisoul/ai-config', role) } catch { live = undefined }
    return {
      provider: live?.provider || config.provider || 'ark',
      model: live?.model || config.model || 'deepseek-v4-flash',
    }
  }

  /** 跑一次小作业；返回 { text, truncated }。error/aborted finish 与超时统一转 rejection。maxTokens 缺省不传（提供方/适配器默认，不设上限）。 */
  async function run({ role, purpose, system, prompt, maxTokens, signal, sessionId }) {
    const { provider, model } = route(role)
    const reasoningEffort = wantOff ? await smallJobEffort(ctx, provider, model) : undefined
    const ac = new AbortController()
    const relay = () => ac.abort(signal?.reason)
    if (signal?.aborted) relay()
    else signal?.addEventListener('abort', relay, { once: true })
    let timeoutErr
    const timer = timeoutMs > 0
      ? setTimeout(() => { timeoutErr = new JobTimeoutError(timeoutMs); ac.abort(timeoutErr) }, timeoutMs)
      : undefined
    timer?.unref()
    // 中止哨兵：与每次 next() 赛跑；流挂起不结束也能退出
    const aborted = new Promise((_, reject) => {
      const fire = () => reject(timeoutErr ?? new Error(`trisoul-canvas job aborted: ${String(ac.signal.reason?.message ?? ac.signal.reason ?? 'upstream abort')}`))
      if (ac.signal.aborted) fire()
      else ac.signal.addEventListener('abort', fire, { once: true })
    })
    aborted.catch(() => {})
    let text = ''
    let truncated = false
    let finished = false
    const src = ctx.llm.stream({
      provider, model, purpose,
      ...(maxTokens > 0 ? { maxTokens } : {}),
      ...(reasoningEffort !== undefined ? { reasoningEffort } : {}),
      ...(sessionId ? { sessionId } : {}), // 监控按会话归因（dsh-api llm/stream 采集）
      system,
      messages: [Object.freeze({
        id: `${purpose}-${Date.now().toString(36)}`,
        role: 'user',
        content: Object.freeze([Object.freeze({ type: 'text', text: prompt })]),
        source: Object.freeze({ kind: 'plugin', plugin: 'trisoul-canvas' }),
      })],
      signal: ac.signal,
    })
    const it = (src[Symbol.asyncIterator] ?? src[Symbol.iterator]).call(src)
    try {
      for (;;) {
        const r = await Promise.race([it.next(), aborted])
        if (r.done) break
        const c = r.value
        if (c.type === 'text-delta') text += c.text ?? ''
        else if (c.type === 'finish') {
          const kind = c.reason?.kind
          if (kind === 'error' || kind === 'aborted') {
            if (timeoutErr) throw timeoutErr // 适配器尊重 signal 以 aborted 收尾：仍按超时归因
            throw new Error(`${purpose} LLM ${kind}: ${c.reason?.failure?.code ?? ''} ${c.reason?.failure?.message ?? ''}`)
          }
          if (kind === 'max-tokens') truncated = true
        }
      }
      finished = true
    } finally {
      if (timer) clearTimeout(timer)
      signal?.removeEventListener('abort', relay)
      // 提前退出时通知源流收尾；不等待——挂起流的 return() 可能永不回来
      if (!finished) { try { it.return?.()?.catch?.(() => {}) } catch {} }
    }
    return { text, truncated }
  }

  return { run, route, timeoutMs }
}
