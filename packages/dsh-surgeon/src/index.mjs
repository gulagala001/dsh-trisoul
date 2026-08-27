// TriSoul 上下文手术刀（M3）：CompactionEngine 实现
// - compactIfNeeded → null：取消按新旧的自动压缩（TriSoul 架构核心主张）
// - compactRegion：真·区域手术——书记官压缩圈定区间，按三段协议提交
//   （compaction/start 锁 → compaction/summary 记账 → 紧邻 user/message surfaceOp:replace）
// - 恒真区执法：区间含用户原话 / 画布状态区最新一版直接拒绝；已换代的状态区旧版（P2-2）可入区间
//   被顺路吞掉（不进纪要原料——过期工作状态不该进检查点）；已换代的记忆补注旧版（renew 换代制）同理剔出原料
// - 探针补记搭车（P2-3）：compactRegion 第 5 参 extras.probeNotes——验收未过攒下的问答随这刀并入纪要
// - 检查点可合并不可丢（P1-2，2026-08-19）：区间可含既有手术检查点——其纪要正文作原料（剥掉契约头行）、
//   新检查点的「被压区间 seq lo..hi」= 旧检查点头部区间 ∪ 区间事件 seq（trisoul_recall 回捞才不漏）
// - 区间按 dsh 位置序活表面解释（surface.nodes；替换者占据被替换者的位置）：start/end 是两个活节点，
//   区间 = 两者位置之间的全部活节点——与 dsh 对 surfaceOp:replace 的解释完全一致，sourceEventSeqs 才能覆盖全部被遮蔽节点
import CompactionEngine, { compactCheckpointSource, CompactionId } from '@deepseek-ai/dsh-compaction'
import { createUserMessage } from '@deepseek-ai/dsh-llm/message'
import { deriveEventMessage, isSurfaceEvent } from '@deepseek-ai/dsh-session'
// 同仓库兄弟包的相对引用（各包都以 file: 链接进 profile，仓库布局即部署布局；
// 手术刀是「小作业」，默认请求 reasoningEffort 'off'，经能力门控防 UNSUPPORTED_REASONING_EFFORT）
import { smallJobEffort } from '../../dsh-plugin/src/effort.mjs'
import { surfaceSeqs } from '../../dsh-canvas/src/surface.mjs'

/**
 * 把一个 surface 事件渲染成给手术刀读的纯文本（全文——2026-08-18 用户令：不要任何截断；旧「每事件截 800 字」让
 * 20k 字的文件读结果只剩开头、纪要没内容、模型压完就得重读）。
 * - assistant/message：取 text、tool-call 与**蒸馏块**，丢其余 reasoning 块——共识插件的旁白（[TriSoul] …）
 *   写在 reasoning 块里且排在最前，按原来 JSON.stringify(e.data) 的读法会把纪要污染成「共识启动…」；
 *   模型自己的思考也不该进检查点
 * - C5（2026-08-25）：蒸馏块（trisoul==='distilled'）放行取 text——findings/plan 只活在它里面，
 *   整块丢会让「这一步想定的方案」活不过第一刀（真机 36 步 5 刀、蒸馏块寿命≈10 步）。
 *   旁白全文躺在块的 note 暗字段上，只取 text 天然把它挡在外面（匿名表决是红线）
 * - user/message：只取 text 块（图片/其它块丢弃）
 * - 其它（tool/result 等）：保持 JSON 原样
 */
/** 蒸馏思考块的标记值（与 dsh-plugin 的 DISTILLED_TAG 同源） */
const DISTILLED_TAG = 'distilled'
export function renderSurfaceEvent(e) {
  const d = e?.data ?? {}
  if (e?.type === 'assistant/message') {
    const blocks = Array.isArray(d.message?.content) ? d.message.content : []
    return blocks.flatMap(b => {
      if (b?.type === 'text') return [b.text ?? '']
      if (b?.type === 'reasoning' && b.trisoul === DISTILLED_TAG) return [b.text ?? '']
      if (b?.type === 'tool-call') return [`[tool-call ${b.name}] ${b.arguments ?? ''}`]
      return []
    }).join('\n')
  }
  if (e?.type === 'user/message') {
    const blocks = Array.isArray(d.content) ? d.content : []
    return blocks.filter(b => b?.type === 'text').map(b => b.text ?? '').join('\n')
  }
  return JSON.stringify(d)
}

