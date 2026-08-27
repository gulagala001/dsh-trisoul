// 纯 Node、跨平台版本，改写自 trisoul/scripts/patch-pi-ai.sh。
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const MARK = 'TRISOUL-PATCH: streaming tool-call args O(n^2) guard'

/**
 * 给 dsh 上游依赖 @earendil-works/pi-ai 打补丁：修流式 tool-call 参数的 O(n²) 重解析 bug。
 * 病象：各 adapter 每收到一个 tool-call 参数 delta，就对累计的全部参数重跑一遍
 * parseStreamingJson（JSON.parse → repairJson → partial-json，逐字符扫描），单次 O(n)、
 * delta 数 ∝ n ⇒ 总计 O(n²)；大参数时把事件循环独占到整个进程 100% CPU 假死（真机复现过两次）。
 * 修法：给 parseStreamingJson 加一道 O(1) 的「末尾是否已闭合」启发式——未闭合（还在流式中途）
 * 直接返回 {} 跳过全量扫描，闭合了（或参数不大）才照旧完整解析；toolcall_end 时还会再解析一次
 * 完整参数，最终值不受影响。阈值 PI_AI_STREAM_PARSE_LIMIT（字节，默认 32768）。
 * 上游最新版仍未修，所以每次都要重新打（npx/pnpm 重装会覆盖该包）。幂等：已打过跳过。
 */
export async function patchPiAi(hostRoot, { check = false } = {}) {
  const nodeModulesDir = path.join(hostRoot, 'node_modules')
  const targets = findPiAiPackages(nodeModulesDir)

  if (targets.length === 0) {
    return { patched: [], skipped: [], missing: true }
  }

  const patched = []
  const skipped = []

  for (const pkgDir of targets) {
    const f = path.join(pkgDir, 'dist', 'utils', 'json-parse.js')
    const rel = path.relative(hostRoot, f)
    const ver = readPkgVersion(pkgDir)

    try {
      if (!fs.existsSync(f)) {
        skipped.push(`${rel}（${ver}：没有 dist/utils/json-parse.js，包结构变了）`)
        continue
      }

      const original = fs.readFileSync(f, 'utf8')
      if (original.includes(MARK)) {
        skipped.push(`${rel}（${ver}：已打补丁 ✓）`)
        continue
      }

      if (check) {
        skipped.push(`${rel}（${ver}：未打补丁 ✗）`)
        continue
      }

      const origPath = `${f}.orig`
      if (!fs.existsSync(origPath)) {
        fs.copyFileSync(f, origPath)
      }

      // ↓↓↓ 以下替换逻辑照搬 trisoul/scripts/patch-pi-ai.sh 内嵌的 node heredoc，一字未改 ↓↓↓
      let s = original
      const anchor = `export function parseStreamingJson(partialJson) {
    if (!partialJson || partialJson.trim() === "") {
        return {};
    }`
      if (!s.includes(anchor)) {
        skipped.push(`${rel}（${ver}：锚点不匹配，拒绝改写）`)
        continue
      }
      const patch = `const TRISOUL_STREAM_PARSE_LIMIT = (() => {
    const raw = Number(process.env.PI_AI_STREAM_PARSE_LIMIT);
    return Number.isFinite(raw) && raw > 0 ? raw : 32768;
})();
/** 末尾（最多回看 64 字符）第一个非空白字符；全是空白则返回 ""。 */
function trisoulLastMeaningfulChar(s) {
    const stop = Math.max(0, s.length - 64);
    for (let i = s.length - 1; i >= stop; i--) {
        const c = s[i];
        if (c !== " " && c !== "\\n" && c !== "\\r" && c !== "\\t") return c;
    }
    return "";
}
export function parseStreamingJson(partialJson) {
    if (!partialJson) {
        return {};
    }
    // ${MARK}
    // 大参数（默认 >32KB，PI_AI_STREAM_PARSE_LIMIT 可调）：流式途中每个 delta 都全量重解析是 O(n²)，
    // 会把事件循环独占到整个进程假死。用 O(1) 的「末尾是否闭合」挡住：没闭合 = 还在流中 → 直接返回 {}；
    // 闭合了（或参数不大）→ 照旧完整解析。toolcall_end 时参数完整，最终值不受影响。
    if (partialJson.length > TRISOUL_STREAM_PARSE_LIMIT) {
        const last = trisoulLastMeaningfulChar(partialJson);
        if (last !== "}" && last !== "]") {
            return {};
        }
    }
    else if (partialJson.trim() === "") {
        return {};
    }`
      s = s.replace(anchor, patch)
      // ↑↑↑ 替换逻辑结束 ↑↑↑

      fs.writeFileSync(f, s)

      const valid = await validateModule(f)
      if (valid) {
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

/** 在 hostRoot/node_modules 下查找 @earendil-works/pi-ai 包，支持 pnpm 虚拟库与扁平两种布局。 */
function findPiAiPackages(nodeModulesDir) {
  const found = new Set()

  // 布局一：pnpm 虚拟库 .pnpm/@earendil-works+pi-ai@<版本(+peer哈希)>/node_modules/@earendil-works/pi-ai
  // 版本号（及可能附带的 peer 依赖哈希后缀）不定，遍历 .pnpm/ 匹配前缀，可能命中多个版本，全部打上。
  const pnpmDir = path.join(nodeModulesDir, '.pnpm')
  let pnpmEntries = []
  try {
    pnpmEntries = fs.readdirSync(pnpmDir)
  } catch {
    pnpmEntries = []
  }
  for (const name of pnpmEntries) {
    if (!name.startsWith('@earendil-works+pi-ai@')) continue
    const candidate = path.join(pnpmDir, name, 'node_modules', '@earendil-works', 'pi-ai')
    if (fs.existsSync(candidate)) found.add(candidate)
  }

  // 布局二：扁平安装 node_modules/@earendil-works/pi-ai
  const flat = path.join(nodeModulesDir, '@earendil-works', 'pi-ai')
  if (fs.existsSync(flat)) found.add(flat)

  return [...found]
}

/** 读取包的 version 字段，读不到就返回 "?"（与原 bash 脚本的容错行为一致）。 */
function readPkgVersion(pkgDir) {
  try {
    const raw = fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8')
    const json = JSON.parse(raw)
    return json.version || '?'
  } catch {
    return '?'
  }
}

/**
 * 校验打完补丁的文件：能被当作 ESM 模块动态导入，且导出的 parseStreamingJson 是函数。
 * 等价于原 bash 脚本 `node --check` + dynamic import 兜底两步的合并（用同进程 import 兼顾语法与可加载性）。
 * 用查询串做 cache-busting，避免同一路径在同一进程内重复打补丁/校验时命中 import 缓存。
 */
async function validateModule(f) {
  try {
    const url = `${pathToFileURL(f).href}?t=${Date.now()}-${Math.random().toString(36).slice(2)}`
    const mod = await import(url)
    return typeof mod.parseStreamingJson === 'function'
  } catch {
    return false
  }
}
