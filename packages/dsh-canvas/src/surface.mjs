// 活表面（live surface）——画布选区与手术刀共用。
// dsh 的表面是「位置序」而不是 seq 序：surfaceOp:'append' 推到表面尾部；surfaceOp:{op:'replace',start,end}
// 用一个新节点 **占据** start..end（按表面位置切片）原来的位置（applySurfacePlan: nodes.splice(startIdx, n, seq)）。
// 于是状态区原地改写后的新消息（seq 更大）位置上仍在旧消息那里；compactRegion(start,end) 的 start/end 也按位置解释、
// 遮蔽的是两位置之间的全部活节点。画布圈区间 / 手术刀执法与出料因此都必须沿 session.surface.nodes 走，
// 按 seq 范围过滤会把位置上在区间里的活状态消息漏掉（dsh 随后以「sourceEventSeqs must include every shadowed
// surface node」拒绝 replace；2026-08-17 真机同一区间连拒 20 次）。

/** 位置序活表面的 seq 列表：真 Session 用其增量维护的 surface.nodes；否则（测试假会话）按 dsh 语义重折一遍。 */
export function surfaceSeqs(session) {
  const nodes = session?.surface?.nodes
  if (nodes) return nodes
  return foldPositional(session?.events ?? [])
}

/** 按 dsh 语义重折：append 推尾、replace 按位置切片占位。只用于没有 surface 管理器的会话对象。 */
export function foldPositional(events) {
  const nodes = []
  for (const e of events) {
    const op = e?.surfaceOp
    if (op === undefined) continue
    if (op === 'append') { nodes.push(e.seq); continue }
    if (op && typeof op === 'object' && op.op === 'replace') {
      const i = nodes.indexOf(op.start), j = nodes.indexOf(op.end)
      if (i === -1 || j === -1 || i > j) continue // 真日志里 dsh 已在 append 时拒绝这种事件，这里只会遇到假数据
      nodes.splice(i, j - i + 1, e.seq)
    }
  }
  return nodes
}

/** 位置序活表面事件（seq → 事件对象）。
 *  S4（2026-08-31 perf-audit）审后保持全量重建：曾试 WeakMap 增量维护 seq→event 映射，但事件数组存在
 *  「原位替换中段槽位」的合法用法（canvas.test pickRegion 用例即如此），身份/长度校验兜不住 stale 映射；
 *  本函数只建 Map 不做渲染，成本远小于 contentTextOf/estTokens（那两处已按事件对象 memo），不值得冒险。 */
export function surfaceEvents(session) {
  const bySeq = new Map((session?.events ?? []).map(e => [e.seq, e]))
  return surfaceSeqs(session).map(seq => bySeq.get(seq)).filter(Boolean)
}