/**
 * 固定密度启发式令牌计价（与 @deepseek-ai/dsh-token-meter 的 estimateMessage 逐字一致——token-meter
 * 的 fold 用它给活表面节点计价，手术刀记的 shadowedTokenCount 必须等于被遮蔽区间各活节点的这一计价之和，
 * 否则 token-meter 投影的 messageTokens 会逐刀漂移成负数（2026-08-24 实测 29 刀漂到 -92391 撑爆 schema）。
 * 该计价器是 dsh 固定启发式（CHARS_PER_TOKEN=4、每块/每条 +4，常数稳定），一旦 dsh 改版必须同步此拷贝。
 * - 与 token-meter 的定义对齐：text/reasoning = ceil(len/4)+4；tool-call = ceil(name/4)+ceil(args/4)+4；
 *   tool-result = 递归 content +4；未知块 = 4+ceil(JSON长度/4)；每条消息再加 ROLE_OVERHEAD=4。
 */
/** 内容块计价（不含 role overhead；tool-result 递归用这个，同 meter 的 estimateContent） */
function estimateContentTokens(content) {
  const chars = 4 // CHARS_PER_TOKEN
  const blockOverhead = 4 // BLOCK_OVERHEAD
  const blocks = Array.isArray(content) ? content : []
  let tokens = 0
  for (const block of blocks) {
    switch (block?.type) {
      case 'text':
      case 'reasoning':
        tokens += Math.ceil((block.text ?? '').length / chars) + blockOverhead
        break
      case 'tool-call':
        tokens += Math.ceil((block.name ?? '').length / chars) + Math.ceil((block.arguments ?? '').length / chars) + blockOverhead
        break
      case 'tool-result':
        tokens += estimateContentTokens(block.content) + blockOverhead
        break
      default:
        tokens += blockOverhead + Math.ceil(JSON.stringify(block).length / chars)
    }
  }
  return tokens
}

export function estimateMessageTokens(message) {
  if (!message) return 0
  const roleOverhead = 4 // ROLE_OVERHEAD
  return estimateContentTokens(message.content) + roleOverhead
}

/** 检查点契约头（④ 归属式英文版，2026-08-23）：「seq a..b」是与 trisoul_recall（dsh-memory）共用的契约字样；
 *  旧中文头（【TriSoul 手术检查点 · 被压区间 …】）双认——存量会话 resume/再合并不受升级影响 */
const CHECKPOINT_HEAD_RE = /^\[Work record · seq (\d+)\.\.(\d+)\][^\n]*\n?/
const CHECKPOINT_HEAD_RE_LEGACY = /^【TriSoul 手术检查点 · 被压区间 seq (\d+)\.\.(\d+)[^】]*】\n?/
/** 既有检查点事件 → { lo, hi, body }；不是检查点 → undefined */
export function parseCheckpoint(e) {
  if (e?.type !== 'user/message' || e.data?.source?.compactionId === undefined) return undefined
  const text = (Array.isArray(e.data?.content) ? e.data.content : []).filter(b => b?.type === 'text').map(b => b.text ?? '').join('\n')
  const m = CHECKPOINT_HEAD_RE.exec(text) ?? CHECKPOINT_HEAD_RE_LEGACY.exec(text)
  return m ? { lo: Number(m[1]), hi: Number(m[2]), body: text.slice(m[0].length) } : { lo: undefined, hi: undefined, body: text }
}

export default class TrisoulSurgeon extends CompactionEngine {
  static inject = ['llm']

