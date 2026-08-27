// 记忆中枢持久态：三件套（记忆库覆盖链 / 预压缩稿 digests / 事件游标 cursor）。
// 纯数据层，零 dsh 依赖，可单测。文件格式 version 2；旧格式 {memories:[{text,ts}]} 读入时自动迁移。
import { sameProject } from './project.mjs'
import { readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

export const SCOPES = Object.freeze(['global', 'cross', 'project'])
const SCOPE_RANK = Object.freeze({ project: 1, cross: 2, global: 3 })
export const STORE_VERSION = 2

// ---- 记忆范围三档（2026-08-20 用户拍板）：cap = 可见半径，读写同径对称；会话与 cap 的绑定持久化在 store.sessionScopes ----
// full = 现状（global+cross+project）；project = 只读写本项目分区；session = 该会话记忆完全独立（外界不进来、里面不出去）。
// session 条目住主库：scope:'session' + session:<sid>——SCOPES 故意不含它（模型/外界不能凭 scope 字段无中生有，只能由 cap 钳制产生），
// 旧的两参 visibleTo 天然看不见它。
export const CAPS = Object.freeze(['full', 'project', 'session'])
export const normalizeCap = (cap) => (CAPS.includes(cap) ? cap : 'full')

// 2026-08-18 用户令「不要任何截断和预算类限制」：预压缩稿条数/长度、覆盖链历史一律不设上限（全留）

export const newId = () => `m_${Date.now().toString(36)}${randomUUID().replace(/-/g, '').slice(0, 6)}`

/** 从文本派生 key：取前 40 个非空白字符的规整形态（模型没给 key 时兜底）。 */
export function deriveKey(text) {
  return String(text ?? '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 40) || 'untitled'
}

export function normalizeScope(scope, fallback = 'project') {
  return SCOPES.includes(scope) ? scope : fallback
}

/** 条目仍有效（未被覆盖、未退役）。 */
export const isActive = (m) => !m.supersededBy && !m.retiredAt

/**
 * 该条目在给定半径内可见。缺省 cap='full'（旧两参调用语义不变）：底层 + 跨项目 + 本项目
 * （sameProject：旧记忆绑的子目录 cwd 也归入本仓库），session 条目一律不可见（私有记忆不出会话）。
 * cap='project'：只见本项目 project 层；cap='session'：只见本会话（m.session === session）的条目。
 */
export const visibleTo = (m, project, { cap = 'full', session } = {}) => {
  if (cap === 'session') return m.scope === 'session' && !!session && m.session === session
  if (m.scope === 'session') return false
  if (cap === 'project') return m.scope === 'project' && (!project || sameProject(m.project, project))
  return m.scope === 'global' || m.scope === 'cross' || (m.scope === 'project' && (!project || sameProject(m.project, project)))
}

// ---- 使用痕迹（#10）：usage:{injected, injectedAt, recalled, recalledAt, lastSessionId}；注入/召回命中时打点，覆盖链 update 随头条继承 ----
export const emptyUsage = () => ({ injected: 0, recalled: 0 })
/** 给条目打一次使用痕迹：kind='injected'|'recalled'；返回条目。 */
export function noteUsage(entry, kind, { now = Date.now(), sessionId } = {}) {
  if (!entry || (kind !== 'injected' && kind !== 'recalled')) return entry
  const u = entry.usage && typeof entry.usage === 'object' ? entry.usage : (entry.usage = emptyUsage())
  u[kind] = (Number(u[kind]) || 0) + 1
  u[`${kind}At`] = now
  if (sessionId) u.lastSessionId = sessionId
  return entry
}
/** 批量打点（注入一批 / 召回命中一批）。 */
export function noteUsageAll(entries, kind, opts) {
  for (const e of entries) noteUsage(e, kind, opts)
  return entries
}

/** 相对时长的短写：刚刚 / 5m / 2h / 3d（整理软信号用）。 */
export function fmtAge(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '?'
  const m = Math.floor(ms / 60_000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}
/**
 * 整理软信号（#3）：`[age · updated · injected n(最近) · recalled n(最近) · src · v链深]`——只是参考信号，不是阈值。
 * age=首记距今，updated=最近改动距今，n(最近)=次数(最近一次距今)，v=覆盖链深度（history 数 +1）。
 */
export function usageSignal(m, now = Date.now()) {
  const u = m.usage ?? {}
  const cnt = (n, at) => `${Number(n) || 0}${Number(n) > 0 && at ? `(${fmtAge(now - at)})` : ''}`
  return `[age ${fmtAge(now - (m.ts ?? now))} · updated ${fmtAge(now - (m.updatedAt ?? m.ts ?? now))} · injected ${cnt(u.injected, u.injectedAt)} · recalled ${cnt(u.recalled, u.recalledAt)} · src ${m.source ?? '?'} · v${(m.history?.length ?? 0) + 1}]`
}

/** 迁移一条旧格式 {text, ts} → v2 条目（旧条目不知道层级，按跨项目对待，整理作业可再归位）。 */
export function migrateLegacyEntry(m, now = Date.now()) {
  if (m && typeof m === 'object' && m.id && m.scope) return m
  const ts = Number(m?.ts) || now
  return {
    id: newId(),
    key: deriveKey(m?.text),
    text: String(m?.text ?? ''),
    scope: 'cross',
    ts,
    updatedAt: ts,
    source: 'legacy',
  }
}

export function migrateStore(raw) {
  const memories = Array.isArray(raw?.memories) ? raw.memories : []
  const now = Date.now()
  const migrated = memories.filter(m => m && typeof m.text === 'string' && m.text.trim()).map(m => migrateLegacyEntry(m, now))
  const store = {
    version: STORE_VERSION,
    memories: migrated,
    digests: Array.isArray(raw?.digests) ? raw.digests : [],
    cursor: raw?.cursor && typeof raw.cursor === 'object' && !Array.isArray(raw.cursor) ? raw.cursor : {},
    curate: normalizeCurateState(raw?.curate),
    // 会话 → 范围档绑定（创建时定死）：中枢第一次触达该会话时写入，之后改默认档不影响它
    sessionScopes: raw?.sessionScopes && typeof raw.sessionScopes === 'object' && !Array.isArray(raw.sessionScopes) ? raw.sessionScopes : {},
  }
  store.migrated = migrated.length > 0 && migrated.some((m, i) => m !== memories[i])
  return store
}

export function loadStore(storePath) {
  let raw = {}
  if (existsSync(storePath)) {
    try { raw = JSON.parse(readFileSync(storePath, 'utf8')) } catch { raw = {} }
  }
  return migrateStore(raw)
}

export function persistStore(storePath, store) {
  const payload = JSON.stringify({
    version: STORE_VERSION,
    memories: store.memories,
    digests: store.digests,
    cursor: store.cursor,
    curate: store.curate ?? normalizeCurateState(),
    sessionScopes: store.sessionScopes ?? {},
  }, null, 2)
  // 先写临时文件再改名：进程被杀时不留半截 JSON
  const tmp = `${storePath}.tmp`
  writeFileSync(tmp, payload)
  renameSync(tmp, storePath)
}

/** 沿覆盖链走到最新头部（模型可能引用已被覆盖的旧 id）。 */
export function resolveHead(store, entry) {
  let cur = entry
  const seen = new Set()
  while (cur.supersededBy && !seen.has(cur.id)) {
    seen.add(cur.id)
    const next = store.memories.find(m => m.id === cur.supersededBy)
    if (!next) break
    cur = next
  }
  return cur
}

/** 按 id 或 key 找目标：先 id，再 key（优先半径内的活跃条目；cap/session 缺省 = full 旧语义）。 */
export function findTarget(store, target, { project, cap = 'full', session } = {}) {
  if (!target) return undefined
  const t = String(target).trim()
  const byId = store.memories.find(m => m.id === t)
  if (byId) return resolveHead(store, byId)
  const candidates = store.memories.filter(m => m.key === t || m.key === t.toLowerCase())
  if (!candidates.length) return undefined
  const active = candidates.filter(isActive)
  const pool = active.length ? active : candidates
  const local = pool.find(m => visibleTo(m, project, { cap, session }))
  return resolveHead(store, local ?? pool[pool.length - 1])
}

/**
 * 应用一批 ops（消化/整理作业 + 用户手动编辑的统一写入口）。
 * add：同 key 已有活跃条目 → 转 update（就地更新优先）；同文本已存在 → 跳过。
 * update：新条目 supersede 旧条目并携带 history；scope 可随 op 变化（project→cross 提升）。
 * retire：标记 retiredAt，不物理删除。
 * manual=true（用户亲手编辑，source 通常 'user'）：允许 scope 降级（cross→project）、op.project 可显式改绑项目、
 * key/project 变化也算变更（模型 ops 不开这些口子，防止模型乱降级/乱绑路径）。
 */
/** 条目是否用户所有（用户亲手写/改过的覆盖链）：机器（digest/curate）不可退役，只能合并 update。 */
export const isUserOwned = (m) => m.source === 'user' || m.origin === 'user'

export function applyOps(store, ops, { project, source = 'digest', now = Date.now(), manual = false, allow, opsMax = 0, cap: capRaw = 'full', session } = {}) {
  const result = { added: [], updated: [], retired: [], skipped: [], ops: [], truncated: 0 }
  if (!Array.isArray(ops)) return result
  // 范围钳制（三档开关）：cap 之外的 wantScope 钳到允许的最外层（project 档下 global/cross→project，session 档下全部落 session），
  // update/retire 的目标越半径一律拦（out-of-scope）——「里面不出去」的对偶是「不改外界」；manual（用户编辑）永远 full。
  const radius = normalizeCap(capRaw)
  // full 档机器作业（digest/curate）也不得碰 session 私有条目——findTarget 按 id 直取、按 key 找不到半径内候选时
  // 回落链尾，都可能穿透到别会话的私有记忆（终审 F1）；用户 manual 编辑是记忆页全局视图，放行。
  const inScope = (m) => radius === 'full'
    ? (manual || m.scope !== 'session')
    : visibleTo(m, project, { cap: radius, session })
  if (radius === 'session' && !session) {
    // session 档必须带会话号，否则条目成孤儿（谁也看不见）：整批响亮拒收
    for (const raw of ops.slice(0, Number(opsMax) > 0 ? Number(opsMax) : Infinity)) {
      if (!raw || typeof raw !== 'object') continue
      result.skipped.push({ op: String(raw.op ?? '').toLowerCase(), reason: 'no-session' })
    }
    return result
  }
  // allow：可编辑条目 id 集合（整理分片用）——update/retire 的目标不在集合内一律跳过（out-of-shard），add 不受限
  const inShard = (target) => !allow || allow.has(target.id)
  const cap = Number(opsMax) > 0 ? Number(opsMax) : Infinity   // 0/缺省 = 不设上限
  if (ops.length > cap) result.truncated = ops.length - cap
  // 每条 op 的处置记录（进事件）：{op, target, reason, applied, skipped?}
  let rec
  const skip = (op, reason, extra = {}) => { result.skipped.push({ op, reason, ...extra }); if (rec) { rec.applied = false; rec.skipped = reason } }
  for (const raw of ops.slice(0, cap)) {
    if (!raw || typeof raw !== 'object') continue
    const op = String(raw.op ?? '').toLowerCase()
    const text = typeof raw.text === 'string' ? raw.text.trim() : ''
    const reason = typeof raw.reason === 'string' && raw.reason.trim() ? raw.reason.trim().slice(0, 200) : undefined
    const targetRef = raw.target ?? raw.key
    rec = { op, ...(targetRef !== undefined && targetRef !== null ? { target: String(targetRef) } : {}), ...(reason ? { reason } : {}), applied: true }
    result.ops.push(rec)
    if (op === 'retire') {
      const target = findTarget(store, targetRef, { project, cap: radius, session })
      if (!target || !isActive(target)) { skip(op, 'target-not-found', { target: raw.target }); continue }
      if (!inScope(target)) { skip(op, 'out-of-scope', { id: target.id }); continue }
      if (!inShard(target)) { skip(op, 'out-of-shard', { id: target.id }); continue }
      // 护栏（#4）：用户所有的条目机器不可退役；底层 global 整理作业不可退役（只可 update 文本）
      if (!manual && isUserOwned(target)) { skip(op, 'user-protected', { id: target.id }); continue }
      if (source === 'curate' && target.scope === 'global') { skip(op, 'global-protected', { id: target.id }); continue }
      target.retiredAt = now
      const why = reason ?? (text ? text.slice(0, 200) : undefined)
      if (why) target.retiredReason = why
      result.retired.push(target)
      continue
    }
    if (op !== 'add' && op !== 'update') { skip(op, 'unknown-op'); continue }
    if (!text) { skip(op, 'empty-text'); continue }
    let target = op === 'update' ? findTarget(store, targetRef, { project, cap: radius, session }) : undefined
    if (target && !inScope(target)) { skip(op, 'out-of-scope', { id: target.id }); continue }
    if (target && isActive(target) && !inShard(target)) { skip(op, 'out-of-shard', { id: target.id }); continue }
    const key = typeof raw.key === 'string' && raw.key.trim() ? raw.key.trim().slice(0, 80) : (target?.key ?? deriveKey(text))
    if (!target) {
      // add（或 update 找不到目标）：同 key 活跃条目存在就地更新；同文本已存在跳过——dup/同 key 都只在半径内判（半径外的世界互不干扰）
      const dupText = store.memories.find(m => isActive(m) && m.text === text && visibleTo(m, project, { cap: radius, session }))
      if (dupText) { skip(op, 'duplicate-text', { id: dupText.id }); continue }
      const sameKey = store.memories.find(m => isActive(m) && m.key === key && visibleTo(m, project, { cap: radius, session }))
      if (sameKey && inShard(sameKey)) target = sameKey
      else if (sameKey) { skip(op, 'out-of-shard', { id: sameKey.id }); continue }
    }
    if (target && !isActive(target)) target = undefined  // 头部已退役：视为新增
    // 层级：op 给了就用；模型 update 时只升不降（project→cross→global 可提升，反向不自动降级）；用户手动编辑可降。
    // normalizeScope 不认 'session'：外界发 scope:'session' 会落回 fallback——session 条目只能由 cap 钳制产生或沿覆盖链继承（target.scope）。
    const askScope = raw.scope ? normalizeScope(raw.scope, target?.scope ?? 'project') : (target?.scope ?? 'project')
    const wantScope = radius !== 'full' ? (radius === 'session' ? 'session' : 'project')
      : (target && !manual && SCOPE_RANK[askScope] < SCOPE_RANK[target.scope] ? target.scope : askScope)
    // 项目绑定：手动编辑可用 op.project 改绑；否则沿用旧条目的，再退回本次作业的 project
    const opProject = manual && typeof raw.project === 'string' && raw.project.trim() ? raw.project.trim() : undefined
    if (target) {
      const wantProject = wantScope === 'project' ? (opProject ?? target.project ?? project) : undefined
      const same = target.text === text && target.scope === wantScope &&
        (!manual || (target.key === key && (wantScope !== 'project' || wantProject === target.project)))
      if (same) { skip(op, 'no-change', { id: target.id }); continue }
      const entry = {
        id: newId(),
        key,
        text,
        scope: wantScope,
        ...(wantScope === 'project' && wantProject ? { project: wantProject } : {}),
        ...(wantScope === 'session' && (target.session ?? session) ? { session: target.session ?? session } : {}),  // 私有归属沿覆盖链继承
        ts: target.ts ?? now,
        updatedAt: now,
        source,
        ...(isUserOwned(target) || source === 'user' ? { origin: 'user' } : {}),  // 用户所有权沿覆盖链继承（机器合并后仍不可退役）
        ...(target.usage ? { usage: { ...target.usage } } : {}),  // 使用痕迹随头条继承（#10）
        history: [...(target.history ?? []), { text: target.text, ts: target.updatedAt ?? target.ts ?? now, scope: target.scope, ...(reason ? { reason } : {}) }],
      }
      target.supersededBy = entry.id
      store.memories.push(entry)
      result.updated.push(entry)
    } else {
      const addProject = opProject ?? project
      const entry = {
        id: newId(),
        key,
        text,
        scope: wantScope,
        ...(wantScope === 'project' && addProject ? { project: addProject } : {}),
        ...(wantScope === 'session' && session ? { session } : {}),
        ts: now,
        updatedAt: now,
        source,
        ...(source === 'user' ? { origin: 'user' } : {}),
      }
      store.memories.push(entry)
      result.added.push(entry)
    }
  }
  return result
}

// ---- 用户手动编辑专用（不走 ops 协议的两个动作）----
/** 找到条目本身（不沿覆盖链走头部）。 */
export const findById = (store, id) => store.memories.find(m => m.id === String(id ?? ''))

/**
 * 恢复已退役条目：清 retiredAt/retiredReason，记 restoredAt。
 * 返回 { entry } 成功；{ error:'not-found' } / { error:'not-retired' }（未退役或只是被覆盖的旧版本）。
 */
export function restoreMemory(store, id, { now = Date.now() } = {}) {
  const entry = findById(store, id)
  if (!entry) return { error: 'not-found' }
  if (!entry.retiredAt) return { error: 'not-retired', entry }
  delete entry.retiredAt
  delete entry.retiredReason
  entry.restoredAt = now
  return { entry }
}

/**
 * 物理删除条目及其覆盖链上游（所有被它/它的前身 supersede 的旧版本）——用户明确要删干净时用；
 * 后继（若该条已被覆盖）不动，后继 history 里的文本副本也不动。
 * 返回被删条目数组（[] = 没找到）。
 */
export function hardDeleteMemory(store, id) {
  const entry = findById(store, id)
  if (!entry) return []
  const doomed = new Set([entry.id])
  let grew = true
  while (grew) {
    grew = false
    for (const m of store.memories) {
      if (m.supersededBy && doomed.has(m.supersededBy) && !doomed.has(m.id)) { doomed.add(m.id); grew = true }
    }
  }
  const removed = []
  for (let i = store.memories.length - 1; i >= 0; i--) {
    if (doomed.has(store.memories[i].id)) removed.unshift(...store.memories.splice(i, 1))  // 原地删，数组身份不变
  }
  return removed
}

/** 半径内（cap/session 缺省 = full）对某 project 可见的活跃记忆，updatedAt 新→旧。 */
export function visibleMemories(store, project, { limit, cap = 'full', session } = {}) {
  const list = store.memories
    .filter(m => isActive(m) && visibleTo(m, project, { cap, session }))
    .sort((a, b) => (b.updatedAt ?? b.ts ?? 0) - (a.updatedAt ?? a.ts ?? 0))
  return limit ? list.slice(0, limit) : list
}

/**
 * 开场注入清单（#6）：底层 global + 用户所有条目常驻（不受 limit 砍），其余按 updatedAt 新→旧补足到 limit；整体按新→旧排。
 */
const isPinned = (m) => m.scope === 'global' || isUserOwned(m)
/** 常驻条目：底层 global + 用户所有（半径内对该 project 可见的活跃条目），新→旧。 */
export const pinnedMemories = (store, project, { cap = 'full', session } = {}) => visibleMemories(store, project, { cap, session }).filter(isPinned)
export function openingMemories(store, project, { limit, cap = 'full', session } = {}) {
  const all = visibleMemories(store, project, { cap, session })
  const pinned = all.filter(isPinned)
  const rest = all.filter(m => !isPinned(m))
  const room = limit ? Math.max(0, limit - pinned.length) : rest.length
  return [...pinned, ...rest.slice(0, room)].sort((a, b) => (b.updatedAt ?? b.ts ?? 0) - (a.updatedAt ?? a.ts ?? 0))
}

export const SCOPE_LABEL = Object.freeze({ global: 'global', cross: 'cross-project', project: 'this project', session: 'this session' })
/** ⑨（2026-08-23）旧中文层标：存量转录里注入行是「[底层] 文本」形态——rebuildInjected 行匹配双认用 */
export const SCOPE_LABEL_LEGACY = Object.freeze({ global: '底层', cross: '跨项目', project: '本项目', session: '本会话' })

/** 注入/回忆时的行渲染：带层级标签。 */
export const formatMemoryLine = (m) => `[${SCOPE_LABEL[m.scope] ?? m.scope}] ${m.text}`
/** 旧中文行形态（存量转录匹配用，勿用于新渲染） */
export const formatMemoryLineLegacy = (m) => `[${SCOPE_LABEL_LEGACY[m.scope] ?? m.scope}] ${m.text}`

// ---- 整理分片（#2）：分片 = global / cross / project:<项目键>；片内按 ts 升序稳定排序，游标 ≤limit 分多轮回绕 ----
export const SHARD_GLOBAL = 'global'
export const SHARD_CROSS = 'cross'
export const projectShard = (project) => `project:${project}`
/** 分片键 → { scope, project? }；非法返回 undefined。 */
export function shardInfo(shard) {
  if (shard === SHARD_GLOBAL) return { scope: 'global' }
  if (shard === SHARD_CROSS) return { scope: 'cross' }
  if (typeof shard === 'string' && shard.startsWith('project:') && shard.length > 8) return { scope: 'project', project: shard.slice(8) }
  return undefined
}
export function normalizeCurateState(raw) {
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})
  return { cursors: obj(raw?.cursors), lastAt: obj(raw?.lastAt) }
}
const byTsThenId = (a, b) => ((a.ts ?? 0) - (b.ts ?? 0)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
/** 库里当前存在的分片：global / cross（各自有活跃条目才算）+ 每个有活跃条目的项目（子目录旧绑定折入其 git 根项目）。 */
export function shardsOf(store) {
  const active = store.memories.filter(isActive)
  const out = []
  if (active.some(m => m.scope === 'global')) out.push(SHARD_GLOBAL)
  // cross 的活还包括跨项目晋升（素材在 project 层）：只认自身条目会与 shardDirty 的「≥2」互锁，
  // 晋升候选永远排不上号（2026-08-26 M2，真机实证 curate.lastAt 自上线无 cross 键）
  if (active.some(m => m.scope === 'cross') || crossCandidates(store).length) out.push(SHARD_CROSS)
  const projects = [...new Set(active.filter(m => m.scope === 'project' && m.project).map(m => m.project))]
  const roots = projects.filter(p => !projects.some(q => q !== p && sameProject(p, q)))
  roots.sort()
  for (const p of roots) out.push(projectShard(p))
  return out
}
/** 分片内活跃条目（ts 升序，稳定）。 */
export function shardEntries(store, shard) {
  const info = shardInfo(shard)
  if (!info) return []
  return store.memories
    .filter(m => isActive(m) && m.scope === info.scope && (info.scope !== 'project' || sameProject(m.project, info.project)))
    .sort(byTsThenId)
}
/** 本轮整理窗口：从游标起取 ≤limit 条；next = 下一轮起点（到尾回绕 0）。游标越界（条目变少）→ 从 0 起。 */
export function curateWindow(store, shard, limit) {
  const all = shardEntries(store, shard)
  const total = all.length
  const cur = store.curate?.cursors?.[shard]
  const cursor = Number.isInteger(cur) && cur > 0 && cur < total ? cur : 0
  const n = Math.max(1, Number(limit) || total || 1)
  const entries = all.slice(cursor, cursor + n)
  const end = cursor + entries.length
  return { entries, cursor, next: end >= total ? 0 : end, total }
}
export function markCurated(store, shard, next, now = Date.now()) {
  if (!store.curate) store.curate = normalizeCurateState()
  store.curate.cursors[shard] = Number.isInteger(next) ? next : 0
  store.curate.lastAt[shard] = now
}
/** 分片有待整理：从未整理过、上轮未走完（游标>0）、或自上次整理后有条目新增/更新。
 *  cross 另算跨项目晋升候选（素材在 project 层）：自身条目数不设门槛——旧「自身≥2」判据把晋升调度锁死（2026-08-26 M2）。 */
export function shardDirty(store, shard) {
  const entries = shardEntries(store, shard)
  const last = store.curate?.lastAt?.[shard]
  if (shard === SHARD_CROSS) {
    const cands = crossCandidates(store)
    if (cands.length) {
      if (!Number.isFinite(last)) return true
      const latest = Math.max(...cands.flatMap(g => g.entries.map(m => m.updatedAt ?? m.ts ?? 0)))
      if (latest > last) return true
    }
  }
  if (entries.length < 2) return false
  if (!Number.isFinite(last)) return true
  if ((store.curate?.cursors?.[shard] ?? 0) > 0) return true
  return entries.some(m => (m.updatedAt ?? m.ts ?? 0) > last)
}
const normText = (t) => String(t ?? '').toLowerCase().replace(/[\s\p{P}]+/gu, '')
const bigrams = (t) => { const s = new Set(); for (let i = 0; i + 1 < t.length; i++) s.add(t.slice(i, i + 2)); return s }
/** 字符二元组 Jaccard 相似度（中英文都能用）。 */
export function textSimilarity(a, b) {
  const A = bigrams(normText(a)), B = bigrams(normText(b))
  if (!A.size || !B.size) return 0
  let inter = 0
  for (const g of A) if (B.has(g)) inter++
  return inter / (A.size + B.size - inter)
}
/**
 * 跨项目候选（cross 分片附带）：project 层活跃条目里「key 相同或文本近似（相似度≥threshold）」且分布在 ≥2 个不同项目的分组。
 * 返回 [{ key?, entries:[...] }]；maxGroups 0/缺省 = 不限组数。
 */
export function crossCandidates(store, { threshold = 0.6, maxGroups = 0 } = {}) {
  const list = store.memories.filter(m => isActive(m) && m.scope === 'project' && m.project).sort(byTsThenId)
  const used = new Set()
  const groups = []
  for (let i = 0; i < list.length && (maxGroups <= 0 || groups.length < maxGroups); i++) {
    const a = list[i]
    if (used.has(a.id)) continue
    const group = [a]
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j]
      if (used.has(b.id) || sameProject(b.project, a.project) || sameProject(a.project, b.project)) continue
      if ((a.key && a.key === b.key) || textSimilarity(a.text, b.text) >= threshold) group.push(b)
    }
    const projects = new Set(group.map(m => m.project))
    if (projects.size >= 2) { for (const m of group) used.add(m.id); groups.push({ key: a.key, entries: group }) }
  }
  return groups
}

