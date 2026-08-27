// 启停：start / stop / status / restart。跨平台（Windows 用 taskkill，POSIX 用信号）。
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, openSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DEFAULT_HOST, DEFAULT_PORT, color, dshEntry, ensureDir, fail, inflight, isInstalled, isUp,
  layout, log, ok, openBrowser, sleep, step, warn,
} from './util.mjs'

const readPid = lay => {
  try {
    const pid = Number(readFileSync(lay.pidFile, 'utf8').trim())
    return Number.isInteger(pid) && pid > 0 ? pid : null
  } catch { return null }
}

/** 进程是否活着。signal 0 在三平台上都只做存在性检查。 */
const alive = pid => {
  try { process.kill(pid, 0); return true } catch (e) { return e.code === 'EPERM' }
}

function killPid(pid, force) {
  if (process.platform === 'win32') {
    // Windows 没有 SIGTERM 语义；/T 连子进程一起收，/F 强杀
    spawnSync('taskkill', ['/PID', String(pid), '/T', ...(force ? ['/F'] : [])], { stdio: 'ignore' })
    return
  }
  try { process.kill(pid, force ? 'SIGKILL' : 'SIGTERM') } catch { /* 已经没了 */ }
}

export async function start({ port = DEFAULT_PORT, host = DEFAULT_HOST, cwd = process.cwd(), open = true } = {}) {
  const lay = layout()
  if (!isInstalled(lay)) { fail('还没安装。先跑：npx dsh-trisoul init'); return 1 }

  const url = `http://${host}:${port}`
  if (await isUp(host, port)) {
    ok(`已在运行 ${url}`)
    if (open) openBrowser(url)
    return 0
  }
  const stale = readPid(lay)
  if (stale && alive(stale)) {
    warn(`进程 ${stale} 在，但 HTTP 没响应——可能正在启动，或事件循环卡住了。`)
    log('  要强制重来：npx dsh-trisoul stop --force')
    return 3
  }

  ensureDir(lay.logs)
  const logFile = join(lay.logs, `dsh-${port}.log`)
  // 日志超 50MB 轮转一份，别让它无限长
  try { if (statSync(logFile).size > 50 * 1024 * 1024) rmSync(logFile, { force: true }) } catch { /* 没有就没有 */ }
  const fd = openSync(logFile, 'a')

  step(`启动 TriSoul（端口 ${port}，工作目录 ${cwd}）`)
  const child = spawn(process.execPath, [
    dshEntry(lay), '--profile', 'trisoul', '--host', host, '--port', String(port), '--no-open',
  ], {
    cwd,
    detached: process.platform !== 'win32',
    stdio: ['ignore', fd, fd],
    windowsHide: true,
    env: {
      ...process.env,
      DSH_HOME: lay.home,
      TRISOUL_DEBUG_DIR: lay.logs,
    },
  })
  child.unref()
  writeFileSync(lay.pidFile, String(child.pid))

  for (let i = 0; i < 180; i++) {
    if (await isUp(host, port)) {
      ok(`已就绪 ${color.bold(url)}`)
      log(color.dim(`  日志：${logFile}`))
      if (open) openBrowser(url)
      return 0
    }
    if (!alive(child.pid)) break
    await sleep(1000)
  }
  fail('启动失败或超时。日志最后 40 行：')
  try { log(readFileSync(logFile, 'utf8').split('\n').slice(-40).join('\n')) } catch { /* 没日志 */ }
  return 1
}

export async function stop({ port = DEFAULT_PORT, host = DEFAULT_HOST, force = false } = {}) {
  const lay = layout()
  const pid = readPid(lay)
  const up = await isUp(host, port)
  if (!up && (!pid || !alive(pid))) { ok('未在运行'); rmSync(lay.pidFile, { force: true }); return 0 }

  if (!force && up) {
    const n = await inflight(host, port)
    if (n !== null && n > 0) {
      warn(`有 ${n} 路调用在飞（任务进行中），拒绝停止。确要停止加 --force`)
      return 2
    }
  }
  if (!pid) { warn('服务在跑但找不到 pid 文件，无法停止；可以手动结束 node 进程'); return 1 }

  step(`停止（pid ${pid}）`)
  for (const hard of [false, false, true]) {
    killPid(pid, hard)
    for (let i = 0; i < 10; i++) {
      if (!alive(pid)) { rmSync(lay.pidFile, { force: true }); ok('已停止'); return 0 }
      await sleep(500)
    }
  }
  fail(`停不掉：pid ${pid}`)
  return 1
}

export async function status({ port = DEFAULT_PORT, host = DEFAULT_HOST } = {}) {
  const lay = layout()
  if (!isInstalled(lay)) { log('未安装（npx dsh-trisoul init）'); return 1 }
  const pid = readPid(lay)
  if (await isUp(host, port)) {
    const n = await inflight(host, port)
    ok(`运行中 http://${host}:${port}${pid ? `（pid ${pid}）` : ''}  在飞调用 ${n ?? '?'}`)
  } else if (pid && alive(pid)) {
    warn(`进程 ${pid} 在，但 HTTP 无响应`)
  } else {
    log('未运行')
  }
  log(color.dim(`  安装目录 ${lay.root}`))
  log(color.dim(`  日志     ${join(lay.logs, `dsh-${port}.log`)}`))
  return 0
}

export async function restart(opts) {
  const code = await stop(opts)
  if (code !== 0 && code !== 2) return code
  if (code === 2) return code
  return start(opts)
}

export function tailLog({ port = DEFAULT_PORT, lines = 80 } = {}) {
  const lay = layout()
  const f = join(lay.logs, `dsh-${port}.log`)
  if (!existsSync(f)) { log('还没有日志'); return 1 }
  log(readFileSync(f, 'utf8').split('\n').slice(-lines).join('\n'))
  return 0
}
