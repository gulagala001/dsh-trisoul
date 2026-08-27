// TriSoul 小作业档位门控：表决/融合/手术刀这类辅助调用默认请求 reasoningEffort 'off'
// （0 思考，省钱提速），但必须能力门控——dsh-llm 对不支持的显式档位会在派发前抛
// UNSUPPORTED_REASONING_EFFORT。
//
// 能力事实来源：`ctx.llm.resolveModelInfo(provider, model)` 的 `reasoning?.efforts`
// （rc.6 的 `listModels()` 会把目录条目裁剪成 id/name/description/modalities，
// reasoning 元数据只在 exact-route 的 resolveModelInfo 上暴露）。
// pi-ai 侧只有 profile 里显式声明了 off 档（reasoningEfforts.off）的模型才会报告 {id:'off'}；
// 无 reasoning 元数据的模型这里返回 undefined = 沿用提供商默认。
//
// 缓存：按 llm 服务实例（WeakMap）× `${provider}\0${model}` 缓存查询 Promise；
// 'llm/adapters-updated'（适配器/路由拓扑变化，settings.yaml 热更新会触发重注册）时整体失效。
// 查询失败（NO_ADAPTER、适配器异常）≠「不支持」（2026-08-27 真机表决慢真因）：旧版 fail-open 到
// undefined 会继承提供商默认档（ark 是 high，表决静默烧重思考），且失败结果进缓存会把一次启动竞态
// 钉死整个进程、零日志不可诊。改为按配置意图乐观传 'off'（路由真不支持由派发时
// UNSUPPORTED_REASONING_EFFORT 显式暴露，魂级重试/弃权兜底）+ 失败不缓存下次重查 + warn 落日志。

const CACHES = new WeakMap()

function cacheFor(ctx) {
  const runtime = ctx.llm ?? ctx
  let cache = CACHES.get(runtime)
  if (!cache) {
    cache = new Map()
    CACHES.set(runtime, cache)
    // 假 ctx / 精简 ctx 可能没有该事件位：注册失败只是失去失效时机，不影响功能
    try { ctx.on?.('llm/adapters-updated', () => cache.clear()) } catch {}
  }
  return cache
}

/**
 * 小作业（vote/merge/surgeon）该用的 reasoningEffort：
 * 查询成功且路由声明了 off 档 → 'off'；查询成功但未声明 → undefined（提供商默认）；
 * 查询失败 → 'off'（乐观按配置意图派发，不缓存，下次重查）。
 * @returns {Promise<'off'|undefined>}
 */
export function smallJobEffort(ctx, provider, model) {
  const cache = cacheFor(ctx)
  const key = `${provider}\u0000${model}`
  let hit = cache.get(key)
  if (hit === undefined) {
    hit = (async () => {
      try {
        const info = await ctx.llm.resolveModelInfo(provider, model)
        return info?.reasoning?.efforts?.some(e => e?.id === 'off') ? 'off' : undefined
      } catch (e) {
        ctx.logger?.warn(`trisoul: resolveModelInfo(${provider}, ${model}) 失败，小作业按 'off' 乐观派发且不缓存: ${String(e?.message ?? e)}`)
        cache.delete(key)
        return 'off'
      }
    })()
    cache.set(key, hit)
  }
  return hit
}
