// `trisoul init`：把宿主 + TriSoul 插件装进一个独立目录，全程不碰 ~/.dsh。
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { patchPiAi } from './patch-pi-ai.mjs'
import {
  DSH_VERSION, PKG_ROOT, color, ensureDir, fail, layout, log, ok, resolvePnpm, runPnpm, step, warn,
} from './util.mjs'

/**
 * 装依赖时的本地配置：
 * - ignore-scripts：koffi / node-pty 这类原生依赖都带预编译产物，不需要在用户机器上编译
 *   （也就不需要 Xcode / Visual Studio 构建链），顺带避开构建脚本的交互确认。
 * - strict-dep-builds=false：pnpm 11 默认把「有依赖的构建脚本被忽略」当成错误退出
 *   （ERR_PNPM_IGNORED_BUILDS）。我们是**故意**不跑这些脚本，所以显式关掉这个严格模式。
 */
const NPMRC = 'ignore-scripts=true\n'
/**
 * pnpm 11 默认把「依赖的构建脚本被忽略」当成错误退出（ERR_PNPM_IGNORED_BUILDS），
 * 而且这个开关只认 pnpm-workspace.yaml，写在 .npmrc 里不生效（实测）。
 * 我们是**故意**不跑那些脚本的，所以显式关掉严格模式。
 */
const PNPM_WS = 'strictDepBuilds: false\n'

/** 在一个安装目录里写好包管理器配置。 */
function writePmConfig(dir) {
  writeFileSync(join(dir, '.npmrc'), NPMRC)
  writeFileSync(join(dir, 'pnpm-workspace.yaml'), PNPM_WS)
}

/**
 * app/ 这个迷你 monorepo 根要提供的外部依赖 —— 插件用 link: 挂进 profile 后，
 * Node 从 app/packages/<包>/src/ 逐级向上找 node_modules，最终落到 app/node_modules。
 * 服务端四项是插件源码里实际 import 的；react 与 dsh-client-* 是三个 Web UI 插件的 peer，
 * 一并备好，免得客户端插件装载时缺件。
 */
const APP_DEPS = version => ({
  '@deepseek-ai/schemastery': '3.18.1',
  '@deepseek-ai/cordis': '^4.0.1',
  '@deepseek-ai/dsh-compaction': version,
  '@deepseek-ai/dsh-llm': version,
  '@deepseek-ai/dsh-session': version,
  '@deepseek-ai/dsh-client-locale': version,
  '@deepseek-ai/dsh-client-runtime': version,
  '@deepseek-ai/dsh-client-ui-primitives': version,
  '@deepseek-ai/dsh-client-ui-slots': version,
  '@deepseek-ai/dsh-client-ui-settings': version,
  '@deepseek-ai/dsh-client-ui-conversation': version,
  react: '^18.2.0',
})

/** profile 里要挂的 TriSoul 插件：包名 → app/packages 下的目录名。 */
const PLUGINS = [
  ['@trisoul/dsh-api', 'dsh-api'],
  ['@trisoul/dsh-canvas', 'dsh-canvas'],
  ['@trisoul/dsh-consensus', 'dsh-plugin'],
  ['@trisoul/dsh-guard', 'dsh-guard'],
  ['@trisoul/dsh-memory', 'dsh-memory'],
  ['@trisoul/dsh-surgeon', 'dsh-surgeon'],
  ['@trisoul/dsh-client-memory-ui', 'client/memory-ui'],
  ['@trisoul/dsh-client-monitor', 'client/monitor'],
  ['@trisoul/dsh-client-settings', 'client/settings'],
]

/**
 * 生成 profile 的 package.json。
 * 依赖规格必须用 `link:` 而不是 `file:`：几个插件之间有**相对路径**的跨包引用
 * （dsh-canvas / dsh-surgeon 都 import '../../dsh-plugin/src/effort.mjs'），
 * file: 会把每个包各自拷进虚拟库的独立目录，包与包的相对位置就断了。
 * link: 保持它们都待在 app/packages/ 下的原始相对布局；它们各自的外部依赖
 * 由 app/ 这个迷你 monorepo 根统一提供（见 APP_DEPS）。
 */
function profileManifest(appDir) {
  const dependencies = { '@deepseek-ai/dsh-web-fetch-http': DSH_VERSION }
  for (const [name, dir] of PLUGINS) dependencies[name] = `link:${join(appDir, 'packages', dir)}`
  return {
    name: 'dsh-profile-trisoul',
    private: true,
    dependencies: Object.fromEntries(Object.entries(dependencies).sort(([a], [b]) => a.localeCompare(b))),
    dsh: {
      profile: {
        bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app'],
        plugins: PLUGINS.map(([name]) => name),
      },
    },
  }
}