// ---- 预压缩稿 ----
export function addDigest(store, { sessionId, start, end, text, project, compactable, empty, phaseClosed }, now = Date.now()) {
  const t = String(text ?? '').trim()
  if (!t || !Number.isInteger(start) || !Number.isInteger(end)) return undefined
  // compactable（画布判据 #2 中枢标记）：中枢判定这批原文还在用时为 false；缺省 = true（不写字段，省体积）
  // empty（P1-7）：这批没有实质内容的占位稿——仍算已消化（可入 digestedRanges），但 lookupDigest 不拿它当底稿
  // phaseClosed（P1-3）：中枢判定这批标志一个阶段收尾——它之前的整段都可整理（digestedRanges 带 phaseClosedAt）
  const digest = { id: `d_${now.toString(36)}`, sessionId, start, end, text: t, ts: now,
    ...(project ? { project } : {}), ...(compactable === false ? { compactable: false } : {}), ...(empty === true ? { empty: true } : {}),
    ...(phaseClosed === true ? { phaseClosed: true } : {}) }
  // 同一毫秒连落两稿 id 会撞（测试里常见）：后缀去重
  if (store.digests.some(d => d.id === digest.id)) digest.id = `${digest.id}_${store.digests.length}`
  store.digests.push(digest)
  return digest
}