  constructor(ctx, config = {}) {
    super(ctx)
    this.cfg = config
  }

  // TriSoul：压力不触发摘要——上下文管理归中枢的区域手术，不做全局有损压缩
  async compactIfNeeded() { return null }
  async compactNow() { return null }

  async compactRegion(start, end, agent, signal, extras = undefined) {
    const session = agent.session
    // 位置序活表面：start/end 必须是活节点；区间 = 两者位置之间的全部活节点（可能含 seq 更大的替换者，
    // 它位置上仍在被替换者处，横跨最新状态区的区间会在下面被恒真区执法拒收）
    const nodes = surfaceSeqs(session)
    const si = nodes.indexOf(start), ei = nodes.indexOf(end)
    if (si === -1 || ei === -1) throw new Error(`TriSoul surgeon: 区间端点不在活表面（${start}..${end}），拒绝手术`)
    const [a, b] = si <= ei ? [si, ei] : [ei, si]
    const opStart = nodes[a], opEnd = nodes[b]
    const bySeq = new Map(session.events.map(e => [e.seq, e]))
    const region = nodes.slice(a, b + 1).map(seq => bySeq.get(seq)).filter(e => e && isSurfaceEvent(e))
    if (region.length === 0) throw new Error('TriSoul surgeon: 区间内无 surface 事件')
    // 恒真区禁入：用户原话不可被手术；画布状态区（plugin trisoul-canvas）P2-2 换代制后只有
    // 「活表面上 seq 最大的一版」是恒真区——旧版已被换代，可入区间被吞掉（纯清理，不进纪要）。
    // canvas 圈区间时已避让，这里是双保险（手术刀被别的编排器调用时也不许压掉最新状态区）
    // ⑧ 用户原话退役（2026-08-23，默认关）：bail trisoul/user-retirement=true 时旧用户消息可入区间进原料；
    // 最新一条用户消息（当前任务的对照原文）无论开关永不入
    const isUserMsg = (e) => e.type === 'user/message' && e.data?.source?.kind === 'user'
    let userRetirement = false
    try { userRetirement = this.ctx.bail?.('trisoul/user-retirement') === true } catch {}
    if (!userRetirement && region.some(isUserMsg)) {
      throw new Error('TriSoul surgeon: 区间包含用户原话（恒真区），拒绝手术')
    }
    if (userRetirement) {
      const liveUserSeq = nodes.reduce((m, seq) => {
        const e = bySeq.get(seq)
        return (e && isUserMsg(e) && e.seq > m) ? e.seq : m
      }, -1)
      if (region.some(e => isUserMsg(e) && e.seq === liveUserSeq)) {
        throw new Error('TriSoul surgeon: 区间包含最新一条用户原话，拒绝手术')
      }
    }
    const isCanvasState = (e) => e.type === 'user/message' && e.data?.source?.kind === 'plugin' && e.data?.source?.plugin === 'trisoul-canvas'
    const liveStateSeq = nodes.reduce((m, seq) => {
      const e = bySeq.get(seq)
      return (e && isCanvasState(e) && e.seq > m) ? e.seq : m
    }, -1)
    if (region.some(e => isCanvasState(e) && e.seq === liveStateSeq)) {
      throw new Error('TriSoul surgeon: 区间包含画布状态区最新一版（恒真区），拒绝手术')
    }
    // 原文（渲染后不含 reasoning）：既是手术刀的原料，也是不变量「检查点必须比原文短」的基准。
    // 区间里的旧检查点（P1-2）按「[checkpoint seq a..b] 纪要正文」进原料（契约头行剥掉——那是给主模型看的回捞指引，不是事实）；
    // 已换代的状态区旧版不进原料（工作状态快照已被新版取代，进纪要只会掺入过期状态）——但照常被遮蔽（这刀顺路把它清走）；
    // 已换代的记忆补注旧版（renew 换代制，2026-08-21）同理：旧版是最新版的子集，进纪要只会把记忆行抄进检查点
    const isMemSupplement = (e) => e.type === 'user/message' && e.data?.source?.kind === 'plugin' && e.data?.source?.plugin === 'trisoul-memory'
      && (Array.isArray(e.data?.content) ? e.data.content : []).some(b => b?.type === 'text' && (String(b.text ?? '').startsWith('[Task memory') || String(b.text ?? '').startsWith('【记忆中枢补注')))
    const liveSuppSeq = nodes.reduce((m, seq) => {
      const e = bySeq.get(seq)
      return (e && isMemSupplement(e) && e.seq > m) ? e.seq : m
    }, -1)
    const material = region.filter(e => !isCanvasState(e) && !(isMemSupplement(e) && e.seq !== liveSuppSeq))
    if (material.length === 0) throw new Error('TriSoul surgeon: 区间只含已换代的状态区/补注旧版，无可纪要内容，拒绝这刀')
    const checkpoints = material.map(parseCheckpoint).filter(Boolean)
    const rawRegion = material.map(e => {
      const cp = parseCheckpoint(e)
      if (cp) return `[checkpoint${cp.lo !== undefined ? ` seq ${cp.lo}..${cp.hi}` : ''}] ${cp.body}`
      return `[${e.type}] ${renderSurfaceEvent(e)}`
    }).join('\n')
    let raw = rawRegion
    // 底稿（#12）：记忆中枢消化时留下的该区间预压缩稿（bail trisoul/memory-digest）——有则附在原文后当参考底稿，仍以原文为准；
    // 不变量被违反时它也是兜底检查点正文
    let draft = ''
    try {
      const seqs = region.map(e => e.seq)
      const d = this.ctx.bail?.('trisoul/memory-digest', { sessionId: session.id, start: Math.min(...seqs), end: Math.max(...seqs) })
      if (typeof d === 'string' && d.trim()) { draft = d.trim(); raw += `\n\nPre-condensed draft from the memory hub (usable as a base; the original text above remains authoritative):\n${draft}` }
    } catch {}
    // 探针补记搭车（P2-3）：canvas 手术前取的待补问答快照——此前检查点答不出、被验收官抽查出的事实，
    // 随这刀写进新检查点（成功后 canvas 按快照消账；失败则留队列等下一刀）
    const probeNotes = Array.isArray(extras?.probeNotes) ? extras.probeNotes.filter(x => typeof x === 'string' && x.trim()) : []
    // 终审 F2：补记必须保留进纪要，所以「必须更短」的基准也要把补记算进原文侧——
    // 否则攒得越多越易被拒，而拒刀不消账，队列只增（正反馈直到连败冷却）
    let notesBlock = ''
    if (probeNotes.length) { notesBlock = `\n\nAddendum (verified facts earlier records missed; preserve each verbatim in the record):\n${probeNotes.map(l => `- ${l}`).join('\n')}`; raw += notesBlock }
    const shorterBase = rawRegion.length + notesBlock.length
    const id = CompactionId(`trisoul-${session.seq}-${Date.now().toString(36)}`)
    // 实时模型配置：@trisoul/dsh-api 的统一/精细设置优先，缺席时退回静态配置
    let live
    try { live = this.ctx.bail('trisoul/ai-config', 'surgeon') } catch { live = undefined }
    const provider = live?.provider || this.cfg.provider || 'ark'
    const model = live?.model || this.cfg.model || 'deepseek-v4-flash'
    // 小作业档位：默认 'off'（0 思考省钱提速，仅当该路由声明 off 档才传）；config.effort='inherit' 保持旧行为（不传）
    const reasoningEffort = (this.cfg.effort ?? 'off') === 'off'
      ? await smallJobEffort(this.ctx, provider, model)
      : undefined
    const startEvent = session.append('compaction/start', { compactionId: id, turn: null })
    try {
      let text = ''
      const stream = this.ctx.llm.stream({
        provider, model,
        purpose: 'trisoul-surgery',
        ...(session.id ? { sessionId: session.id } : {}), // 监控按会话归因
        ...(reasoningEffort ? { reasoningEffort } : {}),
        // 输出上限默认不设（提供方/适配器默认；2026-08-18 用户令）——原文全量进原料后纪要可能很长，
        // 推理模型的思考 token 也计入 max_output_tokens（曾以 900/4000 把纪要截空）；用户自设 cfg.maxTokens 才传
        ...(this.cfg.maxTokens ? { maxTokens: this.cfg.maxTokens } : {}),
        // ④ 归属式：纪要以做工作的第一人称口吻写（读到它的主模型会把它当自己的工作记录），并禁止提及压缩机制本身
        // 栏位化（2026-08-26，学自 CC 压缩摘要的固定栏模板，用户圈定）：自由散文改四栏——栏位即防丢清单
        // （错误配修法、决定带理由、未兑现计划单列）；「空栏跳过」防小区间被逼填空话。
        // B7（2026-08-25）三路收口规则原文并入 Not yet done 栏：C5 放行蒸馏块后原料里会出现「当时想定但
        // 还没干的计划」，压缩刀是这些计划唯一的代谢器官——不给收口规则，未兑现的计划要么被写成既成事实
        // （比丢掉更毒），要么被整段丢掉。
        system: 'You are a context condenser. Compress the following span of events into a faithful work record: keep key facts, numbers, file names, commands, and conclusions; drop process noise. Write it as the author of the work would for themselves — first person, stating what was done, seen, and decided. Structure the record under these headings, skipping any heading with nothing to report:\n'
          + '- Done: what was done and what came of it.\n'
          + '- Errors: each error or failure hit, paired with how it was resolved — or noted as still standing.\n'
          + '- Decisions: what was settled and why.\n'
          + '- Not yet done: some passages state a plan the author had settled on but had not yet carried out — handle each one: where a later step carried it out, write it as fact under Done; where it still has not been carried out, keep it in the record and mark it as not yet carried out; where a later step overturned it, say what replaced it.'
          + (checkpoints.length ? '\nParagraphs marked [checkpoint] are records left by earlier condensations (already compressed): merge them with the rest into one record — deduplicate, lose no facts, do not copy verbatim.' : '')
          + '\nWrite the record in English; keep load-bearing verbatim details — error messages, commands, quoted user wording — in their original language. Never mention this condensation, checkpoints, or any tool. Output the record only.',
        messages: [createUserMessage({
          content: [{ type: 'text', text: raw }],
          source: { kind: 'plugin', plugin: 'trisoul-surgeon' },
        })],
        ...(signal ? { signal } : {}),
      })
      let truncated = false
      for await (const c of stream) {
        if (c.type === 'text-delta') text += c.text
        else if (c.type === 'finish') {
          const kind = c.reason?.kind
          if (kind === 'error' || kind === 'aborted') throw new Error(`TriSoul surgeon: 纪要生成失败 ${c.reason?.failure?.code ?? kind}: ${c.reason?.failure?.message ?? ''}`)
          if (kind === 'max-tokens') truncated = true
        }
      }
      if (!text.trim()) throw new Error(truncated
        ? `TriSoul surgeon: 纪要为空（输出被 maxTokens${this.cfg.maxTokens ? `=${this.cfg.maxTokens}` : '（提供方默认）'} 截断），拒绝用空检查点替换区间`
        : 'TriSoul surgeon: 纪要为空，拒绝用空检查点替换区间')
      if (truncated) this.ctx.logger?.warn('trisoul-surgeon: 纪要在 maxTokens 处被截断，检查点可能不完整')
      // 「seq <lo>..<hi>」是与记忆中枢的契约标记：trisoul_recall 靠它发现被压区间、按 seqRange 回捞原文
      //（按区间成员 seq 的最小/最大值——位置序区间里替换者 seq 可能更大，回捞按 seq 取原文，宁多勿少）
      const shadowedSeqs = region.map(e => e.seq)
      // 被压区间 = 区间事件 seq ∪ 旧检查点各自的被压区间（P1-2：合并后 recall 仍能按头部区间回捞到最早的原文）
      const covered = [...shadowedSeqs, ...checkpoints.flatMap(c => c.lo !== undefined ? [c.lo, c.hi] : [])]
      const lo = Math.min(...covered), hi = Math.max(...covered)
      // 首行给模型回捞线索（#7）：工具名 + 调法；「seq a..b」字样保留（dsh-api 压后回捞判定用 surgery 事件区间，不靠文案）
      const header = `[Work record · seq ${lo}..${hi}] Condensed from your own earlier work in this session — treat it as done and continue; don't redo or restate it. For verbatim details condensed away, call trisoul_recall with {"query":"what you need","seqRange":{"start":${lo},"end":${hi}}}.`
      let body = text.trim()
      // 不变量（P1-4，2026-08-19 取证：74 刀里 16 刀检查点比原文长、一刀 50731 字是照抄原文）：
      // 检查点文本必须短于渲染后的原文（不含 reasoning）——否则这刀只增不减。违反 → 中枢预压缩稿兜底（非空且更短），
      // 再不行就拒绝这刀（原文留在表面，等区间长大 / 合并后再压）。cfg.requireShorter=false 回到旧行为（A/B 对照）。
      if ((this.cfg.requireShorter ?? true) && `${header}\n${body}`.length >= shorterBase) {
        if (draft && `${header}\n${draft}`.length < shorterBase) {
          this.ctx.logger?.warn(`trisoul-surgeon: 纪要 ${body.length} 字不短于原文${notesBlock ? '+补记' : ''} ${shorterBase} 字，改用记忆中枢预压缩稿（${draft.length} 字）作检查点`)
          body = draft
        } else {
          throw new Error(`TriSoul surgeon: 纪要 ${body.length} 字不短于原文${notesBlock ? '+补记' : ''} ${shorterBase} 字（无更短的中枢稿可兜底），拒绝这刀`)
        }
      }
      const summary = [{ type: 'text', text: `${header}\n${body}` }]
      // 被遮蔽区间的 token 计价：必须等于 token-meter 对被移除活表面各节点的 estimateMessage 之和。
      // 先前用 Math.ceil(raw.length/4)——既和 meter 算法不同（漏每块/每条 +4），又剔除了被顺路清走的
      // 已换代状态区/补注旧版节点（它们仍是活表面节点，fold 照扣）——两处系统低估让投影 messageTokens
      // 逐刀漂成负（2026-08-24 实测 -92391 撑爆历史加载 schema）。这里逐活节点计价（node tokens，fold 计价价），
      // region 即被遮蔽的全部活节点（含顺路清走项）。
      const shadowedTokenCount = region.reduce((sum, e) => sum + estimateMessageTokens(deriveEventMessage(e)), 0)
      const shadowedRange = { start: opStart, end: opEnd }
      const summaryEvent = session.append('compaction/summary', {
        compactionId: id, summary,
        shadowedRange, shadowedSeqs, shadowedTokenCount,
        provider, model, rawOutput: summary, llmStreamCall: true,
      })
      const checkpoint = createUserMessage({ content: summary, source: compactCheckpointSource(id) })
      session.append('user/message', checkpoint, {
        surfaceOp: { op: 'replace', start: opStart, end: opEnd },
        sourceEventSeqs: [startEvent.seq, summaryEvent.seq, ...shadowedSeqs],
      })
      const endEvent = session.append('compaction/end', { compactionId: id, turn: null })
      return {
        compactionId: id,
        startSeq: startEvent.seq, summarySeq: summaryEvent.seq, endSeq: endEvent.seq,
        summary, shadowedRange, shadowedSeqs, shadowedTokenCount,
      }
    } catch (error) {
      session.append('compaction/end', { compactionId: id, turn: null, error: String(error) })
      throw error
    }
  }
}