export async function init({ force = false, dshVersion = DSH_VERSION } = {}) {
  const lay = layout()
  log(`${color.bold('TriSoul')} 安装到 ${color.dim(lay.root)}`)
  log(color.dim('（独立目录，与你已有的 ~/.dsh 完全隔离；卸载只删这一个目录）\n'))

  const pnpm = resolvePnpm()
  if (!pnpm) {
    fail('找不到 pnpm。宿主那棵依赖树只有 pnpm 能在合理时间内装出来。')
    log('  请先装一个：npm i -g pnpm     （或 corepack enable pnpm）')
    return 1
  }
  step(`包管理器：${pnpm.label}`)

  for (const d of [lay.root, lay.host, lay.app, lay.home, lay.data, lay.logs]) ensureDir(d)

  // 1. 宿主 —— 独立一棵树，不动全局 npm/pnpm 的任何东西
  const hostPkg = join(lay.host, 'package.json')
  const needHost = force || !existsSync(join(lay.host, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js'))
  if (needHost) {
    step(`安装宿主 @deepseek-ai/dsh@${dshVersion}（首次约 1~3 分钟）`)
    writeFileSync(hostPkg, `${JSON.stringify({
      name: 'trisoul-host', private: true, dependencies: { '@deepseek-ai/dsh': dshVersion },
    }, null, 2)}\n`)
    writePmConfig(lay.host)
    if (runPnpm(pnpm, ['install'], lay.host) !== 0) { fail('宿主安装失败'); return 1 }
    ok('宿主就位')
  } else {
    ok('宿主已存在，跳过（要强制重装加 --force）')
  }

  // 2. 插件源码副本 —— 独立一份，卸载时一起删，不依赖 npx 缓存目录
  step('复制 TriSoul 插件')
  rmSync(join(lay.app, 'packages'), { recursive: true, force: true })
  cpSync(join(PKG_ROOT, 'packages'), join(lay.app, 'packages'), { recursive: true })
  writeFileSync(join(lay.app, 'package.json'), `${JSON.stringify({
    name: 'trisoul-app', private: true, dependencies: APP_DEPS(dshVersion),
  }, null, 2)}\n`)
  writePmConfig(lay.app)
  if (runPnpm(pnpm, ['install'], lay.app) !== 0) { fail('插件依赖安装失败'); return 1 }
  ok(`插件就位（${PLUGINS.length} 个）`)

  // 3. profile
  step('装配 profile')
  ensureDir(lay.profile)
  writeFileSync(join(lay.profile, 'package.json'), `${JSON.stringify(profileManifest(lay.app), null, 2)}\n`)
  writeFileSync(join(lay.profile, 'cordis.yml'), '[]\n')
  writePmConfig(lay.profile)
  const tpl = readFileSync(join(PKG_ROOT, 'config', 'trisoul.patch.yml'), 'utf8')
  writeFileSync(join(lay.profile, 'cordis.patch.yml'), tpl.replaceAll('__DATA_DIR__', lay.data.replaceAll('\\', '/')))
  if (runPnpm(pnpm, ['install'], lay.profile) !== 0) { fail('profile 依赖安装失败'); return 1 }
  ok('profile 装配完成')

  // 4. 上游补丁
  step('打上游补丁（pi-ai 流式解析）')
  const res = await patchPiAi(lay.host)
  if (res.missing) warn('没找到 pi-ai，跳过补丁——宿主结构可能变了，遇到卡死请跑 trisoul doctor')
  else if (res.patched.length) ok(`补丁已打（${res.patched.length} 处）`)
  else ok('补丁已是最新，无需重打')

  // 5. 装配自检：插件入口能不能被解析
  step('自检')
  const missing = PLUGINS.filter(([, dir]) => {
    const p = join(lay.app, 'packages', dir, 'package.json')
    return !existsSync(p)
  })
  if (missing.length) { fail(`插件缺失：${missing.map(([n]) => n).join(', ')}`); return 1 }
  ok('全部插件入口就位')

  log(`\n${color.green('安装完成。')}`)
  log(`  启动：${color.bold('npx dsh-trisoul start')}`)
  log(`  首次启动后，在网页 ${color.bold('设置 → 模型')} 里填一个 DeepSeek API key 就能用了。`)
  log(color.dim(`  安装目录：${lay.root}`))
  return 0
}
