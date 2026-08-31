// 纯 Node、跨平台，改写自主仓 scripts/patch-dsh-bridge.sh 与 patch-dsh-deepseek.sh。
// 两个补丁做同一件事：把调用方的 onPayload 钩子放行到发请求的最后一步——
// TriSoul 的 JSON 格式锁（json_schema / json_object）全靠它在发请求前改写 payload。
// 修法约定：只放行钩子、零新字段，body 改写权在插件侧（少一处升级即失效的地方）。
// 补丁不在位 ≠ 不能用：插件挂不上锁会退回提示词软约束，不炸，只是格式约束变软。
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const BRIDGE_MARK = 'TRISOUL-PATCH: forward onPayload to pi-ai'
const DEEPSEEK_MARK = 'TRISOUL-PATCH: forward onPayload into deepseek-official request body'

/**
 * @deepseek-ai/dsh-llm-pi-ai（桥）：streamSimple 的调用参数是显式白名单
 * （profileOptions + temperature/maxTokens/sessionId/signal/headers），自定义字段一律落地。
 * pi-ai 本身原生就有 onPayload 钩子（buildBaseOptions 白名单里有，openai-responses 的
 * stream() 发请求前会调它改写整个 payload）——桥放行这一个函数，插件就能自己挂
 * text.format 的 json_schema 硬锁 / response_format.json_schema。
 */
export async function patchDshBridge(hostRoot, { check = false } = {}) {
  return applyAll(hostRoot, 'dsh-llm-pi-ai', BRIDGE_MARK, check, (s, mark) => {
    const anchor = '\t\t\t\t\t...options.sessionId === void 0 ? {} : { sessionId: String(options.sessionId) },\n'
      + '\t\t\t\t\tsignal: watchdog.signal,'
    if (s.split(anchor).length !== 2) return { reason: '锚点不匹配或不唯一，拒绝改写' }
    const patch = '\t\t\t\t\t...options.sessionId === void 0 ? {} : { sessionId: String(options.sessionId) },\n'
      + `\t\t\t\t\t// ${mark}\n`
      + '\t\t\t\t\t// pi-ai 原生钩子（buildBaseOptions 白名单里就有 onPayload，openai-responses stream() 在发请求前调它改写 payload）。\n'
      + '\t\t\t\t\t// 桥这份参数是显式白名单，不放行的话调用方永远递不进来 —— TriSoul 靠它给盲写请求挂 json_schema 硬锁。\n'
      + '\t\t\t\t\t...typeof options.onPayload !== "function" ? {} : { onPayload: options.onPayload },\n'
      + '\t\t\t\t\tsignal: watchdog.signal,'
    return { out: s.replace(anchor, patch) }
  })
}

/**
 * @deepseek-ai/dsh-llm-deepseek（内建官方适配器）：不走 pi-ai 桥（自己 fetch /chat/completions），
 * serializeRequest 白名单里没有任何自定义字段可传。放行 onPayload 后，TriSoul 靠它挂
 * response_format:{type:'json_object'}（DeepSeek 官方 JSON Output，实测为语法级真锁）。
 */
export async function patchDshDeepseek(hostRoot, { check = false } = {}) {
  return applyAll(hostRoot, 'dsh-llm-deepseek', DEEPSEEK_MARK, check, (s, mark) => {
    const anchor = '\t\tconst payload = JSON.stringify(body);'
    if (s.split(anchor).length !== 2) return { reason: '锚点不匹配或不唯一，拒绝改写' }
    const patch = `\t\t// ${mark}\n`
      + "\t\t// 与 pi-ai onPayload 同约定：发请求前给调用方一次改写 body 的机会——TriSoul 靠它挂 response_format:{type:'json_object'}（官方 JSON Output 语法锁）。\n"
      + '\t\tconst payload = JSON.stringify(typeof options.onPayload === "function" ? await options.onPayload(body, options.model) ?? body : body);'
    return { out: s.replace(anchor, patch) }
  })
}