/**
 * 复审放行（P1-3）：把此前标 compactable:false 的稿改回可压。
 * ids = 中枢复审点名的稿 id；before = 阶段收尾（phaseClosed）时该 seq 及之前本会话的全部稿一并放行。返回放行条数。
 */
export function markCompactable(store, { sessionId, ids = [], before } = {}) {
  const idSet = new Set((Array.isArray(ids) ? ids : []).map(String))
  let n = 0
  for (const d of store?.digests ?? []) {
    if (sessionId && d.sessionId !== sessionId) continue
    if (d.compactable !== false) continue
    if (idSet.has(d.id) || (Number.isInteger(before) && Math.max(d.start, d.end) <= before)) { delete d.compactable; d.recompactedAt = Date.now(); n++ }
  }
  return n
}

/** 本会话仍标 compactable:false 的稿（按 seq 升序）——消化时附给中枢复审 */
export const holdingDigests = (store, sessionId) =>
  (store?.digests ?? []).filter(d => d.sessionId === sessionId && d.compactable === false).sort((a, b) => a.start - b.start)

/**
 * 已消化且可手术的 seq 区间（画布触发判据 #1「确定性信号」：ctx.bail('trisoul/memory-digested', {sessionId})）。
 * 有预压缩稿 = 这批事件的要点已进记忆库、纪要现成、原文随时可 trisoul_recall 回捞 → 压掉几乎零损失；
 * compactable===false = 中枢判定这批还在用（#2 标记），不给画布。
 * 相邻 / 重叠区间合并后按 start 升序返回；没有 → []。
 */
