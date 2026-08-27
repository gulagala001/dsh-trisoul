// 公共工具：安装路径、包管理器解析、HTTP 探测、开浏览器。零第三方依赖。
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** 本 CLI 包所在目录（仓库根）。 */
export const PKG_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)))

/** 钉死的宿主版本：pnpm 装这棵树 20 秒级，npm/npx 走同一棵要十几分钟（实测 11m45s）。 */
export const DSH_VERSION = '0.1.1-rc.1'

export const DEFAULT_PORT = 3081
export const DEFAULT_HOST = '127.0.0.1'

/**
 * 安装根目录。默认 Windows 用 %LOCALAPPDATA%\dsh-trisoul，其他平台用 ~/.dsh-trisoul；
 * 可用 TRISOUL_HOME 覆盖。注意这里**不是** ~/.dsh —— 与原版 dsh 完全隔离，卸载只删这一个目录。
 */
export function installRoot() {
  if (process.env.TRISOUL_HOME) return resolve(process.env.TRISOUL_HOME)
  if (process.platform === 'win32') {
    const base = process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local')
    return join(base, 'dsh-trisoul')
  }
  return join(homedir(), '.dsh-trisoul')
}

/** 安装目录下的各子目录。 */
export function layout(root = installRoot()) {
  return {
    root,
    host: join(root, 'host'),          // 独立安装的 dsh 宿主
    app: join(root, 'app'),            // TriSoul 插件源码副本
    home: join(root, 'home'),          // DSH_HOME：profile / settings / 会话
    profile: join(root, 'home', 'profiles', 'trisoul'),
    data: join(root, 'data'),          // 记忆库、会话绑定
    logs: join(root, 'logs'),
    pidFile: join(root, 'logs', 'trisoul.pid'),
  }
}

export function ensureDir(dir) {
  mkdirSync(dir, { recursive: true })
  return dir
}

const C = {
  dim: s => `\x1b[2m${s}\x1b[0m`,
  bold: s => `\x1b[1m${s}\x1b[0m`,
  green: s => `\x1b[32m${s}\x1b[0m`,
  red: s => `\x1b[31m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  cyan: s => `\x1b[36m${s}\x1b[0m`,
}
const plain = process.env.NO_COLOR !== undefined || !process.stdout.isTTY
export const color = plain
  ? Object.fromEntries(Object.keys(C).map(k => [k, s => String(s)]))
  : C

export const log = msg => process.stdout.write(`${msg}\n`)
export const step = msg => log(`${color.cyan('▸')} ${msg}`)
export const ok = msg => log(`${color.green('✓')} ${msg}`)
export const warn = msg => log(`${color.yellow('!')} ${msg}`)
export const fail = msg => log(`${color.red('✗')} ${msg}`)

/**
 * 找一个能用的 pnpm。按 pnpm → corepack pnpm → npx -y pnpm 的顺序试。
 * 宿主那棵依赖树只有 pnpm 能在合理时间内装出来，所以这一步是硬需求。
 * @returns {{cmd: string, args: string[], label: string} | null}
 */
export function resolvePnpm() {
  const probe = (cmd, args) => {
    const r = spawnSync(cmd, [...args, '--version'], {
      stdio: 'ignore', shell: process.platform === 'win32', timeout: 120_000,
    })
    return r.status === 0
  }
  if (probe('pnpm', [])) return { cmd: 'pnpm', args: [], label: 'pnpm' }
  if (probe('corepack', ['pnpm'])) return { cmd: 'corepack', args: ['pnpm'], label: 'corepack pnpm' }
  if (probe('npx', ['-y', 'pnpm@10'])) return { cmd: 'npx', args: ['-y', 'pnpm@10'], label: 'npx pnpm@10' }
  return null
}

/** 在指定目录同步跑 pnpm，输出直通终端。返回退出码。 */
export function runPnpm(pnpm, args, cwd, env = {}) {
  const r = spawnSync(pnpm.cmd, [...pnpm.args, ...args], {
    cwd, stdio: 'inherit', shell: process.platform === 'win32',
    env: { ...process.env, ...env },
  })
  return r.status ?? 1
}

/** GET 一个 URL，超时或出错返回 null。只用于本机探活，不做重定向。 */
export async function httpGet(url, timeoutMs = 3000) {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ac.signal })
    return { status: res.status, text: await res.text() }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** 服务是否已就绪。 */
export async function isUp(host, port) {
  const r = await httpGet(`http://${host}:${port}/trisoul/api/state`, 2000)
  return r?.status === 200
}

/** 在飞的调用数（重启前用来避免打断正在跑的任务）；实例无响应返回 null。 */
export async function inflight(host, port) {
  const r = await httpGet(`http://${host}:${port}/trisoul/api/state`, 3000)
  if (!r || r.status !== 200) return null
  try {
    const j = JSON.parse(r.text)
    let n = Number(j.consensus?.inflight || 0)
    for (const v of Object.values(j.stats || {})) n += Number(v?.inflight || 0)
    return n
  } catch { return null }
}

export const sleep = ms => new Promise(r => setTimeout(r, ms))

/** 用系统默认浏览器打开 URL；失败静默（终端里还会打印地址）。 */
export function openBrowser(url) {
  try {
    const [cmd, args] = process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '""', url]]
      : process.platform === 'darwin'
        ? ['open', [url]]
        : ['xdg-open', [url]]
    spawn(cmd, args, { stdio: 'ignore', detached: true }).unref()
  } catch { /* 打不开就算了 */ }
}

/** 宿主入口（dsh 的 bin.js）。 */
export function dshEntry(lay) {
  return join(lay.host, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
}

/** 是否已经 init 过。 */
export function isInstalled(lay = layout()) {
  return existsSync(dshEntry(lay)) && existsSync(join(lay.profile, 'package.json'))
}
