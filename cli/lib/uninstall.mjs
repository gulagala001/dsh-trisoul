// `trisoul uninstall`：把安装目录整个删掉。只删自己那一个目录，绝不碰 ~/.dsh。
import { createInterface } from 'node:readline/promises'
import { cpSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { stop } from './server.mjs'
import { DEFAULT_HOST, DEFAULT_PORT, color, fail, layout, log, ok, step, warn } from './util.mjs'

/** 目录占用体积（MB），算不出来返回 null。 */
function sizeMB(dir) {
  try {
    let total = 0
    const walk = d => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name)
        if (e.isDirectory()) walk(p)
        else if (e.isFile()) { try { total += statSync(p).size } catch { /* 跳过 */ } }
      }
    }
    walk(dir)
    return Math.round(total / 1048576)
  } catch { return null }
}

export async function uninstall({ yes = false, keepData = false, port = DEFAULT_PORT, host = DEFAULT_HOST } = {}) {
  const lay = layout()
  const root = resolve(lay.root)

  if (!existsSync(root)) { ok('没有安装，无需卸载'); return 0 }

  // 安全围栏：只允许删自己那个安装目录。任何指到 home 根、~/.dsh、或过短的路径一律拒绝。
  const home = resolve(homedir())
  const forbidden = [home, resolve(join(home, '.dsh')), resolve('/')]
  if (forbidden.includes(root) || root.split(/[/\\]/).filter(Boolean).length < 2) {
    fail(`拒绝删除：${root} 看起来不是 TriSoul 的安装目录`)
    return 1
  }
  if (!existsSync(join(root, 'host')) && !existsSync(join(root, 'home'))) {
    fail(`拒绝删除：${root} 里没有 TriSoul 的目录结构，可能不是安装目录`)
    return 1
  }

  const mb = sizeMB(root)
  log(`${color.bold('卸载 TriSoul')}`)
  log(`  目录：${root}${mb === null ? '' : `（约 ${mb} MB）`}`)
  log(`  ${color.dim('不会碰你的 ~/.dsh —— 原版 dsh 的配置、会话、密钥都留在原处')}`)
  if (keepData) log(`  ${color.dim('--keep-data：记忆库与会话数据会先备份出来')}`)
  else log(`  ${color.yellow('包含记忆库、会话记录和你填的 API key，删了不可恢复')}`)

  if (!yes) {
    if (!process.stdin.isTTY) {
      fail('非交互环境下需要显式确认：加 --yes')
      return 1
    }
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const answer = (await rl.question(`\n确认删除？输入 ${color.bold('yes')} 继续：`)).trim()
    rl.close()
    if (answer !== 'yes') { log('已取消'); return 1 }
  }

  // 先停服务，否则 Windows 上文件被占用删不掉
  await stop({ port, host, force: true })

  let backup = null
  if (keepData && existsSync(lay.data)) {
    backup = join(homedir(), 'trisoul-data-backup')
    step(`备份数据到 ${backup}`)
    rmSync(backup, { recursive: true, force: true })
    cpSync(lay.data, backup, { recursive: true })
  }

  step('删除安装目录')
  rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  if (existsSync(root)) {
    warn(`没能完全删掉 ${root}——可能有文件被占用。关掉相关程序后重跑，或手动删除该目录。`)
    return 1
  }

  ok('已卸载')
  if (backup) log(`  数据备份在 ${backup}`)
  log(color.dim('  宿主 dsh、Node、pnpm 都是装在这个目录里的，一并删掉了；系统里其他东西没动过。'))
  return 0
}
