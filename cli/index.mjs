#!/usr/bin/env node
// dsh-trisoul —— TriSoul 的一键安装 / 启停 / 卸载入口。
import { init } from './lib/init.mjs'
import { patchPiAi } from './lib/patch-pi-ai.mjs'
import { restart, start, status, stop, tailLog } from './lib/server.mjs'
import { uninstall } from './lib/uninstall.mjs'
import {
  DEFAULT_HOST, DEFAULT_PORT, DSH_VERSION, color, fail, isInstalled, layout, log, ok, warn,
} from './lib/util.mjs'

const HELP = `
${color.bold('TriSoul')} —— 三魂共识 Agent（基于 DeepSeek Harness）

  npx dsh-trisoul <命令> [选项]

命令
  init                装到独立目录（首次用这个）
  start               启动并打开浏览器
  stop                停止
  restart             重启（有任务在跑时会拒绝，除非 --force）
  status              看状态
  log [n]             看最后 n 行日志（默认 80）
  doctor              重打上游补丁 + 自检
  uninstall           卸载：删掉整个安装目录（不碰你的 ~/.dsh）

选项
  --port <n>          端口（默认 ${DEFAULT_PORT}）
  --host <addr>       监听地址（默认 ${DEFAULT_HOST}，只本机可访问）
  --cwd <dir>         Agent 的工作目录（默认：当前所在目录）
  --no-open           启动后不自动开浏览器
  --force             stop/restart 时无视在飞的任务；init 时强制重装宿主
  --yes               卸载时跳过确认
  --keep-data         卸载时先把记忆库和会话备份到 ~/trisoul-data-backup
  --dsh-version <v>   指定宿主版本（默认 ${DSH_VERSION}）

例子
  npx dsh-trisoul init && npx dsh-trisoul start
  npx dsh-trisoul start --cwd ~/my-project
  npx dsh-trisoul uninstall --keep-data
`

function parseArgs(argv) {
  const opts = { open: true }
  const rest = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    switch (a) {
      case '--port': opts.port = Number(argv[++i]); break
      case '--host': opts.host = argv[++i]; break
      case '--cwd': opts.cwd = argv[++i]; break
      case '--dsh-version': opts.dshVersion = argv[++i]; break
      case '--no-open': opts.open = false; break
      case '--force': opts.force = true; break
      case '--yes': case '-y': opts.yes = true; break
      case '--keep-data': opts.keepData = true; break
      case '--help': case '-h': opts.help = true; break
      default:
        if (a.startsWith('-')) { fail(`未知选项 ${a}`); process.exit(64) }
        rest.push(a)
    }
  }
  if (opts.port !== undefined && !Number.isInteger(opts.port)) { fail('--port 要是个整数'); process.exit(64) }
  return { opts, rest }
}

async function doctor() {
  const lay = layout()
  if (!isInstalled(lay)) { fail('还没安装。先跑：npx dsh-trisoul init'); return 1 }
  const res = await patchPiAi(lay.host)
  if (res.missing) { warn('没找到 pi-ai——宿主结构可能变了'); return 1 }
  if (res.patched.length) ok(`补丁已重打（${res.patched.length} 处）`)
  else ok(`补丁已在位（${res.skipped.length} 处）`)
  log(color.dim(`  安装目录 ${lay.root}`))
  return 0
}

const { opts, rest } = parseArgs(process.argv.slice(2))
const cmd = rest[0] ?? (opts.help ? 'help' : 'help')

let code = 0
switch (cmd) {
  case 'init': code = await init(opts); break
  case 'start': code = await start(opts); break
  case 'stop': code = await stop(opts); break
  case 'restart': code = await restart(opts); break
  case 'status': code = await status(opts); break
  case 'log': code = tailLog({ ...opts, lines: Number(rest[1]) || 80 }); break
  case 'doctor': code = await doctor(); break
  case 'uninstall': code = await uninstall(opts); break
  case 'help': log(HELP); break
  default: fail(`未知命令 ${cmd}`); log(HELP); code = 64
}
process.exit(code)
