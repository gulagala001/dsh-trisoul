// TriSoul 安全门（M5-lite）：共识 ≠ 授权。
// 三个灵魂一致同意的危险动作也要被拦——tools/pre-execute 瀑布返回 deny，
// 理由回流给模型（它会看到拒绝原因并调整）。零依赖。
export const name = 'trisoul-guard'
export const inject = ['tools']

const DEFAULT_DENY = [
  'rm\\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)[a-z]*\\s+(/|~|\\$HOME)',
  '\\bgit\\s+push\\b',
  '\\bsudo\\b',
  'curl[^|;]*\\|\\s*(ba)?sh',
  'wget[^|;]*\\|\\s*(ba)?sh',
  '\\bmkfs\\b',
  '\\bshutdown\\b|\\breboot\\b',
  '>\\s*/dev/(sd|disk)',
  '\\bdd\\s+if=',
  // ── Windows / PowerShell 对应项 ──
  // 宿主在 win32 上禁用 tool-bash、改挂 tool-pwsh（工具名 'pwsh'），POSIX 那几条正则一条都拦不住，
  // 闸门会整体失效。这里补上等价的破坏性动作，语义与上面一一对应。
  // 08-30 S9：pwsh 里 rm/ri/del/erase/rd/rmdir 都是 Remove-Item 内置别名，参数可缩写（-r = -Recurse；-fo = -Force，-f 与 -Filter 撞名），
  // 两个开关任意顺序；同一命令段（不跨 | ;）内同时出现才算递归强删
  '\\b(Remove-Item|rm|ri|del|erase|rd|rmdir)\\b(?=[^|;]*\\s-r[a-z]*\\b)(?=[^|;]*\\s-fo[a-z]*\\b)',
  // rd /s 是 cmd.exe 语法，pwsh 的 rd 不吃 /s——只有经 cmd /c 转发才会真跑
  '\\bcmd(\\.exe)?\\s+/c\\b[^|;]*\\b(rd|rmdir)\\s+/s\\b',
  '\\bFormat-Volume\\b|\\bClear-Disk\\b|\\bInitialize-Disk\\b|\\bdiskpart\\b',
  '\\bStop-Computer\\b|\\bRestart-Computer\\b',
  '\\b(Invoke-WebRequest|Invoke-RestMethod|iwr|irm|curl)\\b[^|;]*\\|\\s*(iex|Invoke-Expression)\\b',
  '\\bvssadmin\\b[^|;]*\\bdelete\\b|\\bbcdedit\\b|\\bcipher\\b\\s+/w',
  '\\bStart-Process\\b[^|;]*-Verb\\s+RunAs\\b',
]

/** 会被闸门检查的 shell 工具名：POSIX 侧是 bash，Windows 侧宿主换成 pwsh。 */
const SHELL_TOOLS = new Set(['bash', 'pwsh'])

export function apply(ctx, config = {}) {
  const patterns = (config.deny ?? DEFAULT_DENY).map(s => new RegExp(s, 'i'))
  // 08-30 P4：verify_link 的 cmd 走插件自己的 execFile、不过 tools/pre-execute——它来这里问同一份名单
  //（ctx.bail('trisoul/guard', { command })：命中回模式源码，未命中 undefined；安全门缺席时 bail 无人应答同样 undefined = 不拦）
  ctx.on('trisoul/guard', ({ command } = {}) => {
    const hit = patterns.find(re => re.test(String(command ?? '')))
    return hit ? hit.source : undefined
  }, { global: true })
  ctx.on('tools/pre-execute', async (exec, next) => {
    if (SHELL_TOOLS.has(exec.name)) {
      const cmd = String(exec.arguments?.command ?? '')
      const hit = patterns.find(re => re.test(cmd))
      if (hit) {
        ctx.logger?.info(`trisoul-guard: 拒绝危险命令 ${cmd.slice(0, 120)}`)
        return { kind: 'deny', reason:
          `TriSoul safety gate denied: the command matches a dangerous pattern (${hit.source}). Irreversible / outbound actions like this need the user's explicit authorization — use a safe alternative, or tell the user plainly that manual approval is required.` }
      }
    }
    return next()
  })
}
