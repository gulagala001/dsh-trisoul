// 推理档位能力门控：记忆中枢的作业调用默认请求 reasoningEffort:'off'（0 思考，省钱提速），
// 但只有该 provider/model 声明支持 'off'（reasoning.efforts 含 {id:'off'}）才传；否则传 undefined（提供商默认）——
// dsh-llm 对未声明的档位会在发请求前抛 UNSUPPORTED_REASONING_EFFORT。
// 能力查询：优先 ctx.llm.resolveModelInfo(provider, model)（rc.6 有，带 reasoning 元数据）；退化到 listModels 条目上的 reasoning。
// 结果缓存到 provider/model 键；'llm/adapters-updated'（provider 增删/热更）时整表失效。

/**
 * @param ctx cordis 上下文（需要 ctx.llm，可选 ctx.on 订阅失效事件）
 * @param opts.effort 'off' | 'inherit' | 其它档位 id；'inherit' = 不传档位；默认 'off'
 */
export function createEffortResolver(ctx, { effort = 'off' } = {}) {
  /** `${provider}/${model}` -> Promise<Set<string>> 支持的档位 id 集合（空集 = 无推理元数据 / 查询失败） */
  const cache = new Map()
  const invalidate = () => cache.clear()
  try { ctx.on?.('llm/adapters-updated', invalidate, { global: true }) } catch {}

  const lookup = async (provider, model) => {
    const llm = ctx.llm
    if (llm && typeof llm.resolveModelInfo === 'function') {
      try {
        const info = await llm.resolveModelInfo(provider, model)
        const efforts = info?.reasoning?.efforts
        if (Array.isArray(efforts)) return new Set(efforts.map(e => e?.id).filter(Boolean))
        return new Set()
      } catch { /* 退化到 listModels */ }
    }
    if (llm && typeof llm.listModels === 'function') {
      try {
        const models = await llm.listModels(provider)
        const m = Array.isArray(models) ? models.find(x => x?.id === model) : undefined
        const efforts = m?.reasoning?.efforts
        if (Array.isArray(efforts)) return new Set(efforts.map(e => e?.id).filter(Boolean))
      } catch { /* 无能力信息 */ }
    }
    return new Set()
  }

  /** 该路由声明支持的档位集合（带缓存）。 */
  const supported = (provider, model) => {
    const key = `${provider}/${model}`
    let p = cache.get(key)
    if (!p) { p = lookup(provider, model); cache.set(key, p) }
    return p
  }

  /** 解析实际要传的 reasoningEffort：'inherit' → undefined；其它 → 声明支持才传，否则 undefined。 */
  const resolve = async (provider, model) => {
    if (!effort || effort === 'inherit') return undefined
    const set = await supported(provider, model)
    return set.has(effort) ? effort : undefined
  }

  return { effort, resolve, supported, invalidate }
}
