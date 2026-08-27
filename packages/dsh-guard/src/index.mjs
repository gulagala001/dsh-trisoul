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
]

export function apply(ctx, config = {}) {
  const patterns = (config.deny ?? DEFAULT_DENY).map(s => new RegExp(s, 'i'))
  ctx.on('tools/pre-execute', async (exec, next) => {
    if (exec.name === 'bash') {
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