export function digestedRanges(store, { sessionId } = {}) {
  const hits = (store?.digests ?? [])
    .filter(d => (!sessionId || d.sessionId === sessionId) && d.compactable !== false
      && Number.isInteger(d.start) && Number.isInteger(d.end))
    .map(d => ({ start: Math.min(d.start, d.end), end: Math.max(d.start, d.end), ...(d.phaseClosed === true ? { phaseClosedAt: Math.max(d.start, d.end) } : {}) }))
    .sort((a, b) => a.start - b.start || a.end - b.end)
  const out = []
  for (const r of hits) {
    const last = out[out.length - 1]
    if (last && r.start <= last.end + 1) {
      last.end = Math.max(last.end, r.end)
      // phaseClosedAt（P1-3）：合并段里最晚的阶段收尾点——画布据此把该点之前的洞也视为可整理
      if (r.phaseClosedAt !== undefined) last.phaseClosedAt = Math.max(last.phaseClosedAt ?? -1, r.phaseClosedAt)
    } else out.push({ ...r })
  }
  return out
}

/**
 * 取与 [start,end] 有重叠的预压缩稿（手术刀备料 / 探针出题材料 / P1-4 兜底正文）。返回按 seq 顺序拼接的文本；无则 undefined。
 * sessionId 给了就只看该会话。
 * 重叠语义（P1-5，2026-08-19）：旧「包含」语义要求稿的区间整个落在查询区间内，而中枢按 8 事件定批、画布按连续段圈区间，
 * 边界几乎从不对齐 → 多数查询拿不到稿，探针只好回退原文、补记时把原文整段贴进检查点。
 */
export function lookupDigest(store, { sessionId, start, end } = {}) {
  if (!Number.isInteger(start) || !Number.isInteger(end)) return undefined
  const lo = Math.min(start, end), hi = Math.max(start, end)
  const hits = store.digests
    .filter(d => (!sessionId || d.sessionId === sessionId) && d.empty !== true && Math.min(d.start, d.end) <= hi && Math.max(d.start, d.end) >= lo)
    .sort((a, b) => a.start - b.start)
  if (!hits.length) return undefined
  return hits.map(d => `[seq ${d.start}..${d.end}] ${d.text}`).join('\n')
}

// ---- 事件游标 ----
export const getCursor = (store, sessionId) => store.cursor[sessionId]
export function setCursor(store, sessionId, seq) {
  if (!sessionId || !Number.isInteger(seq)) return
  const cur = store.cursor[sessionId]
  if (cur === undefined || seq > cur) store.cursor[sessionId] = seq
}