/** init / doctor 共用的组合出口：两个 onPayload 补丁一起跑，带展示用 label。 */
export async function patchOnPayloadAll(hostRoot, opts = {}) {
  return [
    ['桥 onPayload（json_schema 格式锁）', await patchDshBridge(hostRoot, opts)],
    ['deepseek 适配器 onPayload（json_object 格式锁）', await patchDshDeepseek(hostRoot, opts)],
  ]
}

/** 通用套路：找包（pnpm 虚拟库 + 扁平两种布局）→ 幂等检查 → 备份 .orig → 改写 → 校验失败回滚。 */
async function applyAll(hostRoot, shortName, mark, check, transform) {
  const targets = findPackages(path.join(hostRoot, 'node_modules'), shortName)
  if (targets.length === 0) return { patched: [], skipped: [], missing: true }

  const patched = []
  const skipped = []
  for (const pkgDir of targets) {
    const f = path.join(pkgDir, 'lib', 'index.js')
    const rel = path.relative(hostRoot, f)
    const ver = readPkgVersion(pkgDir)
    try {
      if (!fs.existsSync(f)) { skipped.push(`${rel}（${ver}：没有 lib/index.js，包结构变了）`); continue }
      const original = fs.readFileSync(f, 'utf8')
      if (original.includes(mark)) { skipped.push(`${rel}（${ver}：已打补丁 ✓）`); continue }
      if (check) { skipped.push(`${rel}（${ver}：未打补丁 ✗）`); continue }

      const r = transform(original, mark)
      if (!r.out) { skipped.push(`${rel}（${ver}：${r.reason}）`); continue }

      const origPath = `${f}.orig`
      if (!fs.existsSync(origPath)) fs.copyFileSync(f, origPath)
      fs.writeFileSync(f, r.out)
      if (await validateFile(f)) {
        patched.push(`${rel}（${ver}：已打补丁 ✓，备份 ${path.basename(f)}.orig）`)
      } else {
        fs.copyFileSync(origPath, f)
        skipped.push(`${rel}（${ver}：打完语法/加载校验失败，已回滚）`)
      }
    } catch (err) {
      skipped.push(`${rel}（${ver}：出错——${err && err.message ? err.message : String(err)}）`)
    }
  }
  return { patched, skipped, missing: false }
}

/** 在 hostRoot/node_modules 下找 @deepseek-ai/<shortName>，兼容 pnpm 虚拟库与扁平两种布局。 */
function findPackages(nodeModulesDir, shortName) {
  const found = new Set()
  const pnpmDir = path.join(nodeModulesDir, '.pnpm')
  let entries = []
  try { entries = fs.readdirSync(pnpmDir) } catch { entries = [] }
  for (const name of entries) {
    if (!name.startsWith(`@deepseek-ai+${shortName}@`)) continue
    const candidate = path.join(pnpmDir, name, 'node_modules', '@deepseek-ai', shortName)
    if (fs.existsSync(candidate)) found.add(candidate)
  }
  const flat = path.join(nodeModulesDir, '@deepseek-ai', shortName)
  if (fs.existsSync(flat)) found.add(flat)
  return [...found]
}

function readPkgVersion(pkgDir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8')).version || '?'
  } catch { return '?' }
}

/**
 * 校验打完补丁的文件：先 node --check（快；按就近 package.json 的 type 解析），
 * 不过再尝试动态 import 兜底（带 cache-busting，避免同进程重复校验命中缓存）。
 * 与主仓两个 bash 脚本的「--check || import」两步一致。
 */
async function validateFile(f) {
  const chk = spawnSync(process.execPath, ['--check', f], { stdio: 'ignore' })
  if (chk.status === 0) return true
  try {
    await import(`${pathToFileURL(f).href}?t=${Date.now()}-${Math.random().toString(36).slice(2)}`)
    return true
  } catch { return false }
}
