// TriSoul 共识插件（三魂表决制 v2）
// 拦截 llm/stream 瀑布：仅对主循环请求启动多体共识。
// 【v2 流程】（2026-08-21 定稿 + 2026-08-22 补枪定型，见 CONTRACT.md 共识条目）：同一请求换 provider/persona N 路盲写
// （交稿走 submit_draft 工具：蒸馏思考拆 BDI 三格 findings/plan/action + 预输出 output（2026-08-25 换芯，
//   见 submitDraftToolSchema）；内层取证循环多轮照旧；缺封皮 → 同上下文单工具补枪，不重写全稿）
// → 匿名表决一次（每魂 1 票、只投别人；salvage 自陈「我有什么可补充」= tips 闸门）
// → 胜稿放行（重放剥 raw reasoning；收官步 thinking 折进 reasoning 块、output 做正文，均取自工具参数）
// → 有 claim：工具步挂账、下一次同会话请求胜者独走吸收 tips；收官步放行前胜者补一轮。
// 平票轮换定胜者；融合稿、批准票、收编修订、选票截断均已删除（2026-08-22 文本两段式改工具交稿）。
// 胜者块放行时 tool-call 结构零破坏。
// 【三魂 effort】（2026-08-21 用户纠偏定稿）：对齐/博识/实证是三张魂不是审稿官——档位由 dsh-api 经 trisoul/souls
// 直接套在前三魂的 persona 上（off=库内老表人设，轻/标准/猛=补偿人设全文覆盖），本插件零改动零感知。
// （历史注：8ea08ec/f799d74 曾做成「主笔盲写+三官审计门禁」，与用户意图相悖，已整条拆除。）
// 主循环判据：无 purpose 字段（一切辅助调用——压缩/标题/本插件自身——都带 purpose），
// 故本插件零依赖，也无拦截递归（我们的辅助调用带 trisoul-* purpose 直接穿透；
// 全员失联时的单路兜底走主路由、无 purpose，用 PASSTHROUGH 标记防止重入自己）。
//
// 循环状态机（每个主循环请求 = 一个 turn）：
//   start → 盲写 N 稿（draft，submit_draft 工具交稿。两段收稿是常态而非故障：真动作放行在表决之后，
//     结果不可能在本轮回来，模型按 agent 天性调完动作即收流 → 第二段单工具补交封皮（kind:'staged'；
//     旧版真机 171 步会话实测 385 稿中 379 走这条）；调了交稿但三格有空 = 真坏稿 kind:'blank'。
//     两者都走独立重试链，耗尽 → 该魂本轮失联。callSoul 重试逐次独立计数，盲写那份只留传输层真故障）
//     ├ 存活 0 → 单路兜底（PASSTHROUGH 主路由）        done{mode:'fallback', result:'all-dead'}
//     ├ 存活 1（配置多魂死剩一个）→ 直接放行            done{mode:'fallback', result:'single'}
//     ├ 存活 1（配置态单魂，2026-08-27 放开）→ 直接放行  done{mode:'single',   result:'single'}（正常形态非降级）
//     ├ 指纹一致 → 免表决放行候选 1                     done{mode:'winner',   result:'identical'}
//     ├ 近似一致（P2-4：工具调用语义相同+正文相似度超阈）→ 免表决放行正文最长稿  done{result:'identical', near:true}
//     └ 表决 round 1（每魂 1 票、只投别人：候选卡 = 其余 N-1 份匿名乱序候选 + 自己稿对照区）
//         ├ 票数最高（含 2 魂互相放行）→ 放行            done{mode:'winner', result:'winner'}
//         ├ 全员弃权（超时/解析失败）→ 按轮次轮换取一份  done{mode:'winner', result:'winner', tie:true}
//         └ 平票（≥3 魂 1-1-1 环投；2 魂互不放行）→ 按轮次轮换取一份直接放行（无融合轮）
//   表决后：败魂非空 salvage = claim
//     ├ 胜稿含工具调用 → tips 挂账（per-session），下一次同会话请求 = 独走步：
//     │    不跑共识、单发胜者魂（tips=请求内末尾 user 直令，②），输出直接放行   done{mode:'solo', result:'solo'}
//     │    独走失败 → 丢弃 tips 回退正常共识步（本轮流按共识结果收尾，solo 事件带 error）
//     └ 胜稿无工具调用（收官步）→ 放行前胜者私有上下文补一轮（tips 同型），放行第二稿
//   放行：胜稿重放剥 raw reasoning 块；收官步（无真工具调用）thinking 折进 reasoning 块（非旁白）、output 做正文，
//   两段均取自 submit_draft 参数；工具步真工具调用照旧重放（submit_draft 是交稿通道不是动作，剥掉不重放）。
//   replayReasoning 开关（off=默认恒剥；latest=胜者 raw reasoning 折进历史一段，sanitize 只留最新一段，只活一轮）。
//   任何中途 return/throw → done{result:'aborted'}（start/done 必配对）
//
// 流协议约束（对齐 @deepseek-ai/dsh-llm rc.6 的 StreamChunk + llm-invariant 校验器）：
// - 一条流里 block index 不可重复：本插件的每个文本块与重放的胜者块都用递增 index
// - finish.reason 是对象 { kind: 'stop' | 'tool-calls' | 'max-tokens' | 'error' | 'aborted' }
// - usage 至多一次、必须在 finish 之前；finish 之后不能再有任何 chunk
// - ctx.llm.stream() 的适配器失败（含 NO_ADAPTER）不会 throw，而是以终止 finish{kind:'error'} 送达，
//   collect() 必须按 reason.kind 识别，否则失败稿会被当成「存活的空稿」
// - 共识旁白（盲稿/表决/独走）默认写进一个 reasoning 块（UI 折叠为思维链），正文只留胜稿；
//   trace 可选 'reasoning' | 'text' | 'none'（cordis config.trace，settings 层经 trisoul/consensus-config 热覆盖）
// - 旁白侧存（缺陷1，2026-08-24）：旁白 delta 只喂进行中视图，落库块另挂 note 暗字段装旁白全文——
//   表决过程刷新后不再零记录。暗字段天然不进模型（pi-ai 只读 block.text）、零 token（token-meter 同样只算 text），
//   见 closeNote 处的三条理由；session.jsonl 原样留存（dsh 全链路无 content 块 schema）
// - 旁白 reasoning 块的文本固定以 NOTE_MARK（'[TriSoul]'）开头。dsh 会把上一轮 assistant 的 reasoning 块
//   当 thinking 回灌给模型（pi-ai foreignAssistant reasoning→thinking），灵魂看到假思考会模仿输出 </think>，
//   所以每次发给灵魂/兜底路由的 messages 都先经 stripNoteBlocks() 剥掉旁白块（不可变复制，原消息不动）
// - 模型自身的 reasoning 块不进会话（release 重放时剥掉；replayReasoning=latest 时胜者 raw 思考折成
//   reasoning 块随消息进历史一段，sanitize 只留最新一条 assistant 消息里的那段、更早的剥掉——只活一轮）；
//   off（默认）= 恒全剥（stripOwnReasoning），历史里旧会话 resume 残留的自身思考也由它清掉
// - pi-ai 的 replayedAssistant 要求 replayState.blocks 数 == 消息块数且 provider/model 与消息 source 一致：
//   只要本流发过旁白块、或胜者路由 ≠ 主路由、或胜者带 raw reasoning 块（重放被剥）、或胜者出自私有上下文
//   （收官补一轮的 tips 直令 / 取证轮），重放时必须剥掉 replayState 走 foreignAssistant 正门，
//   否则下一轮 INVALID_REPLAY_STATE；同理 stripNoteBlocks 剥块后也一并剥 source.replayState
// - 超时：每次灵魂调用（draft/vote）都带两档超时——soulIdleTimeoutMs（默认 60s 无新 chunk 判失联，
//   每来一块重置）+ soulTimeoutMs（默认 15m 总上限，兜底）。Ark 流会挂起不结束，
//   collect() 用 AbortController 合并上游 signal + 定时器，并对 iterator.next() 做 race——
//   即使适配器无视 signal 也能把调用拉出来。draft 超时 = 该魂本轮失联、其余存活者继续；
//   vote 超时 = 弃权；独走步超时/重试沿用同一组参数
// - 表决公平：各稿（文本 + 工具调用参数）完全一致免表决；每个投票者只看别人的稿（不含自己那份，防只投自己），
//   顺序按种子(投票者名#轮次) 确定性打乱再映射回真实候选；平票按轮次轮换；选票不出现灵魂身份；
//   选票只问「哪一份可以原样作为这一步的回复直接放行」（不列缺陷）；解析失败/超时 = 弃权
// - 小作业档位：表决(vote) 默认请求 reasoningEffort 'off'（0 思考，省钱提速），
//   经 smallJobEffort() 能力门控——只有该路由声明了 off 档才传，否则 undefined（提供商默认）。
//   consensus-config 可配 voteEffort（'off'|'inherit'，默认 'off'）。盲写/独走/收官补一轮继承主请求的档位与 tools
// - 灵魂调用的 purpose 统一 `trisoul-draft/<name>` / `trisoul-vote/<name>`：@trisoul/dsh-api 按段归因灵魂用量
// - 动态灵魂列表：每轮开始 `ctx.bail('trisoul/souls')` 取 @trisoul/dsh-api 的实时列表（用户可增删），
//   undefined 或可用条目 0 时退回 cordis 静态 souls（静态路径保留逐魂 trisoul/ai-config 覆盖）；1 条 = 单魂模式
// - trisoul/consensus 事件 phase 集合固定 {start, draft, vote, tips, solo, done}（dsh-api 聚合按此分派）：
//   tips = 表决后谁 claim 了什么（dest: 'solo' 挂账独走 | 'final' 收官补一轮）；solo = 独走步执行（胜者魂、tips 数、耗时）；
//   done.result ∈ {identical, winner, solo, failed, single, all-dead, aborted}；single 双态：mode:'single'=配置态单魂（正常）/ mode:'fallback'=多魂死剩一个（降级）
//   过程相位 {inner, retry, mend} 只走内存供排查（mend = 缺封皮补枪：draftInfo.mend 同步带 reason/attempts）

import { execFile } from 'node:child_process'
import { existsSync, realpathSync } from 'node:fs'
import { resolve as resolvePath, join as joinPath, sep as pathSep } from 'node:path'
import { smallJobEffort } from './effort.mjs'
export { smallJobEffort } from './effort.mjs'

export const name = 'trisoul-consensus'
// agents/tools：内层工具（辩论期取证）要用 ctx.agents.get(sessionId) 拿到主 agent、ctx.tools.execute 跑只读工具
//（dsh 的 cordis 只认数组 / name→config 映射，没有 optional 形态；这两个服务与 dsh-memory 同样是核心服务，web/headless 都有）
export const inject = ['llm', 'agents', 'tools']

/** 主循环默认配置（cordis 层给不到时的兜底；settings 层可在运行时覆盖，见 liveConsensusConfig）。 */
const DEFAULT_TRACE = 'reasoning'
const TRACE_MODES = new Set(['reasoning', 'text', 'none'])
/** 选票的输出上限：0 = 不设限（默认；选票就那么长，设上限只会把票截断成弃权/重试）；正数 = 自设上限（重试时按尝试序号放大） */
const DEFAULT_VOTE_MAX_TOKENS = 0
/** 单次灵魂调用（draft/vote）超时；Ark 流曾挂起 20 分钟不结束 */
// 超时两档：idle = 连续多久没有任何流式输出（含 reasoning-delta）就判失联——短任务不受长上限拖累、长输出只要还在吐字就不杀；
// hard = 单次调用总时长硬上限（兜底防无限输出）。真机反馈：一刀切 120s 会误杀长输出、调大又让短任务挂起太久
const DEFAULT_SOUL_IDLE_TIMEOUT_MS = 60_000
/** 思考熔断阈值（字符，0 = 关）。默认 20 万字 ≈ 真机失控病例（100 万字/24 分钟）的 1/5、正常思考链的几十倍——
 *  只拦失控不误伤深思考。上限类默认不设限是本仓纪律，此条是 2026-08-26 用户显式拍板的例外。 */
const DEFAULT_REASONING_FUSE_CHARS = 200_000
const DEFAULT_SOUL_TIMEOUT_MS = 900_000
/** 小作业（vote）默认档位：'off'（能力门控后请求 0 思考）或 'inherit'（继承主请求） */
const DEFAULT_SMALL_JOB_EFFORT = 'off'
/** 胜者 raw 思考回灌默认档：'off' = 恒全剥（现行为）；'latest' = 折进历史一段、只活一轮（v1 行为收窄版，用户自开） */
const DEFAULT_REPLAY_REASONING = 'off'
/**
 * 灵魂调用自动重试：真机常见「请求没反应」= 提供方偶发（Ark 流卡住/断流、5xx/429、网络抖动、空响应），
 * 一次失败就判失联太脆。失败后最多再试 soulRetries 次（总尝试 = retries+1）；
 * 退避 = backoff×2^(尝试-1)×[0.5,1.5) 全抖动——多魂同刻失败时把重试打散，避免齐刷刷再撞；
 * 限流/突发保护类（429/RequestBurstTooFast）基数再 ×3：提供方要的是流量爬坡，原速重撞必再被拒
 * （2026-08-25 真机病例：三魂并发盲写触发 Ark 突发保护，固定 1s 齐重试全灭）。
 * 只对「再试可能不同」的失败重试：空闲超时 / 流错误·断流 / 空响应 / 网络与限流；
 * 不重试：上游取消、总上限用尽、配置类错误（UNSUPPORTED_* / NO_ADAPTER / 4xx 鉴权与参数错）。
 * 表决额外：选票不含 JSON 或被输出上限截断 → 重试并按尝试序号放大 maxTokens（推理模型思考吃预算）。
 * 总时长受同一 soulTimeoutMs 约束（各次尝试共享剩余预算），不会因重试把一轮拖到几倍上限。
 * 另一半防线 soulStaggerMs：盲写/收官并发发起时按魂序错峰，压瞬时突发。
 */
const DEFAULT_SOUL_RETRIES = 2
const DEFAULT_SOUL_RETRY_BACKOFF_MS = 1000
const DEFAULT_SOUL_STAGGER_MS = 250
const RATE_LIMIT_RE = /\b429\b|RequestBurstTooFast|TooManyRequests|RateLimit|rate.?limit|burst/i
const RATE_LIMIT_BACKOFF_X = 3
/**
 * 内层工具（辩论期取证，⑬ 2026-08-23 瘦身）：只剩官位专属工具——align=task_original、erudite=web 透传、
 * empiric=run_verify；基础只读套（read/glob/grep/trisoul_recall）与预算闸（innerCalls/innerRounds/
 * innerResultChars/innerTotalChars）已整体拆除——通用取证归外层主循环（内层工具面与主 agent 重复，
 * 真机实测只会推高步数），结果照旧只喂回该灵魂私有上下文、其它灵魂看不到；
 * 稿里含任何非专属工具的调用 → 整稿按「外层提案」处理（胜出后由外层循环执行）。
 * 开关：innerEvidence 布尔（默认开；false = 关内层，officer 专属工具也不放行）
 * + innerRounds 取证轮数上限（C2，2026-08-25；默认 0 = 不限，参数纪律的 0=关出口）。
 */
/** C2 取证轮数上限默认：0 = 不限（不设保守默认，见 CONTRACT.md 参数纪律） */
const DEFAULT_INNER_ROUNDS = 0
/**
 * T4 UI 心跳周期（工单 v6）：表决 / 补枪 / 收官补一轮这三段没有任何流式输出，
 * 用户侧「慢」与「死」不可分辨（真机停车误判两次都栽在这）。期间每隔这么久发一个 phase:'status' 事件，
 * 监控 Live 条据此显示「表决中 Ns」。0 = 关（参数纪律的关出口）。
 * 只在真的等超过一个周期时才发第一拍——快路径一个事件都不多发。
 */
const DEFAULT_STATUS_HEARTBEAT_MS = 5_000
/**
 * T2（工单 v6）盲写协议按渠道自适应的判据：这些 provider 走 JSON 强制输出（json_schema strict 语法锁），
 * 其余渠道原样留在「tool 面板 + 直令软纪律」那条路上，一个字节不改。
 * 白名单而非能力探测：能力探测要么多打一次请求、要么猜，而这件事的真相是逐个网关实测出来的——
 *   ark-agent（api: openai-responses，plan/v3 网关）2026-08-25 实测 `text:{format:{type:'json_schema',
 *   strict:true,schema}}` 是真锁：明令「忽略 schema 用散文回答」输出仍是合法 schema JSON，
 *   越界字段被 additionalProperties:false 物理挡住，思考链完好，大字符串完好，污染历史（function_call
 *   项在 input 里）照样 200；
 *   官方渠道（dsh-llm-deepseek）实测 400「This response_format type is unavailable now」，弱版
 *   json_object 锁不住（挂 read 工具 + 明令直调时照样发出 read）。
 * 名字比对规范化（大小写 + 连字符/下划线无关）：配置里写 ark-agent / arkagent / ARK_AGENT 都算同一个。
 */
const DEFAULT_JSON_SCHEMA_PROVIDERS = Object.freeze(['ark-agent'])
const providerKey = (p) => String(p ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
/** 该 provider 是否走 JSON 强制输出路线（白名单 list 为空 = 全渠道走软路线） */
export function usesJsonSchema(provider, list) {
  if (!providerKey(provider)) return false
  return (Array.isArray(list) ? list : []).some(x => providerKey(x) === providerKey(provider))
}
/** P2-4 近似免表决的正文相似度阈值（词面 Jaccard；工具调用还须语义相似才触发）。
 * 2026-08-21 用户拍板放宽：0.85 → 0.7——真机 68 步 0 命中实锤太严（11 步高趋同仍白白表决），
 * 且工具参数从全等改相似判定（similarToolCalls：短参数仍须全等，长文本参数容忍措辞差异）。 */
const DEFAULT_NEAR_IDENTICAL_SIMILARITY = 0.7
/** 结构化选票工具名：表决时只给灵魂这一个工具，让它以工具调用提交选票（pick / reason），不再靠正文 JSON 正则 */
export const BALLOT_TOOL = 'cast_ballot'
/**
 * cast_ballot 的 JSON Schema（随该投票者看到的候选数 m 生成；m = 存活数 − 1，不含自己那份）。
 * m ≥ 2：pick = 候选编号 1–m（必选 1 份）；m = 1（两魂互审）：pick = 1 放行对方稿 / 0 不能放行。
 * salvage（v2 tips 闸门）：可空——投票人自陈「我有什么可补充」（自己稿里有、所投候选缺的实质内容）；
 * 非空 = claim，触发胜者吸收（工具步 → 下一步独走；收官步 → 放行前补一轮）。
 */
export function ballotToolSchema(m) {
  const single = m === 1
  return {
    name: BALLOT_TOOL,
    description: single
      ? 'Cast your ballot (TriSoul vote): there is only one candidate (the other draft) — can it ship as-is as the reply for this step? Yes → pick=1; no → pick=0.'
      : `Cast your ballot (TriSoul vote): out of the ${m} candidates, pick the one that can ship as-is as the reply for this step (candidate number 1–${m}).`,
    parameters: {
      type: 'object',
      properties: {
        pick: { type: 'integer', minimum: single ? 0 : 1, maximum: m, description: single ? '1 = release this candidate; 0 = cannot release' : `an integer: the candidate number, 1–${m}` },
        reason: { type: 'string', description: 'One-sentence reason' },
        salvage: { type: 'string', description: "Optional: substantive content your own draft has that the candidate you picked lacks (a concrete finding / evidence result / risk) — one or two factual sentences; empty string if none" },
      },
      required: ['pick', 'reason'],
    },
  }
}
/**
 * 盲写交稿工具名。交稿走工具 schema + 缺封皮补枪（2026-08-22 探针定型，实录 scratchpad/probe-*.mjs）：
 * ark plan/v3 网关对 tool_choice / strict / json_schema 全线静默无视（对抗测试照写散文）——解码级强制在
 * 该网关上不存在；但「单工具 + 直令交稿」实测依从近乎必中、四格全填非空。所以强制力来自结构而非参数：
 * 盲写流结束缺封皮 → 同上下文单工具补枪（不重写全稿），补枪重试耗尽才失联。
 */
export const SUBMIT_TOOL = 'submit_draft'
/**
 * submit_draft 的 JSON Schema（BDI 四格定稿，2026-08-25 用户逐字锤定 B1/B2）：findings/plan/action + output。
 * 换芯理由（两缺陷，用户发现）：旧 reasoning/rejected 只装「已经想明白的」与「排除掉的」，
 * **模型这一步想定的下一步方案（文件怎么组织、函数怎么写、参数取什么值）无处可放 → 过了这一步就蒸发**；
 * 且 rejected 把「排除」单列，反而把「否决路线」从查明的事里割出去（排除污染）。
 * BDI 锚：findings=信念（这一步新查明的事）、plan=意图（接下来打算怎么干）、action=动作（此刻这一下）。
 * 拆格子是质量能吃到的最后一点结构强制——格子仅当有下游消费者「单独可取」才配存在
 * （plan=下一步接着用+书记官代谢+候选卡分格；action=显示层单拿+与执行栏咬合）。
 * 描述用目标语域写（原生 DS 思考体：缩写体/纯散文/反引号/行内轻词排除）——风格随 schema 牵引。
 * required 只保证键存在压不住空串 → 代码层 envelopeError 卡 findings/action 非空；
 * plan **可空**（宁空勿垫，垫料比空更毒）；output 允许空串（动作步动作即输出）。
 *
 * 隐藏工具栏（二期，2026-08-25 工单 v5）：动作不再直发——三个执行栏 actions/files/edits 收编一切外层动作，
 * 放行时后端合成真调用块。拆三栏的唯一标准=「谁带大段文字谁提浅层」：大字符串埋三层深（actions[i].
 * arguments.content）2.2-2.7k 字符转义必崩（探针 40%→20%），提顶层浅层 14/14 全完好——嵌套深度病非长度病；
 * 真机 write 9/18 超崩溃区、edit 已踩线 2373。actions 的 name enum 运行时动态生成自宿主工具集
 * （剔 write/edit——被 files/edits 顶替；剔豁免面板工具）。actionTools 不传（补枪单工具场）= enum 不限。
 */
/** 四格封皮的字段说明（两条路线共用一份原文：tool 面板路线进 submit_draft 参数说明，
 *  JSON 路线进 json_schema 的属性说明——同一段话喂同一个模型，没有理由分叉，分叉了迟早对不上）。 */
const ENVELOPE_DESC = Object.freeze({
  findings: "What you newly established this step — what you observed, what the results told you. Written as yourself mid-task, not a reporter summarizing someone else: open on the finding — 'Turns out …', 'Looking at `server.js`, …'. Code entities in backticks; error messages and measured values verbatim. Facts land once, in the step that established them — never retell earlier findings or restate the task. Empty when nothing new has come in yet (e.g. the first step, before any results). Prose only, no lists.",
  plan: "How you'll proceed after this step, at whatever depth you've actually thought it through — when you've already settled the design, write it out in full, key code included: thinking not recorded here is gone when the step ends. No need to re-paste code that ships in files/edits this step. Only what you newly settled or changed; empty when the plan you already recorded still stands — never pad.",
  action: "The one concrete move you're making right now, matching your actions/files/edits — a bare -ing phrase ('Fixing the harness loop…') or 'Now I'll …'. One sentence, no hedging, nothing beyond this move.",
  // 假收官停车修复（2026-08-27 用户拍板）：终局不是步骤属性是提交属性——「零条目提交=收官」的判定规则
  // 写进模型面，豁免钉死在「执行栏有条目」上，禁进行时收笔。软路线 08-24 同病药在 BRIDGE_TRAILER；
  // JSON 路最小核撤直令后无同款药，真机独走步取证失败后以 Verifying… 收笔即此病复发。
  output: "The prose delivered to the user for this step. Empty only when the execution fields carry entries — the executed actions are themselves the output. A submission with nothing queued to execute closes the turn, and this field is then the complete answer: open with the outcome itself — the sentence the user would ask for as the TLDR — then supporting detail; say plainly what remains unverified — never close on an in-progress sentence, and if a check still needs to run, queue it in the execution fields instead; nothing load-bearing may live only in findings.",
})
/** 工具清单 → 「{"name":"read","arguments":{file_path, limit}} — 一句话说明」的动作说明书行（两条路线共用） */
const toolLine = (t) => {
  const keys = Object.keys(t?.parameters?.properties ?? {})
  const first = (String(t?.description ?? '').split(/(?<=[.!?])\s/)[0] ?? '').slice(0, 160)
  return `{"name":"${t.name}","arguments":{${keys.join(', ')}}}${first ? ` — ${first}` : ''}`
}
const namedTools = (list) => (Array.isArray(list) ? list.filter(t => t?.name) : [])
/** 最小核（2026-08-26）：JSON 路的工具说明书——CC 式「说明书随工具走」，但咱们的工具是 sub 里的条目、
 *  没有独立工具对象，说明书的家就在 actions/lookup 字段的 description 里。每件一行：全量工具说明 +
 *  参数全列（必填带 *、逐参数说明取自宿主 schema），不截断。软路线的 toolLine 原样冻结。 */
const toolManual = (t) => {
  const props = t?.parameters?.properties ?? {}
  const req = new Set(Array.isArray(t?.parameters?.required) ? t.parameters.required : [])
  const params = Object.entries(props).map(([k, p]) => {
    const d = String(p?.description ?? '').trim()
    return `${k}${req.has(k) ? '*' : ''}${d ? ` (${d})` : ''}`
  }).join(', ')
  const desc = String(t?.description ?? '').trim()
  return `- ${t.name}${desc ? ` — ${desc}` : ''}\n  arguments: ${params || 'none'}`
}
/** 空调用判定（2026-08-25 用户令「不应该是填 null 才不执行,空的应该也是不执行」；真机二犯
 *  web_search({"queries":[]}) 空参白烧取证轮）：required 参数缺失或值为空（空串/空数组/空对象）
 *  = 空调用。false/0 是值不是空；拿不到 schema 或无 required（task_original）保守放行。 */
export function emptyRequiredArgs(tool, args) {
  const req = Array.isArray(tool?.parameters?.required) ? tool.parameters.required : []
  const a = (args && typeof args === 'object' && !Array.isArray(args)) ? args : {}
  const isEmpty = (v) => v == null || (typeof v === 'string' && v.trim() === '')
    || (Array.isArray(v) && v.length === 0)
    || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0)
  return req.some(k => isEmpty(a[k]))
}

export function submitDraftToolSchema(actionTools) {
  const tools = namedTools(actionTools)
  const names = tools.map(t => t.name)
  const available = tools.length ? ` Available: ${tools.map(toolLine).join(' ')}` : ''
  return {
    name: SUBMIT_TOOL,
    description: 'Submit your work for this step — your only delivery channel; every reply must include this call. Everything you want executed goes in its actions/files/edits fields — tool calls issued directly are NOT executed; they are discarded. Not calling this tool means this step produced nothing. Length tracks difficulty: a trivial step is one sentence, a hard step can run long. Never pad.',
    parameters: {
      type: 'object',
      properties: {
        findings: { type: 'string', description: ENVELOPE_DESC.findings },
        plan: { type: 'string', description: ENVELOPE_DESC.plan },
        action: { type: 'string', description: ENVELOPE_DESC.action },
        output: { type: 'string', description: ENVELOPE_DESC.output },
        actions: { type: 'array', description: `Operations to execute for this step, in order — entries here, not separate tool calls.${available} File writes never go here — whole files go in the files field, in-place modifications in edits. Executed after release; results arrive next step. Empty array when this step needs no execution.`, items: { type: 'object', properties: { name: { type: 'string', ...(names.length ? { enum: names } : {}) }, arguments: { type: 'object' } }, required: ['name', 'arguments'] } },
        files: { type: 'array', description: 'Files to create or overwrite this step — each entry is {"path": …, "content": the complete file text, never abridged}. Executed after release; results arrive next step.', items: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] } },
        edits: { type: 'array', description: 'In-place file modifications this step — each entry is {"path": …, "old_string": the exact text to replace, verbatim, "new_string": its replacement}. Executed after release; results arrive next step.', items: { type: 'object', properties: { path: { type: 'string' }, old_string: { type: 'string' }, new_string: { type: 'string' } }, required: ['path', 'old_string', 'new_string'] } },
      },
      required: ['findings', 'plan', 'action', 'output'],
    },
  }
}
/** JSON 路线的 schema 名（json_schema.name，网关侧只是个标识） */
export const DRAFT_SCHEMA_NAME = 'trisoul_draft'
/**
 * T2 盲写 JSON schema（strict）：四格 + 三栏 + evidence，与 submit_draft 的参数一一同构——
 * 两条路线交出来的稿是同一个形状，收稿后的一切（指纹/免表决/表决/放行合成/监控）零分叉。
 * strict 的硬要求：每层对象都要 additionalProperties:false，且每个属性都必须列进 required
 * （「可空」靠空串 / 空数组 / null 表达，不靠缺字段——缺字段在 strict 下根本发不出来）。
 * evidence（取证请求，nullable）是 JSON 路独有的：面板上没有工具，模型物理上发不出调用，
 * 想取证只能填这个字段——填了=插件当场执行并把结果喂回、再来一轮；null=交稿。
 * 「二选一」从此铸在语法里，不再靠嘴（直令仍在，但它不再是唯一防线）。
 * actionTools 空 → name 不带 enum（补枪单工具场同款处理）；evidenceTools 空 → 整个 evidence 字段不出现
 * （枚举为空的字段是发不出合法值的死字段，不如不给）。
 */
export function draftJsonSchema(actionTools, evidenceTools) {
  const tools = namedTools(actionTools)
  const names = tools.map(t => t.name)
  const available = tools.length ? ` Available: ${tools.map(toolLine).join(' ')}` : ''
  const ev = namedTools(evidenceTools)
  // 最小核重构（2026-08-26）：字段语义唯一的家就是这里——教学段/纪律段/直令全部退场，
  // 形状由 strict 语法锁保证，每个字段一句事实描述。模型面四格 findings/plan/move/reply（下方 properties 即事实源）；
  // 内部规范形 findings/plan/action/output（normalizeSubmit 映射）。
  const manual = tools.length ? `\nAvailable (* = required argument):\n${tools.map(toolManual).join('\n')}` : ''
  // 四格回装（2026-08-26 用户令「要以前那种风格」）：单格 note 真机两轮证明招糊（复述任务+意图糊团），
  // 恢复 findings/plan/move 三格+reply，描述用 ENVELOPE_DESC（用户锤定的 BDI 版，自带禁复述与具体事实药）。
  // 其余最小核不动：直令零、教学段无、非空强制不恢复。note/output 旧键 normalizeSubmit 兼容照收。
  const properties = {
    findings: { type: 'string', description: ENVELOPE_DESC.findings },
    plan: { type: 'string', description: ENVELOPE_DESC.plan },
    move: { type: 'string', description: ENVELOPE_DESC.action },
    reply: { type: 'string', description: ENVELOPE_DESC.output },
    actions: { type: 'array', description: `Commands and reads to run for this step, in order — each entry is {"name": …, "arguments": {…}}. They run after you submit; results arrive in your next message. Empty when none.${manual}`, items: { type: 'object', properties: { name: { type: 'string', ...(names.length ? { enum: names } : {}) }, arguments: { type: 'object' } }, required: ['name', 'arguments'], additionalProperties: false } },
    files: { type: 'array', description: 'Files to create or overwrite — each entry is {"path": …, "content": the complete file text, never abridged}.', items: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'], additionalProperties: false } },
    edits: { type: 'array', description: 'In-place file changes — each entry is {"path": …, "old_string": the exact text to replace, verbatim, "new_string": its replacement}.', items: { type: 'object', properties: { path: { type: 'string' }, old_string: { type: 'string' }, new_string: { type: 'string' } }, required: ['path', 'old_string', 'new_string'], additionalProperties: false } },
  }
  if (ev.length) {
    properties.lookup = {
      type: 'array',
      description: `One lookup call, executed immediately — its result comes back to you within this step. When you fill lookup, leave every other field empty. Empty when unused.\nAvailable (* = required argument):\n${ev.map(toolManual).join('\n')}`,
      items: { type: 'object', properties: { name: { type: 'string', enum: ev.map(t => t.name) }, arguments: { type: 'object' } }, required: ['name', 'arguments'], additionalProperties: false },
    }
  }
  return {
    name: DRAFT_SCHEMA_NAME,
    strict: true,
    schema: { type: 'object', properties, required: Object.keys(properties), additionalProperties: false },
  }
}
/**
 * 给盲写请求挂 json_schema 硬锁的 payload 改写钩子（Responses API 的 `text.format`）。
 * 走的是 pi-ai 原生的 onPayload 钩子；dsh 桥默认把它吃掉，靠 scripts/patch-dsh-bridge.sh 放行。
 * 桥没打补丁 = 钩子递不进去 = 锁不上（但请求照发、软纪律仍在），不会炸——降级而非故障。
 */
export function jsonSchemaPayload(schema) {
  return (params) => ({ ...params, text: { format: { type: 'json_schema', ...schema } } })
}
/**
 * 四格拼合成对外的蒸馏思考正文（历史常驻块 / 候选卡 / 旁白 / tips 共用一个形态）。
 * 拼装零缝合词（固定字样重复=学舌源，8.6% 机制话渗入教训）：纯 \n\n 段落拼接、空格脱落、无标签；
 * 顺序 findings → plan → action（信念→意图→动作，BDI 序）；plan 可空（filter 后 join）。
 */
export function composeThinking({ findings, plan, action }) {
  return [findings, plan, action].map(s => String(s ?? '').trim()).filter(Boolean).join('\n\n')
}
/** 封皮校验：没交 / findings 或 action 空 → 返回错误文案（交补枪 validate / 触发补枪）；plan 可空；合格 → undefined */
export function envelopeError(sub) {
  if (!sub) return '缺蒸馏封皮：流结束未调用 submit_draft 交稿'
  if (!sub.findings.trim()) return '蒸馏封皮 findings（发现）为空'
  if (!sub.action.trim()) return '蒸馏封皮 action（行动）为空'
  return undefined
}
/**
 * 短 raw 直通阈值（①，2026-08-23）：raw 思考短于它（原生 p25≈310 字符）就原样入历史、不换蒸馏拼合文——
 * 零失真零成本；长 raw 才换三格拼合的蒸馏块。
 */
export const SHORT_RAW_CHARS = 400
/** 蒸馏思考块的标记字段值：block.trisoul === DISTILLED_TAG 的 reasoning 块常驻历史（sanitize 永不剥）。
 *  标记只活在块对象的 JSON 字段上（dsh 按 block-end 原样收块、structuredClone 全保真），模型只见 text。 */
export const DISTILLED_TAG = 'distilled'
// ---------- H 三官专属工具（2026-08-21：工具即人设——给纯认知职能物理锚点；与 D 成对：D 给表达位、H 给行动力）----------
// dsh-api 在档位 ≠off 时给魂下发 officer ∈ align|erudite|empiric，本插件按官在内层白名单加菜（专属排他）：
//   对齐 + task_original（会话用户消息原文清单——手术遮表面不删档，治「对照物被手术侵蚀」）
//   博识 + web_search / web_fetch（主请求工具透传；主请求没有 → 自动降级回基础套并旁白标注——评测 netjail 下绝不能联网，红线）
//   实证 + run_verify（一期最窄只读白名单：node --check / 项目本地 tsc --noEmit；真执行测试等 sandbox 二期）
// off 档无 officer 字段 = 白名单/提示零变化（老表对照基线一字节不动，红线）。
/** 对齐官专属：本会话用户消息原文清单工具名 */
export const TASK_ORIGINAL_TOOL = 'task_original'
/** 实证官专属：只读验证工具名 */
export const RUN_VERIFY_TOOL = 'run_verify'
/** 博识官透传的主请求联网工具名 */
export const WEB_TOOLS = Object.freeze(['web_search', 'web_fetch'])
export function taskOriginalSchema() {
  return {
    name: TASK_ORIGINAL_TOOL,
    description: "Returns the verbatim list of user messages in this session (including later additions, numbered with seq). Use it whenever a decision leans on exactly what the user asked — it puts the original wording right in front of you, instead of you reading from your own memory of it. The text comes from the full session log and is unaffected by context surgery.",
    parameters: { type: 'object', properties: {} },
  }
}
export function runVerifySchema() {
  return {
    name: RUN_VERIFY_TOOL,
    description: 'Run read-only verification on a file/project (never executes code): kind=node-check runs node --check for JS syntax (requires file); kind=tsc-noemit runs the project-local tsc --noEmit type check (optional cwd for a subproject directory).',
    parameters: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['node-check', 'tsc-noemit'], description: 'Verification kind' },
        file: { type: 'string', description: 'Required for node-check: path to the js/mjs/cjs file to check (relative to the session working directory)' },
        cwd: { type: 'string', description: 'Optional for tsc-noemit: project directory (containing tsconfig and node_modules/.bin/tsc), relative to the session working directory' },
      },
      required: ['kind'],
    },
  }
}
/** 对齐官 task_original 的输出：session 全量日志抽 source.kind==='user' 的原文（手术遮表面不删档，零成本） */
export function taskOriginalText(session) {
  const items = []
  for (const e of session.events) {
    if (e.type !== 'user/message' || e.data?.source?.kind !== 'user') continue
    const text = (Array.isArray(e.data.content) ? e.data.content : []).filter(b => b?.type === 'text').map(b => b.text ?? '').join('\n')
    if (text.trim()) items.push(`${items.length + 1}. [seq ${e.seq}] ${text}`)
  }
  return items.length ? `Verbatim user messages in this session (${items.length} total, newest last):\n${items.join('\n')}` : '(No user messages in this session yet)'
}
/** 路径围栏：realpath 后必须仍落在会话 cwd 内（按分隔符边界防 /repo-evil 过 /repo 前缀；
 *  realpath 防软链外逃——`node --check` 的语法报错会逐字回显出错行，围栏之外等于任意文件读）。
 *  不存在与越界统一返回 null。 */
function containedPath(cwd, p) {
  try {
    const root = realpathSync(cwd)
    const real = realpathSync(resolvePath(cwd, p))
    return real === root || real.startsWith(root + pathSep) ? real : null
  } catch { return null }
}
/** 实证官 run_verify：窄白名单只读检查。一期只有 node --check（不执行）与项目本地 tsc --noEmit。 */
export function runVerify(args, cwd, signal) {
  return new Promise((res) => {
    const done = (ok, text) => res({ ok, text })
    const kind = args?.kind
    try {
      if (kind === 'node-check') {
        const raw = typeof args.file === 'string' && args.file.trim() ? args.file.trim() : null
        if (!raw) return done(false, 'node-check requires a file argument')
        const file = containedPath(cwd, raw)
        if (!file) return done(false, `File not found (or outside the session working directory): ${raw}`)
        execFile('node', ['--check', file], { timeout: 60_000, cwd, signal }, (err, stdout, stderr) => {
          const out = `${stdout ?? ''}${stderr ?? ''}`.trim()
          done(!err, err ? (out || String(err.message ?? err)) : (out || `Syntax check passed: ${file}`))
        })
        return
      }
      if (kind === 'tsc-noemit') {
        // dir 围栏后，能执行的只剩「会话目录内某项目的 node_modules/.bin/tsc」＝跑该项目自己的依赖，
        // 与 tsc --noEmit 的本职同级；不对 tsc 二进制再做 realpath 围栏（pnpm 的 .bin 软链会指向仓库根 store，二次围栏误伤 monorepo）
        const dir = typeof args.cwd === 'string' && args.cwd.trim() ? containedPath(cwd, args.cwd.trim()) : cwd
        if (!dir) return done(false, `Directory not found (or outside the session working directory): ${args.cwd}`)
        const tsc = joinPath(dir, 'node_modules/.bin/tsc')
        if (!existsSync(tsc)) return done(false, `No project-local tsc (${tsc} does not exist) — run_verify only uses local dependencies, it never installs from the network`)
        execFile(tsc, ['--noEmit'], { timeout: 300_000, cwd: dir, signal, maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
          const out = `${stdout ?? ''}${stderr ?? ''}`.trim()
          done(!err, err ? (out || String(err.message ?? err)) : (out || 'Type check passed (tsc --noEmit, zero errors)'))
        })
        return
      }
      done(false, `Unknown kind: ${String(kind)} (available: node-check / tsc-noemit)`)
    } catch (e) { done(false, String(e?.message ?? e)) }
  })
}

/** 旁白块的稳定标记：所有 TriSoul 旁白 reasoning 块的文本都以它开头，下游据此剥离 */
export const NOTE_MARK = '[TriSoul]'
/** 本插件自己发起的、无 purpose 的主路由兜底请求：瀑布重入时直接穿透 */
const PASSTHROUGH = new WeakSet()

// ---------- 两段式盲写（v2：submit_draft 工具交稿，thinking/output 只从工具参数来）----------

/**
 * tips 消息（② 2026-08-23 定稿，独走步 / 收官补一轮共用）：败魂稿 + claim 汇成**请求内末尾的 user 直令**，
 * 不再注入 system 尾部——实测 tips 进 system 把独走步前缀缓存命中砸到 34.7%（共识步 75.9%，−41pp×53 步
 * ≈80 万 tok/场）；挪到消息尾 = system 与普通盲写字节级一致，前缀缓存照常命中。
 * 纪律：匿名（不出现灵魂/表决/胜者字样）、「平行时空的自己」框架语（同一模型并行推演，不预设对错）、
 * 明说有价值就吸收没价值就忽略且不得在回复中提及、只活在该次请求不进会话历史（阅后即焚）。
 * 免责改造（2026-08-24 用户锤定）：败稿动作从未执行（表决只执行胜者调用），但 output 常带「已完成」口吻，
 * 接收魂误当事实 → 头部点破「that timeline was not chosen, its output was never actually executed」+
 * 条目标签 Drafted output (never delivered) 逐条自带提醒。
 */
export function tipsMessage(tips) {
  // B5 终裁（2026-08-25 用户两裁）：败稿 plan 不单列、不标注——thinking 即四格拼合文（findings/plan/action），
  // plan 随之自然传递；头部「平行时空的你」框架语已足够定性，勿再夹带 Planned:/「未采纳」类形式。
  const list = tips.map(t => `— Memo (claims to add: ${t.claim})\nThinking: ${t.thinking}\nDrafted output (never delivered): ${t.output}`).join('\n\n')
  return mkMsg('tips', `A memo from you in a parallel timeline — that timeline was not chosen, and its output was never actually executed. What's worth keeping is the analysis and the leads; judge their merit yourself.\n\n${list}\n\nUse it only for this reply: fold in whatever holds up, ignore the rest, and don't mention this memo or where it came from.`)
}

/** 四格教学块（①②③三条直令共用；B3 四格行=B1/B2 短句版，action/output 照旧不动）。
 *  span（B8④ 两态，2026-08-25 用户锤定）：'this step'（①盲写开场）
 *  ｜'this step so far (including all evidence round-trips)'（②取证喂回/③兜底——取证轮数不定，不再数「两步」） */
export function submitFormatBlock(span, shared = false) {
  return `submit_draft format${shared ? ' (shared by both paths)' : ''}:
- findings (required): what you newly established for ${span} — the concrete facts and observations that drove the decision, including what the evidence told you if you dug for it; a path you ruled out and a suspicion you haven't verified count too; don't restate what's already established.
- plan (may be empty): your plan going forward — how you intend to proceed after this step, at whatever depth you've thought it through, key code included; what you don't record here is gone once this step ends. If there genuinely isn't one, leave it empty — never pad it.
- action (required): the one concrete move you're making right now, in one sentence, matching the entries in the execution fields; on a pure analysis step, state your conclusion.
- output (as needed): what you're delivering to the user — in the user's language; may be empty on a pure action step, but when there's something to say, say it plainly: what you did, what you saw, what you need next.
- actions / files / edits (may be empty): everything the system should execute for this step — commands and reads go in actions, whole-file writes in files (complete file text in content), in-place modifications in edits (exact old text plus its replacement); they match your action sentence. Leave them all empty when there's nothing to execute.`
}
/** 隐藏工具栏尾行（①②直令共用；探针 v3-v5 锤定三要素：后果句「直调不执行会被丢弃」+堵 shell 绕路+完整示例） */
const BRIDGE_TRAILER = `Execution entries go in the fields — never issue tool calls outside submit_draft; a directly issued call is NOT executed, it is discarded. Creating or overwriting a file = one entry in files (complete file text in content), modifying a file = one entry in edits — never via shell redirection or heredoc. Example shape:
submit_draft({"findings":"…","plan":"","action":"Reading the config to check the timeout.","output":"","actions":[{"name":"read","arguments":{"file_path":"src/config.mjs"}}],"files":[],"edits":[]})`
/** B8④ span 两态的第二态：取证喂回 / 补枪共用（覆盖本步至今的全部取证往返） */
const SPAN_SO_FAR = 'this step so far (including all evidence round-trips)'
/** 三官专属工具说明（①路径 1 括号内；先说是什么→为你而设点破自身缺陷→参数→何时用，
 *  根子对准五条小模型缺陷清单：对齐=指令遵循差/需求缩水，实证=推理天花板+幻觉不自知，博识=知识边界） */
export const DEDICATED_BLURBS = {
  align: `a tool for seeing the user's actual words. It exists because of you: as you work you drift — wandering off on your own reading, shrinking the requirements without noticing, and after context compression all you hold is a paraphrase. This tool puts the verbatim text of every user message in this session back in front of you — a numbered complete list, newest last, untouched by compression — so you can check what you're doing against the actual words for drift and shrinkage. No parameters; just call it`,
  empiric: `a tool for testing code against reality. It exists because of you: your multi-step reasoning goes wrong, you don't notice when it does, and re-checking in your head uses the same head — so don't verify with your mind, verify with reality: run one check and the result tells you directly whether you're right. Read-only, never executes code. kind is required, one of two: node-check — runs node --check on a js/mjs/cjs file you just wrote to catch syntax errors, requires file (relative to the session working directory); tsc-noemit — runs the project-local tsc --noEmit to catch type errors, cwd optionally points at a subproject. After writing code, before you say it's fine, call it`,
  erudite: `tools for filling knowledge gaps from the web. They exist because of you: your knowledge has a boundary, and facts beyond it written from memory are made up — without you noticing. These tools search / fetch web pages, turning "I don't know" into "it's in my context", replacing your memory with sourced facts. Parameters are on the tool panel. For any fact you're not sure of, look it up before writing it; finding nothing is a finding too — say so honestly`,
}
/** ① 盲写请求末尾·分岔直令（2026-08-23 夜定稿；2026-08-24 停车修复用户锤定——路径行明说「交稿+动作同回复」、
 *  尾行点破动作调用发在 submit_draft 之外：治「action 写了要干却不带调用→插件按无调用=收官放行」的假收官停车。
 *  只活在该次请求，不进会话历史。
 *  dedicated = { label, blurb }（该魂专属工具名与说明）；无官位/工具不可用 → 退化为只有路径 2+格式块。
 *  tips 步排 tips 之后恒为最后一条。 */
export function submitFirstOrder(dedicated) {
  const text = dedicated
    ? `This reply = one submit_draft call (plus your dedicated evidence tool if you need it). Two paths are open — pick one to decide your next move:
Path 1 — use ${dedicated.label} (${dedicated.blurb}) to dig deep for evidence — it is a real tool on your panel, executed immediately, results returning within this turn; once they return, use the submit_draft tool to directly output your thinking and output, putting everything to execute in its actions/files/edits fields.
Path 2 — use the submit_draft tool to directly output your thinking and output, putting everything to execute in its actions/files/edits fields.
${submitFormatBlock('this step', true)}
${BRIDGE_TRAILER}`
    : `This reply = one submit_draft call: use it to directly output your thinking and output, putting everything to execute in its actions/files/edits fields.
${submitFormatBlock('this step')}
${BRIDGE_TRAILER}`
  return mkMsg('submit-first', text)
}
/** ② 取证结果喂回时末尾·直令（仅路径 1 取证喂回后出现）。
 *  B8②（2026-08-25 用户锤定）：换与①同款二选一——路径 1 继续取证深挖 / 路径 2 交稿+动作。
 *  配合 C2 取证多轮化：喂回不再是「一轮即收稿」的单向命令，模型每轮自己决定继续挖还是收口
 *  （旧「两路固定节奏」拍板被推翻——真机混合稿防呆分支反复命中，就是它想续挖被掐的痕迹）。
 *  dedicated = { label }（该魂专属工具名；①已给过完整说明，这里不重复 blurb，每轮重灌会白涨输入）；
 *  拿不到专属工具名 → 退化为只有交稿一条路。 */
export function evidenceReturnOrder(dedicated) {
  const text = dedicated
    ? `This reply = one submit_draft call (plus ${dedicated.label} if you dig again). Two paths are open — pick one to decide your next move:
Path 1 — use ${dedicated.label} again to dig further into the evidence; once the new results return, use the submit_draft tool to directly output your thinking and output, putting everything to execute in its actions/files/edits fields.
Path 2 — use the submit_draft tool to directly output your thinking and output, putting everything to execute in its actions/files/edits fields.
${submitFormatBlock(SPAN_SO_FAR, true)}
${BRIDGE_TRAILER}`
    : `This reply = one submit_draft call: use it to directly output your thinking and output, putting everything to execute in its actions/files/edits fields.
${submitFormatBlock(SPAN_SO_FAR)}
${BRIDGE_TRAILER}`
  return mkMsg('evidence-order', text)
}
// ---------- T2 JSON 路线（最小核重构 2026-08-26）：教学段/纪律段/①②直令全部退场——
// 形状由 strict 语法锁保证，字段语义只住 draftJsonSchema 的 description（唯一的家）；
// 软路线那几段一个字不动，两条路各说各的。旧文案在 git（六次拍板链）与 promptlab 病例库。 ----------
/** JSON 路的取证结果回灌：面板上没有工具 → 没有 tool-call 可配对，结果只能以普通 user 消息喂回
 *  （软路线走 tool-result 块；这条路上发 tool-result 会留下孤儿 result，提供方直接 400）。 */
const evidenceResultMessage = (soul, stamp, r) => Object.freeze({
  id: `trisoul-evidence-${soul.name}-${stamp}`,
  role: 'user',
  content: Object.freeze([Object.freeze({ type: 'text', text: `Result of the lookup you requested — ${r.name}(${r.args})${r.ok ? '' : ' [failed]'}:\n\n${r.text}` })]),
  source: Object.freeze({ kind: 'plugin', plugin: 'trisoul-consensus' }),
})

/**
 * C1 步内带 raw（2026-08-25）：每段收流回灌该魂私有上下文时，思考非空就在 tool-result 之后
 * 附一条 user 消息把它自己本步的思考原文带回去。
 * 根因：assistantBlocksOf 只回灌 text + 真工具调用，reasoning 块被剥（块签名与外部上下文不匹配），
 * 于是「填表的那一发」看不见自己刚才想了什么——真机 staged 常态 379/385，填表者恒断片，
 * findings/plan 只能从已发的动作反推。
 * 纪律：只进同流私有上下文（extraMessages / mendMsgs），阅后即焚，绝不进会话历史（前缀缓存铁律）；
 * 表决不带；off 档没有思考 → 不附（off 档零变化红线）；放行进历史时 raw 照旧剥。
 * 代价：每次喂回/补枪多付一份 raw 的输入 token。
 */
const rawCarryMessage = (soul, stamp, raw) => Object.freeze({
  id: `trisoul-raw-${soul.name}-${stamp}`,
  role: 'user',
  content: Object.freeze([Object.freeze({ type: 'text', text: `Your own raw thinking so far this step, for you to pick up from:\n\n${raw}` })]),
  source: Object.freeze({ kind: 'plugin', plugin: 'trisoul-consensus' }),
})

/** ③ 兜底实答代填（B6，2026-08-25 换芯；2026-08-23 补枪三连废除——兜底 1 发后仍缺封皮不再重试、不再失联）：
 *  findings=模型实答（补枪回复的正文/思考，都空则退原稿的；全空走如实自述的兜底句），
 *  plan **恒空**——程序永不替模型编计划（编出来的计划下一步会被当成自己想定的，比空更毒）；
 *  B10（二期）：违规直调稿（动作发错位置已被剥丢）代填时 action 如实自述——不再有「Issuing the tool
 *  calls already sent」句式（直调不再执行，那句在二期是假话）；失联归零 */
export function autofillEnvelope(fin, md, violatedNames = []) {
  const said = String(md?.text ?? '').trim() || String(md?.reasoning ?? '').trim()
    || String(fin?.text ?? '').trim() || String(fin?.reasoning ?? '').trim()
  const findings = said || 'This step went straight to the actions; no findings were recorded.'
  const action = violatedNames.length
    ? `Issued ${violatedNames.join(', ')} outside the submission; the calls were discarded and nothing was executed this step.`
    : ((said.split(/(?<=[.!?。！？])\s*/)[0] ?? '').slice(0, 200).trim() || 'Continuing this step.')
  const grids = { findings, plan: '', action, output: '' }
  return { ...grids, thinking: composeThinking(grids) }
}

/**
 * T3 0 输出硬兜底（工单 v6；病例 f572f974「假完成」）：放行稿既没有可见正文、也没有一条可执行动作时，
 * 必须落一句用户可见的话——零输出结束永远不许发生。
 * 优先级：封皮 output（模型真话）→ action（它自己声明的这一下）→ 如实句。
 * 只在「无动作可放行」的收官形态上生效：有动作的步，动作本身就是用户可见的产出，不加话。
 */
export const ZERO_OUTPUT_NOTICE = 'This step produced no output and executed nothing.'
export function releaseText(output, action) {
  if (String(output ?? '').trim()) return String(output)
  if (String(action ?? '').trim()) return String(action)
  return ZERO_OUTPUT_NOTICE
}

/** 独走步挂账：sessionId → { winnerSoul, tips:[{claim,thinking,output}] }——表决后败魂 claim 触发，下一次同会话请求消费 */
const pendingTips = new Map()

export function apply(ctx, config = {}) {
  const souls = validateSouls(config.souls ?? [])
  if (souls.length < 1) {
    ctx.logger?.warn('trisoul-consensus: 配置 0 个灵魂，插件空载')
    return
  }
  let turn = 0
  /** 缺陷3（2026-08-24）旁白节流台账：sessionId → { officerLine }。在册 = 本会话已报过全量配置口径，之后只发短版；
   *  officerLine 记上次报过的专属工具配置，只有真变了才重报 [官位]（真机一场会话曾把这两行原样重复 22 遍）。
   *  与 turn 同为 apply 级状态：一个进程一个插件实例，行为等价于全局，但不跨实例串味。 */
  const notes = new Map()
  ctx.on('llm/stream', (options, next) => {
    if (options.purpose || PASSTHROUGH.has(options)) return next()
    turn += 1
    // 独走步：上一步挂账的 tips 未消费 → 本次请求不跑共识，单发胜者魂（消费点在共识体最前）；
    // 取走即消费——独走失败时 tips 已丢弃，同流内回退正常共识步
    const pending = options.sessionId != null ? pendingTips.get(options.sessionId) : undefined
    if (pending) pendingTips.delete(options.sessionId)
    return consensusStream(ctx, options, souls, config, turn, pending, notes)
  })
}

/** 配置错误要响亮：灵魂条目缺 provider/model 直接拒载，而不是运行时神秘失联。 */
function validateSouls(souls) {
  if (!Array.isArray(souls)) throw new Error('trisoul-consensus: config.souls 必须是数组')
  return souls.map((s, i) => {
    if (!s || typeof s !== 'object') throw new Error(`trisoul-consensus: souls[${i}] 必须是对象`)
    if (typeof s.provider !== 'string' || !s.provider) throw new Error(`trisoul-consensus: souls[${i}].provider 缺失`)
    if (typeof s.model !== 'string' || !s.model) throw new Error(`trisoul-consensus: souls[${i}].model 缺失`)
    return { ...s, name: String(s.name ?? String.fromCharCode(65 + i)) }
  }).map((s, i, all) => {
    // name 是稿件归属/计票/tips 挂账的唯一键，重名会把票和 salvage 静默挂到别的魂上——响亮拒载（B9）
    if (all.findIndex(x => x.name === s.name) !== i) throw new Error(`trisoul-consensus: souls 灵魂名重复：${s.name}`)
    return s
  })
}

// ---------- 去污染 ----------

/** 是否为 TriSoul 旁白块：⑪ 新形态 = 空 text + trisoul:'note' 标记；旧形态（存量转录）= 以 NOTE_MARK 开头的全文块，双认 */
const isNoteBlock = (b) => b?.type === 'reasoning' && (b.trisoul === 'note' || (typeof b.text === 'string' && b.text.startsWith(NOTE_MARK)))
/** 缺陷1 侧存的旁白暗字段（closeNote 挂在落库块上）：只给 UI 与 session 档案看，模型面/网络面一律剥——
 *  与 raw 暗字段同一条纪律。旁白装着三稿全文、逐票票据与胜者真身，匿名表决是红线，
 *  不能只靠「pi-ai 恰好只读 block.text」这一层挡着。 */
const hasNoteField = (b) => b?.type === 'reasoning' && typeof b.note === 'string' && b.note !== ''

/**
 * 剥掉历史 assistant 消息里的 TriSoul 旁白 reasoning 块（旁白只给 UI 看，不进任何模型上下文），
 * 并抹掉蒸馏块上的旁白暗字段（缺陷1 侧存位）。
 * 不可变：原数组/原消息不动；只有真被剥/被抹的消息才新建（消息通常被 dsh deepFreeze，不能原地改）。
 * 剥块 / 换块后 → 同时剥 source.replayState（pi-ai replayedAssistant 要求块数与内容一致）。
 * 非 TriSoul 的 reasoning 块（模型自己的思考）原样保留。
 */
export function stripNoteBlocks(messages) {
  if (!Array.isArray(messages)) return messages
  let changed = false
  const out = messages.map(m => {
    if (!m || m.role !== 'assistant' || !Array.isArray(m.content)) return m
    let next = m
    if (next.content.some(isNoteBlock)) { changed = true; next = dropBlocks(next, isNoteBlock) }
    if (next.content.some(hasNoteField)) {
      changed = true
      next = replaceBlocks(next, (b) => { if (!hasNoteField(b)) return b; const { note: _dropped, ...rest } = b; return rest })
    }
    return next
  })
  return changed ? out : messages
}

/** 是否为蒸馏思考块（①）：release 时打上 trisoul 标记的 reasoning 块，常驻历史永不剥 */
const isDistilledBlock = (b) => b?.type === 'reasoning' && b.trisoul === DISTILLED_TAG
/** 是否为模型自身的 raw 思考块（reasoning 且既非旁白也非蒸馏块） */
const isOwnReasoning = (b) => b?.type === 'reasoning' && !isNoteBlock(b) && !isDistilledBlock(b)
/** ②（2026-08-23）蒸馏块的 raw 暗字段：replayReasoning='latest' 放行时 raw 思考不再独立成块，存在蒸馏块 .raw 上 */
const hasStashedRaw = (b) => isDistilledBlock(b) && typeof b.raw === 'string' && b.raw !== ''

/** 按谓词剥一条 assistant 消息里的块；块数变了就一并剥 replayState（块数对不上 pi-ai 会 INVALID_REPLAY_STATE） */
function dropBlocks(m, pred) {
  const content = Object.freeze(m.content.filter(b => !pred(b)))
  let source = m.source
  if (source && typeof source === 'object' && 'replayState' in source) {
    const { replayState: _dropped, ...rest } = source
    source = Object.freeze(rest)
  }
  return Object.freeze({ ...m, content, source })
}
/** 按映射换一条 assistant 消息里的块（不可变）；换块=内容变 → replayState 一并剥（pi-ai replayedAssistant 要求原样） */
function replaceBlocks(m, fn) {
  const content = Object.freeze(m.content.map(b => { const nb = fn(b); return nb === b ? b : Object.freeze(nb) }))
  let source = m.source
  if (source && typeof source === 'object' && 'replayState' in source) {
    const { replayState: _dropped, ...rest } = source
    source = Object.freeze(rest)
  }
  return Object.freeze({ ...m, content, source })
}

/**
 * 剥历史 assistant 消息里模型自身的 raw reasoning 块（不碰旁白块——那是 stripNoteBlocks 的活；
 * 也不碰蒸馏块——①后蒸馏思考链常驻历史，是模型自己的记忆层）。
 * off（默认）= raw 恒全剥（v2 行为；旧会话 resume 残留的自身思考也靠它清掉）；
 * latest = raw 只留最新一段——最后一条带 raw 思考的 assistant 消息免剥 raw，更早消息里的全剥。
 * ①补：被豁免 raw 的那条消息上反而剥蒸馏块——最新步只留 raw，退居历史时换回蒸馏块
 * （同一段思考不双份进上下文）。不可变：只有真被剥的消息才新建，没有任何改动时返回原数组引用。
 */
export function stripOwnReasoning(messages, { latest = false } = {}) {
  if (!Array.isArray(messages)) return messages
  // latest：从尾部找最后一条带 raw 思考的 assistant 消息（旧形态=独立 raw 块；②新形态=蒸馏块 raw 暗字段），只豁免它
  let keepIdx = -1
  if (latest) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m?.role === 'assistant' && Array.isArray(m.content) && m.content.some(b => isOwnReasoning(b) || hasStashedRaw(b))) { keepIdx = i; break }
    }
  }
  let changed = false
  const out = messages.map((m, i) => {
    if (!m || m.role !== 'assistant' || !Array.isArray(m.content)) return m
    if (i === keepIdx) {
      // 旧形态（独立 raw 块）：剥蒸馏块留 raw 块；②新形态（暗字段）：蒸馏块原地换成裸 raw 块——
      // 同一段思考不双份进上下文，最新步只见 raw、退居历史时换回蒸馏块
      if (m.content.some(isOwnReasoning)) {
        if (!m.content.some(isDistilledBlock)) return m
        changed = true
        return dropBlocks(m, isDistilledBlock)
      }
      changed = true
      return replaceBlocks(m, (b) => hasStashedRaw(b) ? { type: 'reasoning', text: b.raw } : b)
    }
    const stashed = m.content.some(hasStashedRaw)
    if (!m.content.some(isOwnReasoning) && !stashed) return m
    changed = true
    // ② 历史步的暗字段剥掉（模型面/网络面不带 raw；显示与档案读的是 session 存储，不经此路）
    const base = stashed ? replaceBlocks(m, (b) => hasStashedRaw(b) ? { type: 'reasoning', text: b.text, trisoul: DISTILLED_TAG } : b) : m
    return base.content.some(isOwnReasoning) ? dropBlocks(base, isOwnReasoning) : base
  })
  return changed ? out : messages
}

/** 发给灵魂 / 兜底路由前的全套去污染：先剥旁白，再剥历史自身思考（replayReasoning='latest' 只留最新一段，否则恒全剥） */
export function sanitizeMessages(messages, cfg) {
  return stripOwnReasoning(stripNoteBlocks(messages), { latest: cfg?.replayReasoning === 'latest' })
}

/** 表决上下文取尾 n 条：若尾 n 条以 tool-result 开头，配对它的 assistant(tool_calls) 被切在窗外 → 留下孤 tool，
 *  提供方以 `role 'tool' must be a response to tool_calls` 拒（dsh 里 tool-result 恒紧跟其配对的 assistant(tool_calls)）。
 *  往前滚窗，保证窗恒从「非 tool-result」消息开始、工具调用配对完整；无工具历史 / 长度不足 n 时原样返回。 */
export function tailWindow(messages, n) {
  if (!Array.isArray(messages) || messages.length <= n) return messages
  let start = messages.length - n
  const isToolResult = (m) => m?.role === 'user' && Array.isArray(m.content) && m.content.some(b => b?.type === 'tool-result')
  // 工具结果恒紧跟其配对的 assistant(tool_calls)：窗首若是 tool-result，配对被切在窗外 → 回滚越过；
  // 回滚到头（列表本身以孤 tool 开头）只能取全量——不留下孤 result，也不丢历史
  while (start >= 0 && isToolResult(messages[start])) start--
  return messages.slice(Math.max(0, start))
}

// ---------- 采集 ----------

class SoulTimeoutError extends Error {
  constructor(ms, kind = 'idle') {
    // 保持「超时（…）」外形：hard=「超时（40ms）」；idle=「超时（60s 无输出）」
    super(kind === 'idle' ? `超时（${fmtMs(ms)} 无输出）` : `超时（${fmtMs(ms)}）`)
    this.code = 'TIMEOUT'
    this.timeoutMs = ms
    this.kind = kind
  }
}
const fmtMs = (ms) => ms >= 1000 ? `${Math.round(ms / 100) / 10}s` : `${ms}ms`
/** 思考熔断（2026-08-26 用户令）：失控思维链掉在两档超时的夹缝里——持续吐字则 idle 永不触发，
 *  总上限又要等满几十分钟（真机病例：24 分钟 100 万字被人肉掐断）。超阈值即掐流判失联，
 *  不重试——失控是模型×任务性质，重试大概率原样复发，白烧一遍。 */
class SoulFuseError extends Error {
  constructor(chars, limit) {
    super(`思考熔断（${chars} 字 > 上限 ${limit}，失控思维链）`)
    this.code = 'REASONING_FUSE'
  }
}
/** 流以 finish{kind:'error'|'aborted'} 收尾（适配器/提供方失败）：带上 failure.code 供重试判定 */
class SoulStreamError extends Error {
  constructor(kind, failure, raw) {
    super(`soul stream ${kind}: ${failure?.code ?? ''} ${failure?.message ?? (raw ? JSON.stringify(raw) : '')}`.trim())
    this.code = failure?.code ?? `STREAM_${String(kind).toUpperCase()}`
    this.kind = kind
  }
}
/** 流正常结束但没有任何文本也没有工具调用：对灵魂来说等于没回答，按可重试失败处理 */
class SoulEmptyError extends Error {
  constructor() { super('未输出（空响应）'); this.code = 'EMPTY' }
}
/** 结果不合要求（如选票不含 JSON）：由调用方 validate 判定，可重试 */
class SoulInvalidOutputError extends Error {
  constructor(message, partial) { super(message); this.code = 'INVALID_OUTPUT'; this.partial = partial }
}
// 配置/参数类错误：重试也不会变，直接判失联（省时间、不刷提供方）
const NON_RETRY_CODE = /^(UNSUPPORTED_|INVALID_(?!OUTPUT)|NO_ADAPTER|UNKNOWN_|NOT_FOUND|MISSING_|CONFIG|AUTH)/
const NON_RETRY_MSG = /\b(400|401|403|404|413|422)\b|invalid[_ ]api[_ ]key|unauthorized|authentication|does not support|not supported|unsupported/i
/**
 * 一次失败是否值得重试。upstream 已取消 → 否；总上限用尽（hard 超时）→ 否；
 * 空闲超时 / 空响应 / 输出不合要求 / 流错误·断流 / 其它未知（网络、5xx、429）→ 是；配置类 → 否。
 */
function retryable(e, upstreamSignal) {
  if (upstreamSignal?.aborted) return false
  if (e?.code === 'TIMEOUT') return e.kind === 'idle'
  if (e?.code === 'REASONING_FUSE') return false
  if (e?.code === 'EMPTY' || e?.code === 'INVALID_OUTPUT') return true
  const code = e?.code ?? e?.failure?.code
  if (typeof code === 'string' && NON_RETRY_CODE.test(code)) return false
  if (NON_RETRY_MSG.test(String(e?.message ?? e))) return false
  return true
}
const describeErr = (e) => (e?.code === 'TIMEOUT' || e?.code === 'EMPTY' || e?.code === 'INVALID_OUTPUT') ? e.message : String(e?.message ?? e)
const sleep = (ms, signal) => new Promise((res) => {
  if (!(ms > 0) || signal?.aborted) return res()
  const t = setTimeout(done, ms)
  function done() { clearTimeout(t); signal?.removeEventListener('abort', done); res() }
  signal?.addEventListener('abort', done, { once: true })
})

/**
 * 带自动重试的灵魂调用。makeOpts(attempt) 生成每次尝试的 options（表决可按尝试放大 maxTokens）；
 * validate(d) 返回错误文案（string）表示结果不合要求（可重试）；空响应自动判失败。
 * 成功返回 collect 结果 + { attempts, retries:[{attempt,error,delayMs}] }；最终失败抛最后一个错误并挂上 .attempts/.retries。
 * onRetry({attempt,error,delayMs,next}) 在每次决定重试时同步回调（监控事件用）。
 */
async function callSoul(ctx, makeOpts, { timeoutMs, idleTimeoutMs, reasoningFuseChars, onDelta } = {}, { retries = 0, backoffMs = 0, validate, onRetry } = {}) {
  const t0 = Date.now()
  const history = []
  for (let attempt = 1; ; attempt++) {
    const opts = makeOpts(attempt)
    const remaining = timeoutMs > 0 ? timeoutMs - (Date.now() - t0) : 0
    let err
    if (timeoutMs > 0 && remaining <= 0) err = new SoulTimeoutError(timeoutMs, 'hard')
    else {
      try {
        const d = await collect(ctx, opts, { timeoutMs: remaining, idleTimeoutMs, reasoningFuseChars, onDelta: onDelta ? (s) => onDelta({ ...s, attempt }) : undefined })
        const bad = (!d.text.trim() && d.toolCalls === 0) ? new SoulEmptyError() : validate?.(d)
        if (!bad) return { ...d, opts, attempts: attempt, retries: history }
        err = typeof bad === 'string' ? new SoulInvalidOutputError(bad, d) : bad
      } catch (e) { err = e }
    }
    const canRetry = attempt <= retries && retryable(err, opts.signal)
    if (!canRetry) {
      const out = err instanceof Error ? err : new Error(String(err))
      out.attempts = attempt; out.retries = history
      throw out
    }
    const rateLimited = RATE_LIMIT_RE.test(`${err?.code ?? ''} ${describeErr(err)}`)
    const delayMs = Math.round(Math.max(0, backoffMs) * 2 ** (attempt - 1) * (rateLimited ? RATE_LIMIT_BACKOFF_X : 1) * (0.5 + Math.random()))
    history.push({ attempt, error: describeErr(err), delayMs })
    onRetry?.({ attempt, error: describeErr(err), delayMs, next: attempt + 1 })
    await sleep(delayMs, opts.signal)
  }
}

/** 盲写实况快照（draft-delta 事件的载荷）：只发累计字数 + 尾部窗口，不发增量——
 *  快照丢帧无影响、重试自动覆盖、消费端无需拼接（增量流会把这三件全变成消费端的状态机负担）。 */
const LIVE_TAIL_CHARS = 600
const liveSnap = (text, reasoning) => ({
  textChars: text.length, reasoningChars: reasoning.length,
  textTail: text.slice(-LIVE_TAIL_CHARS), reasoningTail: reasoning.slice(-LIVE_TAIL_CHARS),
})
/** 盲写实况时间门：距上帧满 intervalMs 才放行（首帧立即），窗口内的快照直接丢——不设 trailing 定时器，
 *  零清理负担（多 return 点无需 finally）；流尾最后一小段由交稿 draft 事件的全文补齐，丢帧无损。 */
const liveGate = (fire, intervalMs = 250) => {
  let last = 0
  return (snap) => { const now = Date.now(); if (now - last >= intervalMs) { last = now; fire(snap) } }
}

/**
 * 把一次 llm.stream 完整收集成块流 + 文本 + 思考 + 统计。
 * 同步 throw（如参数校验）与终止 finish{kind:'error'|'aborted'} 统一转成 rejection，调用方 catch 一处兜住。
 * timeoutMs > 0 时：定时器 + 上游 options.signal 任一触发即 abort（合并进 options.signal），
 * 并对 iterator.next() 做 race，适配器无视 signal（Ark 挂起流）也能按时抛出 SoulTimeoutError（code 'TIMEOUT'）。
 */
async function collect(ctx, options, { timeoutMs, idleTimeoutMs, reasoningFuseChars, onDelta } = {}) {
  const startedAt = Date.now()
  const ac = new AbortController()
  const upstream = options.signal
  const relay = () => ac.abort(upstream?.reason)
  if (upstream?.aborted) relay()
  else upstream?.addEventListener('abort', relay, { once: true })
  let timeoutErr
  // hard：总时长上限；idle：每收到一个 chunk 重置——真的一段时间没输出才判超时
  const timer = timeoutMs > 0
    ? setTimeout(() => { timeoutErr = new SoulTimeoutError(timeoutMs, 'hard'); ac.abort(timeoutErr) }, timeoutMs)
    : undefined
  let idleTimer
  const armIdle = () => {
    if (!(idleTimeoutMs > 0)) return
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => { timeoutErr = new SoulTimeoutError(idleTimeoutMs, 'idle'); ac.abort(timeoutErr) }, idleTimeoutMs)
  }
  armIdle()
  // 中止哨兵：与每次 next() 赛跑；即使流挂起不结束也能退出
  const aborted = new Promise((_, reject) => {
    const fire = () => reject(timeoutErr ?? new Error(`soul stream aborted: ${ac.signal.reason?.message ?? String(ac.signal.reason ?? 'upstream abort')}`))
    if (ac.signal.aborted) fire()
    else ac.signal.addEventListener('abort', fire, { once: true })
  })
  aborted.catch(() => {})
  const chunks = []
  let text = '', reasoning = '', toolCalls = 0, usage, finishKind = null
  // 工具调用参数增量——只供实况快照：软路线盲写的「正文」在 submit_draft 的 arguments 里，不进返回值。
  // 按 block index 分桶：专属取证工具与 submit_draft 同稿时增量交错，单累加器会把两份 JSON 首尾串码（T3）；
  // 快照取最近活跃 block 那份
  const liveArgsBy = new Map()
  let liveArgsIdx = null
  const liveArgs = () => (liveArgsIdx !== null ? liveArgsBy.get(liveArgsIdx) ?? '' : '')
  let it, finished = false
  try {
    // 同步 throw（参数校验/适配器缺席）也走 finally 清定时器，并作为 rejection 交给调用方
    const src = ctx.llm.stream({ ...options, signal: ac.signal })
    it = (src[Symbol.asyncIterator] ?? src[Symbol.iterator]).call(src)
    for (;;) {
      const r = await Promise.race([it.next(), aborted])
      if (r.done) break
      const c = r.value
      armIdle()
      chunks.push(c)
      if (c.type === 'text-delta') { text += c.text ?? ''; onDelta?.(liveSnap(text + liveArgs(), reasoning)) }
      else if (c.type === 'reasoning-delta') {
        reasoning += c.text ?? ''
        if (reasoningFuseChars > 0 && reasoning.length > reasoningFuseChars) throw new SoulFuseError(reasoning.length, reasoningFuseChars)
        onDelta?.(liveSnap(text + liveArgs(), reasoning))
      }
      else if (c.type === 'tool-call-delta') {
        liveArgsBy.set(c.index, (liveArgsBy.get(c.index) ?? '') + (c.argumentsDelta ?? ''))
        liveArgsIdx = c.index
        onDelta?.(liveSnap(text + liveArgs(), reasoning))
      }
      else if (c.type === 'block-start' && c.blockType === 'tool-call') toolCalls++
      else if (c.type === 'usage') usage = c.usage
      else if (c.type === 'finish') {
        const kind = c.reason?.kind
        finishKind = kind ?? null
        if (kind === 'error' || kind === 'aborted') {
          // 适配器尊重 signal、以 aborted 收尾：仍按超时归因
          if (timeoutErr) throw timeoutErr
          throw new SoulStreamError(kind, c.reason?.failure, c)
        }
      }
    }
    finished = true
  } finally {
    clearTimeout(timer)
    clearTimeout(idleTimer)
    upstream?.removeEventListener('abort', relay)
    // 提前退出时通知源流收尾；不等待——挂起的流其 return() 可能永不回来
    if (it && !finished) { try { it.return?.()?.catch?.(() => {}) } catch {} }
  }
  // truncated：被输出上限截断（finish max-tokens）——稿子不完整；重试不解决（上限是配置），只如实标注
  return { chunks, text, reasoning, toolCalls, usage, finishKind, truncated: finishKind === 'max-tokens', durationMs: Date.now() - startedAt }
}

function mkMsg(tag, text) {
  return Object.freeze({
    id: `trisoul-${tag}-${Date.now()}`,
    role: 'user',
    content: Object.freeze([Object.freeze({ type: 'text', text })]),
    source: Object.freeze({ kind: 'plugin', plugin: 'trisoul-consensus' }),
  })
}

/**
 * 每轮快照一次灵魂列表（轮内一致）：@trisoul/dsh-api 的动态列表优先——
 * `ctx.bail('trisoul/souls', sessionId?)` 返回 `[{name,title?,persona?,provider,model,temperature?,reasoningEffort?,enabled:true}]`
 * （已解析、已过目录校验、name 唯一无 '/'、只含 enabled；长度可与静态不同，用户可增删灵魂）。
 * sessionId 让 dsh-api 按会话级预设绑定换启用集（composer 编队 chip：随时可切，下一轮生效）。
 * undefined / 可用条目 0 时退回 cordis 静态 souls（静态路径保留逐魂 trisoul/ai-config 覆盖）；
 * 1 条 = 单魂模式（2026-08-27 放开）：无表决直放，见 alive.length===1 的配置态分支。
 */
function resolveSouls(ctx, staticSouls, options) {
  let live
  try { live = ctx.bail('trisoul/souls', options.sessionId) } catch { live = undefined }
  if (Array.isArray(live)) {
    const ok = live
      .filter(s => s && typeof s === 'object'
        && typeof s.provider === 'string' && s.provider
        && typeof s.model === 'string' && s.model)
      .map((s, i) => ({ ...s, name: String(s.name ?? String.fromCharCode(65 + i)) }))
      // 统一模式（followMain）：跟随对话框选的模型——主请求带 provider/model 就用它（用户改对话框模型即刻生效）
      .map(s => (s.followMain && options.provider && options.model) ? { ...s, provider: options.provider, model: options.model } : s)
    if (ok.length >= 1) {
      // 坏条目（缺 provider/model）滤除后余下的照用——dsh-api 下发前本就校验过路由，走到这里属异常，warn 保可观测
      if (ok.length < live.length) ctx.logger?.warn(`trisoul-consensus: trisoul/souls ${live.length - ok.length} 条不可用已滤除，实际启用 ${ok.map(s => s.name).join(',')}`)
      return ok
    }
    if (live.length > 0) ctx.logger?.warn(`trisoul-consensus: trisoul/souls 可用条目 0 个，退回静态配置`)
  }
  return staticSouls.map(s => liveSoul(ctx, s))
}

/**
 * 灵魂的实时配置：以 cordis 配置为底，叠加 @trisoul/dsh-api 的模型设置（统一/精细两模式）——
 * `ctx.bail('trisoul/ai-config', 'soul-A')` 无监听者时返回 undefined，即退回静态配置。
 */
function liveSoul(ctx, soul) {
  let live
  try { live = ctx.bail('trisoul/ai-config', `soul-${soul.name}`) } catch { live = undefined }
  if (!live || typeof live !== 'object') return soul
  return {
    ...soul,
    provider: live.provider || soul.provider,
    model: live.model || soul.model,
    temperature: typeof live.temperature === 'number' ? live.temperature : soul.temperature,
  }
}

/**
 * purpose 形如 `trisoul-draft/A`：前段给主循环判据与监控归类，后段给监控按灵魂归因。
 * reasoningEffort 只在灵魂路由与主路由完全相同时继承（dsh-llm 对不支持 effort 的模型会抛
 * UNSUPPORTED_REASONING_EFFORT，而 effort id 是适配器私有的，跨路由不可移植）；灵魂可自带 reasoningEffort。
 * messages（含 extra 覆盖的）一律经 sanitizeMessages 去污染（剥旁白 + 剥历史自身思考；
 * cfg.replayReasoning='latest' 时只留最新一段，off 恒全剥）。
 */
function soulOptions(options, soul, stage, extra = {}, cfg = undefined) {
  const sameRoute = soul.provider === options.provider && soul.model === options.model
  const { instruction, hint, order, ...rest } = extra
  const merged = {
    ...options,
    provider: soul.provider,
    model: soul.model,
    // 人设 + 取证指引进 system 尾部（不是消息：历史末尾的 user 消息会被模型当成「要回答的话」，对着用户自报家门 = 人设泄漏）；
    // 同一灵魂跨轮 system 不变，提供方前缀缓存照常命中（② tips 走消息尾 user 直令，system 恒不变）
    system: withPersona(options.system, soul, hint),
    temperature: soul.temperature ?? options.temperature,
    reasoningEffort: soul.reasoningEffort ?? (sameRoute ? options.reasoningEffort : undefined),
    purpose: `trisoul-${stage}/${soul.name}`,
    ...rest,
  }
  // 盲写段末尾恒挂①分岔直令（软路线专用；extra.order = 按魂定制版，order === null = JSON 路最小核显式不挂——
  // 每步注入为零，schema 每请求在场即是全部格式契约；vote/mend 不挂：表决另有直令,兜底直令必须收尾）
  merged.messages = [...sanitizeMessages(merged.messages, cfg), ...(instruction ? [instruction] : []), ...(stage === 'draft' && order !== null ? [order ?? submitFirstOrder()] : [])]
  return merged
}

/**
 * system 尾部的「Working style」块：persona 是做事取舍（不是人格 / 身份 / 合议角色），后面固定一句「只影响视角与取舍，不改变任务」；
 * 官位指引（hint）跟在其后。persona 与 hint 都空 → system 原样（请求与主请求同形）。不出现「三魂 / 灵魂 / 角色 / 身份」字样（中英皆不）。
 */
export function withPersona(system, soul, hint) {
  const persona = String(soul.persona ?? '').trim()
  if (!persona && !hint) return system
  const block = (persona ? `## Working style\n${persona}\nThe above shapes only your perspective and trade-offs, not the task: still complete this step fully, as if answering the user directly.` : '') + (hint ?? '')
  return `${system ?? ''}${system ? '\n\n' : ''}${block.trimStart()}`
}

/**
 * 运行时共识参数：cordis config 为底，@trisoul/dsh-api 的 settings 层（trisoul/consensus-config）可热覆盖。
 * bail 无监听者返回 undefined → 退回静态配置。
 * （旧 mergeRounds / mergeEffort / ballotTokens / traceDraftChars / traceReasoningChars
 *  已随 v2 删除——融合轮、选票截断不复存在，键被忽略。replayReasoning 于 2026-08-22 带回：off/latest 两态。）
 */
function liveConsensusConfig(ctx, config) {
  let live
  try { live = ctx.bail('trisoul/consensus-config') } catch { live = undefined }
  const pick = (k, ok) => (live && ok(live[k])) ? live[k] : (ok(config[k]) ? config[k] : undefined)
  const posInt = v => Number.isInteger(v) && v > 0
  const nonNegInt = v => Number.isInteger(v) && v >= 0
  const effortMode = v => v === 'off' || v === 'inherit'
  const replayMode = v => v === 'off' || v === 'latest'
  return {
    trace: pick('trace', v => TRACE_MODES.has(v)) ?? DEFAULT_TRACE,
    voteMaxTokens: pick('voteMaxTokens', nonNegInt) ?? DEFAULT_VOTE_MAX_TOKENS,
    ballotTool: pick('ballotTool', v => typeof v === 'boolean') ?? true,
    // 超时开关（2026-08-25）：总上限 0 = 不限（callSoul/collect 对 timeoutMs≤0 天然不设 hard 定时器，idle 兜底仍在）
    soulTimeoutMs: pick('soulTimeoutMs', nonNegInt) ?? DEFAULT_SOUL_TIMEOUT_MS,
    soulIdleTimeoutMs: pick('soulIdleTimeoutMs', posInt) ?? DEFAULT_SOUL_IDLE_TIMEOUT_MS,
    reasoningFuseChars: pick('reasoningFuseChars', nonNegInt) ?? DEFAULT_REASONING_FUSE_CHARS,
    soulRetries: pick('soulRetries', nonNegInt) ?? DEFAULT_SOUL_RETRIES,
    soulRetryBackoffMs: pick('soulRetryBackoffMs', nonNegInt) ?? DEFAULT_SOUL_RETRY_BACKOFF_MS,
    soulStaggerMs: pick('soulStaggerMs', nonNegInt) ?? DEFAULT_SOUL_STAGGER_MS,
    voteEffort: pick('voteEffort', effortMode) ?? DEFAULT_SMALL_JOB_EFFORT,
    // 胜者 raw 思考回灌开关：off（默认）= 恒全剥（现行为）；latest = release 折进历史一段、sanitize 只留最新一段（只活一轮）。
    // 非法值经 pick 双侧否决后落默认 off
    replayReasoning: pick('replayReasoning', replayMode) ?? DEFAULT_REPLAY_REASONING,
    // P2-4 近似免表决：工具调用相同 + 正文相似度全超阈 → 免表决放行（false 关闭；阈值 ∈ (0,1]）
    nearIdentical: pick('nearIdentical', v => typeof v === 'boolean') ?? true,
    nearIdenticalSimilarity: pick('nearIdenticalSimilarity', v => typeof v === 'number' && v > 0 && v <= 1) ?? DEFAULT_NEAR_IDENTICAL_SIMILARITY,
    // ⑬ 内层布尔开关（旧 innerTools/innerCalls/innerResultChars/innerTotalChars 已拆，键被忽略）
    innerEvidence: pick('innerEvidence', v => typeof v === 'boolean') ?? true,
    // C2（2026-08-25）取证轮数上限：0 = 不限（默认；用户拍板「默认不限制但加可调设置」，信 agent 自然收敛）
    innerRounds: pick('innerRounds', nonNegInt) ?? DEFAULT_INNER_ROUNDS,
    // T4（工单 v6）UI 心跳周期：表决/补枪/收官期间每隔这么久发一次 phase:'status'；0 = 关
    statusHeartbeatMs: pick('statusHeartbeatMs', nonNegInt) ?? DEFAULT_STATUS_HEARTBEAT_MS,
    // T2（工单 v6）走 JSON 强制输出的渠道白名单；空数组 = 全渠道回软路线（一键回退出口）
    jsonSchemaProviders: pick('jsonSchemaProviders', v => Array.isArray(v) && v.every(x => typeof x === 'string')) ?? DEFAULT_JSON_SCHEMA_PROVIDERS,
    // 面板豁免宿主工具名单（进内层白名单/evidence 菜单的宿主工具）。默认空 = trisoul_recall 暂时撤出
    // 取证面（2026-08-25 用户令，病例 9bd772f3：recall 变参内环空转）；恢复 = 配置层传 ['trisoul_recall']。
    exemptHostTools: pick('exemptHostTools', v => Array.isArray(v) && v.every(x => typeof x === 'string')) ?? [],
  }
}

/** ⑫ 上下文框架投影（监控面板用）：请求的消息结构——每条 {role, kind, plugin?, checkpoint?, chars}，
 *  另附 systemChars/tools/totalChars。纯结构不含正文（监控面不泄内容，长度画格子够用）。 */
export function contextFrameOf(opts) {
  const blockChars = (b) => typeof b?.text === 'string' ? b.text.length
    : typeof b?.arguments === 'string' ? b.arguments.length
      : Array.isArray(b?.content) ? b.content.reduce((n, x) => n + blockChars(x), 0) : 0
  const msgChars = (m) => Array.isArray(m?.content) ? m.content.reduce((n, b) => n + blockChars(b), 0) : 0
  const messages = (Array.isArray(opts?.messages) ? opts.messages : []).map(m => ({
    role: m?.role ?? '?',
    kind: m?.source?.kind ?? null,
    ...(m?.source?.plugin ? { plugin: m.source.plugin } : {}),
    ...(m?.source?.compactionId !== undefined ? { checkpoint: true } : {}),
    chars: msgChars(m),
  }))
  return {
    systemChars: typeof opts?.system === 'string' ? opts.system.length : 0,
    tools: Array.isArray(opts?.tools) ? opts.tools.length : 0,
    totalChars: messages.reduce((n, m) => n + m.chars, 0),
    messages,
  }
}

const soulTitle = (soul) => soul.title ? `灵魂 ${soul.name} · ${soul.title}` : `灵魂 ${soul.name}`
const cnNum = (n) => ['零', '一', '两', '三', '四', '五', '六', '七', '八', '九'][n] ?? String(n)

/** 提取表决 JSON 里的 reason 全文（转义原样保留，不截断；旁白展示时另行 clip） */
function parseReason(text) {
  const m = /"reason"\s*:\s*"((?:[^"\\]|\\.)*)"?/.exec(text ?? '')
  return m ? m[1] : undefined
}
/** 提取文本票里的 salvage 声明（D1）；没写 = 空串 */
function parseSalvage(text) {
  const m = /"salvage"\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(text ?? '')
  return m ? m[1].trim() : ''
}

/**
 * 解析一张文本选票 → { picks, labels, reason, parsed, reject? }。
 * picks = [真实候选下标] 或 []（弃权 / 无效编号 / 两魂互审时的「不放行」）；候选编号 k 映射回 perm[k-1]。
 * 认 "pick": k；旧式 "picks": [k,…]（取第一个）与 "best" 兼容；没写 JSON 但散文投票也认；完全不可解析 = 未解析（弃权、触发重试）。
 */
export function parseBallot(text, { m, perm }) {
  const t = text ?? ''
  const reason = parseReason(t)
  let tok
  const one = /"pick"\s*:\s*"?\s*(候选\s*|candidate\s*#?\s*)?(-?\d+)\s*"?/i.exec(t)
  if (one) tok = one[2]
  else {
    const arr = /"picks"\s*:\s*\[([^\]]*)\]/.exec(t)
    if (arr) tok = [...arr[1].matchAll(/"((?:[^"\\]|\\.)*)"|'([^']*)'|(-?\d+)/g)].map(x => x[1] ?? x[2] ?? x[3])[0]
    else {
      const best = /"best"\s*:\s*"?(\d+)"?/i.exec(t)
      if (best) tok = best[1]
      else {
        // 兜底：没写 JSON 但用散文投了票——取最后一行含投票动词（中英都认，⑨ 候选卡英文化后模型可能用英文散文投）的句子里的候选编号（两魂互审时「不能放行」= 0）
        const line = t.split(/\r?\n/).reverse().find(l => /(pick|vote|chos|choose|select|candidate|release|reject|veto|withhold|投票|投给|我投|投[：:]|选择[：:]|投候选|放行|不放行|不通过|否决)/i.test(l))
        if (line) {
          if (m === 1 && /(不能放行|不可放行|不放行|不通过|否决)|cannot (?:be )?release|can't (?:be )?release|do(?:n't| not) release|\breject\b|\bveto\b|\bwithhold\b/i.test(line)) tok = '0'
          else {
            const f = /候选\s*(\d+)|candidate\s*#?\s*(\d+)|(?<![\d.])(\d+)(?![\d.])/i.exec(line.replace(/^.*?(pick|vote|chos|choose|select|candidate|release|投票|投给|我投|投[：:]|选择[：:]|投候选|放行)/i, '$1'))
            if (f) tok = f[1] ?? f[2] ?? f[3]
          }
        }
      }
    }
  }
  if (tok === undefined || tok === null) return { picks: [], labels: [], reason: reason ?? '（弃权：输出被截断或不含 JSON）', salvage: '', parsed: false }
  const r = resolvePick(tok, { m, perm })
  return { ...r, reason: reason ?? (r.picks.length || r.reject ? '' : '（弃权：选票无有效选项）'), salvage: parseSalvage(t), parsed: true }
}

/** 一个选项 token → picks（候选编号映射回真实下标 perm[k-1]）；两魂互审时 0 = 不放行（reject）；无效编号 = 空 */
function resolvePick(tok, { m, perm }) {
  // 真机弃权根因：模型写 "候选2" / "候选 3" / "#2" / "2号"（带前后缀的编号）——只要整个 token 里恰有一个数字就按编号解
  const nums = String(tok).match(/\d+/g)
  if (nums && nums.length === 1) {
    const k = +nums[0]
    if (k >= 1 && k <= m) return { picks: [perm[k - 1]], labels: [String(tok)] }
    if (k === 0 && m === 1) return { picks: [], labels: ['不放行'], reject: true }
  }
  return { picks: [], labels: [] }
}

/**
 * 解析 cast_ballot 工具调用的参数（JSON 串或已解析对象）→ 与 parseBallot 同形。
 * 认 pick；旧式 picks 数组（取第一个）/ best 兼容；参数不是合法 JSON 对象 / 没有 pick = 未解析（parsed:false，触发重试）。
 */
export function parseBallotArgs(raw, { m, perm }) {
  let o = raw
  if (typeof raw === 'string') { try { o = JSON.parse(raw) } catch { o = undefined } }
  const bad = (why) => ({ picks: [], labels: [], reason: `（弃权：${why}）`, salvage: '', parsed: false })
  if (!o || typeof o !== 'object' || Array.isArray(o)) return bad('选票工具参数不是 JSON 对象')
  const tok = o.pick !== undefined && o.pick !== null ? o.pick
    : Array.isArray(o.picks) ? o.picks.find(t => t !== null && t !== undefined)
      : (o.best !== undefined && o.best !== null ? o.best : undefined)
  if (tok === undefined) return bad('选票工具参数没有 pick')
  const reason = typeof o.reason === 'string' ? o.reason : ''
  const r = resolvePick(tok, { m, perm })
  return { ...r, reason: reason || (r.picks.length || r.reject ? '' : '（弃权：选票无有效选项）'), salvage: typeof o.salvage === 'string' ? o.salvage.trim() : '', parsed: true }
}

/**
 * 计票：counts[i] = 候选 i 的票数（每魂 1 票、只投别人）。
 * v2 无融合轮：decision ∈ { 'winner', 'abstain' }——平票（≥3 魂 1-1-1 环投；2 魂互不放行 = 全 0）
 * 与全员弃权一律按「对话轮次 + 表决轮」错位轮换选 chosenIdx 直接放行，无专门机制。
 */
export function tallyVotes(votes, n, turn) {
  const counts = Array.from({ length: n }, () => 0)
  for (const v of votes) for (const p of v.picks) if (Number.isInteger(p) && p >= 0 && p < n) counts[p]++
  const voted = votes.filter(v => v.parsed).length
  const max = Math.max(...counts)
  const tied = counts.flatMap((c, i) => c === max ? [i] : [])
  // v2 单轮表决：轮换只由对话轮次错位（多表决轮的 round 参数随融合轮拆除，2026-08-26 B8）
  const chosenIdx = tied[(turn - 1) % tied.length]
  const decision = voted === 0 ? 'abstain' : 'winner'
  return { counts, max, tied, tie: tied.length > 1, chosenIdx, decision, voted }
}

/**
 * 最后一条 user 消息的文本前 n 字（给监控/灵魂面板做轮次标题）。
 * 优先真人原话（source.kind==='user'），没有再退到最后一条非工具结果的 user 消息（插件注入等）。
 */
function promptOf(messages, n = 200) {
  if (!Array.isArray(messages)) return ''
  const textOf = (m) => (m.content ?? []).filter(b => b?.type === 'text').map(b => b.text).join('\n')
  for (const want of [(m) => m.source?.kind === 'user', (m) => m.source?.kind !== 'tool']) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (!m || m.role !== 'user' || !want(m)) continue
      const t = textOf(m)
      if (t) return t.slice(0, n)
    }
  }
  return ''
}

// ---------- 表决公平：确定性打乱 + 轮换 ----------

function seedOf(str) {
  let h = 2166136261
  for (const ch of String(str)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) }
  return h >>> 0
}
function mulberry32(a) {
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
/**
 * 投票者看到的候选顺序：perm[k] = 第 k+1 号候选对应的真实候选下标。
 * 种子 = 投票者名#轮次，确定性（可测）且每轮不同（消除位置偏置）。
 */
export function shuffleFor(voter, turn, n) {
  const rnd = mulberry32(seedOf(`${voter}#${turn}`))
  const perm = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[perm[i], perm[j]] = [perm[j], perm[i]]
  }
  return perm
}

/** 候选的工具调用（名字 + 原始参数），用于指纹比较、选票展示与放行重放。
 *  submit_draft 是交稿通道不是动作：一律不计入——否则指纹/相似度会被交稿参数噪声干扰，
 *  收官步判定（无真工具调用）与候选卡的「含 N 个工具调用」也会把交稿算成动作。 */
const toolCallsOf = (chunks) => chunks
  .filter(c => c.type === 'block-end' && c.block?.type === 'tool-call' && c.block.name !== SUBMIT_TOOL)
  .map(c => ({ id: c.block.id, name: c.block.name, arguments: c.block.arguments }))
/** 从稿流里取 submit_draft 交稿（取最后一次，模型重复交稿以末次为准；参数为 JSON 串或已解析对象）
 *  → 四格 + thinking（三格拼合，下游卡片/旁白/tips/事件统一用它）；
 *  没交稿 / 参数不是合法 JSON 对象 = null（交 envelopeError 判定 → 补枪） */
function submitArgsOf(d) {
  const call = (d.chunks ?? []).filter(c => c.type === 'block-end' && c.block?.type === 'tool-call' && c.block.name === SUBMIT_TOOL).at(-1)
  if (!call) return null
  let o = call.block.arguments
  if (typeof o === 'string') { try { o = JSON.parse(o) } catch { o = undefined } }
  return normalizeSubmit(o)
}
/**
 * T2 JSON 路收稿：整条回复就是一个 JSON 对象，从 message 文本里取。
 * strict 保证语法合法，仍留兜底一枪——先直接 parse，不成再截最外层花括号重试
 * （模型在 JSON 前后夹话是 strict 关掉 / 桥补丁没在位时的退化形态，不该整稿作废）。
 * 两条路线最终交出同一个形状（normalizeSubmit），下游零分叉。
 */
export function parseJsonDraft(text) {
  const s = String(text ?? '')
  let o
  try { o = JSON.parse(s) } catch { o = undefined }
  if (!o || typeof o !== 'object' || Array.isArray(o)) {
    const i = s.indexOf('{'), j = s.lastIndexOf('}')
    if (i >= 0 && j > i) { try { o = JSON.parse(s.slice(i, j + 1)) } catch { o = undefined } }
  }
  return normalizeSubmit(o)
}
/** 交稿对象 → 四格 + 三栏 + evidence + thinking 的规范形（宽容解析：非法项逐项丢弃，坏一项不坏整稿） */
function normalizeSubmit(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null
  const s = (k) => (typeof o[k] === 'string' ? o[k] : '')
  // 四格回装后（fb01608）：JSON 路模型面 findings/plan/move/reply；软路线 findings/plan/action/output；
  // note 是上一刀（单格）的旧键、output/reply 互为别名——全部键都收（存量稿重放兼容），
  // 内部规范形恒为四格，收稿之后的一切（表决/指纹/放行/监控/档案）零分叉。
  const grids = { findings: s('findings') || s('note'), plan: s('plan'), action: s('move') || s('action'), output: s('output') || s('reply') }
  // 隐藏工具栏三栏（工单 v5）：宽容解析——非法项（名字非串/参数非对象/字段非串）逐项丢弃，坏一项不坏整稿
  const arr = (k) => (Array.isArray(o[k]) ? o[k] : [])
  const actions = arr('actions')
    .filter(a => a && typeof a === 'object' && typeof a.name === 'string' && a.name
      && a.arguments && typeof a.arguments === 'object' && !Array.isArray(a.arguments))
    .map(a => ({ name: a.name, arguments: a.arguments }))
  const files = arr('files')
    .filter(f => f && typeof f === 'object' && typeof f.path === 'string' && f.path && typeof f.content === 'string')
    .map(f => ({ path: f.path, content: f.content }))
  const edits = arr('edits')
    .filter(e => e && typeof e === 'object' && typeof e.path === 'string' && e.path
      && typeof e.old_string === 'string' && typeof e.new_string === 'string')
    .map(e => ({ path: e.path, old_string: e.old_string, new_string: e.new_string }))
  // 取证请求（JSON 路独有）：五次拍板后模型交的键名是 lookup，旧键 evidence 兼容收（存量稿/回放）；
  // 内部规范形恒为 evidence，下游（内环执行/监控/档案）零分叉。只认 {name, arguments} 且 name 非空；
  // 其余一律当 null（=交稿）。tool 面板路线上这个字段永远不出现，恒 null，下游一视同仁。
  // 六次拍板：lookup 数组语义（[]=不用，与三栏同构）——解包取首条；旧形状（对象/null）与旧键照收。
  const eRaw = o.lookup !== undefined && o.lookup !== null ? o.lookup : o.evidence
  const e = Array.isArray(eRaw) ? (eRaw.length ? eRaw[0] : null) : eRaw
  const evidence = (e && typeof e === 'object' && !Array.isArray(e) && typeof e.name === 'string' && e.name.trim())
    ? { name: e.name.trim(), arguments: (e.arguments && typeof e.arguments === 'object' && !Array.isArray(e.arguments)) ? e.arguments : {} }
    : null
  return { ...grids, actions, files, edits, evidence, thinking: composeThinking(grids) }
}
/**
 * 三栏 → 标准 tool-call 块参数（隐藏工具栏合成，工单 v5）。
 * 固定序 files→edits→actions（一步内动作全盲发，唯一保序需求=先写后跑；栏内按数组序）；
 * path→file_path 映射对齐宿主 write/edit 参数名；id 自生成。
 * 合成块塞回稿 chunks 后，指纹/免表决/收官/独走/候选卡/监控/放行重放照旧从 chunks 数调用——
 * 六处「取材源失明」一举归零（家族病防复发：上次 submit 化正文空对空恒 1 同款教训）。
 */
export function bridgeCallsOf(sub, stamp = 0) {
  if (!sub) return []
  const calls = []
  for (const f of sub.files ?? []) calls.push({ name: 'write', arguments: { file_path: f.path, content: f.content } })
  for (const e of sub.edits ?? []) calls.push({ name: 'edit', arguments: { file_path: e.path, old_string: e.old_string, new_string: e.new_string } })
  for (const a of sub.actions ?? []) calls.push({ name: a.name, arguments: a.arguments })
  return calls.map((c, i) => ({ id: `trisoul-bridge-${stamp}-${i}`, name: c.name, arguments: JSON.stringify(c.arguments) }))
}
/** 稿子的可回放块（文本 + 真工具调用；思考块不进私有上下文——签名与外部上下文不匹配，且取证轮不需要。
 *  submit_draft 同样不进：交稿调用没有对应的工具结果，回灌会给私有上下文留一个悬空调用） */
const assistantBlocksOf = (chunks) => chunks
  .filter(c => c.type === 'block-end' && c.block && (c.block.type === 'text' || (c.block.type === 'tool-call' && c.block.name !== SUBMIT_TOOL)))
  .map(c => c.block.type === 'text' ? { type: 'text', text: c.block.text ?? '' } : { type: 'tool-call', id: c.block.id, name: c.block.name, arguments: c.block.arguments ?? '{}' })
const toolResultText = (blocks) => (Array.isArray(blocks) ? blocks : [])
  .map(b => b?.type === 'text' ? (b.text ?? '') : b?.type === 'tool-result' ? toolResultText(b.content) : '').join('')
const argsSummary = (raw) => String(raw ?? '').replace(/\s+/g, ' ').trim()
const fmtK = (n) => n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n)
/** 稿的指纹 = 交稿两参数 + 真工具调用。正文通道（d.text）通常为空串——内容都在 submit_draft 参数里，
 *  再按 text 指纹会把所有纯参数稿判成「完全一致」误触免表决。 */
const fingerprint = (d) => JSON.stringify([d.thinking ?? '', d.output ?? '', toolCallsOf(d.chunks).map(t => [t.name, t.arguments])])

// ---------- 近似指纹（P2-4，2026-08-20）----------
// 机械施工步三稿常常动作一模一样、只差措辞（真机 378 轮里 22% 两两相似度 >0.6，逐字一致的免表决只命中 9 轮）。
// 动作相同时表决只能在措辞间挑——尺②明说「不因风格、写法不同而不选」，三张票是纯开销 → 免表决直接放行。
/** JSON 值规范化（键排序），参数深比对不受键序/空白影响 */
const canonJson = (v) => Array.isArray(v) ? v.map(canonJson)
  : (v && typeof v === 'object') ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonJson(v[k])]))
  : v
const argsEqual = (x, y) => {
  let px, py
  try { px = canonJson(JSON.parse(x ?? '{}')) } catch { px = undefined }
  try { py = canonJson(JSON.parse(y ?? '{}')) } catch { py = undefined }
  if (px !== undefined && py !== undefined) return JSON.stringify(px) === JSON.stringify(py)
  return String(x ?? '').replace(/\s+/g, '') === String(y ?? '').replace(/\s+/g, '')
}
// 参数相似判定（2026-08-21 用户拍板）：真机三稿动作常常一致、只在长文本参数（写入内容/commit 文案）里差几个词，
// 全等要求让近似免表决 0 命中。相似 ≠ 松：短参数（路径/端口/命令/标志）一字之差就是不同动作，仍须全等——
// 词面 Jaccard 对「100 词差 1 词」不敏感，放给短参数会把 8080/3000 这种关键差异判成一致。
/** 短参数全等线：字符串参数双方都超过它才允许按相似度比（≤ 它的一律全等） */
const SHORT_ARG_CHARS = 64
function valueSimilar(x, y, threshold) {
  if (x === y) return true
  if (typeof x !== typeof y) return false
  if (typeof x === 'string') {
    if (x.length <= SHORT_ARG_CHARS || y.length <= SHORT_ARG_CHARS) return false
    return textSimilarity(x, y) >= threshold
  }
  if (Array.isArray(x) || Array.isArray(y)) {
    if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length) return false
    return x.every((v, i) => valueSimilar(v, y[i], threshold))
  }
  if (x && y && typeof x === 'object') {
    const kx = Object.keys(x).sort(), ky = Object.keys(y).sort()
    if (kx.length !== ky.length || kx.some((k, i) => k !== ky[i])) return false
    return kx.every(k => valueSimilar(x[k], y[k], threshold))
  }
  return false   // 数字 / 布尔 / null：不全等即不同
}
/** 两稿工具调用语义相似：条数、顺序、名字逐位一致；参数键集一致，长字符串值按词面相似度过阈、其余全等 */
export function similarToolCalls(a, b, threshold) {
  const ca = toolCallsOf(a.chunks), cb = toolCallsOf(b.chunks)
  if (ca.length !== cb.length) return false
  return ca.every((c, i) => {
    if (c.name !== cb[i].name) return false
    if (argsEqual(c.arguments, cb[i].arguments)) return true
    let px, py
    try { px = JSON.parse(c.arguments ?? '{}') } catch { px = undefined }
    try { py = JSON.parse(cb[i].arguments ?? '{}') } catch { py = undefined }
    if (px === undefined || py === undefined) return false   // 解析不了退回全等（上面已判否）
    return valueSimilar(px, py, threshold)
  })
}
// 终审 F5：中文无空格分词，整句会被 [\p{L}\p{N}_]+ 当成 1 个词（「修改配置文件端口为8080并重启服务」= 1 词，
// 相似度对中文主流程打不响）——CJK 连串再切成字符二元组：词面可比，且二元组自带局部语序。
const CJK_RUN = /[぀-ヿ㐀-䶿一-鿿豈-﫿]+|[^぀-ヿ㐀-䶿一-鿿豈-﫿]+/gu
const CJK = /[぀-ヿ㐀-䶿一-鿿豈-﫿]/u
const wordSet = (s) => {
  const out = new Set()
  for (const tok of String(s ?? '').toLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? []) {
    if (!CJK.test(tok)) { out.add(tok); continue }
    for (const run of tok.match(CJK_RUN) ?? []) {   // CJK 与非 CJK 混排先切开（「端口8080」→「端口」「8080」）
      if (!CJK.test(run) || run.length === 1) { out.add(run); continue }
      for (let i = 0; i < run.length - 1; i++) out.add(run.slice(i, i + 2))
    }
  }
  return out
}
/** 正文词面 Jaccard 相似度 ∈ [0,1]（两稿都空 = 1）；CJK 按字符二元组比 */
export function textSimilarity(a, b) {
  const A = wordSet(a), B = wordSet(b)
  if (!A.size && !B.size) return 1
  let inter = 0
  for (const w of A) if (B.has(w)) inter++
  return inter / (A.size + B.size - inter)
}

/** 候选卡片上的取证行（模型面，⑨ 英文） */
const evidenceLine = (d) => (d.inner?.length
  ? `\n[Evidence ×${d.inner.length}] ${d.inner.map(t => `${t.name}(${argsSummary(t.args)})${t.ok ? '' : ' ✗'}`).join('; ')}`
  : '')
/**
 * 选票里的候选全文卡（四格直取 submit_draft 参数）+ 取证行 + 全部真工具调用
 *（名字 + 完整参数；submit_draft 交稿通道不列入）。
 * C4（2026-08-25）分格带标签 [Findings]/[Plan]/[Action]/[Output]：评委要能分开看「查明的事」与
 * 「打算怎么干」才判得动 B4 那把尺，无标签的拼合文里两者糊成一段。
 * 标签只活在票面上——蒸馏块与旁白照旧零标签（固定字样重复=学舌源，防学舌铁律）；票面阅后即焚不进历史。
 * 空格子整行不出（plan 可空）；拿不到分格的旧形态/代填稿退回整份拼合文。
 */
function fullCard(d) {
  const tools = toolCallsOf(d.chunks)
  const cell = (label, v) => { const t = String(v ?? '').trim(); return t ? `[${label}] ${t}` : '' }
  const grids = [cell('Findings', d.findings), cell('Plan', d.plan), cell('Action', d.submitted)].filter(Boolean).join('\n')
  return `${grids || d.thinking}\n[Output] ${d.output || '(no text)'}` + evidenceLine(d) +
    (tools.length ? '\n' + tools.map(t => `[Tool call] ${t.name}(${t.arguments ?? ''})`).join('\n') : '')
}

/**
 * 外壳：保证 trisoul/consensus 的 start 必有 done 配对——消费者中途 return/throw（用户点停止、上游异常）
 * 时 finally 补发 done{result:'aborted'}，否则监控 inflight 永久 +1。
 * 事件只走内存（ctx.emit），不进正文、不进 session；里面可以带全文（思考链/盲稿/重写稿）。
 */
/** 会话里最后一条用户原话（source.kind==='user'）的 seq；没有会话/没有用户消息 → null */
function lastUserSeq(session) {
  const events = Array.isArray(session?.events) ? session.events : null
  if (!events) return null
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    if (e.type === 'user/message' && e.data?.source?.kind === 'user') return e.seq
  }
  return null
}

async function* consensusStream(ctx, options, staticSouls, config, turn, pending = null, notes = new Map()) {
  const startedAt = Date.now()
  let done = false
  const report = (info) => {
    if (info.phase === 'done') done = true
    try { ctx.emit('trisoul/consensus', { ts: Date.now(), turnId: turn, sessionId: options.sessionId ?? null, ...info }) }
    catch (e) { ctx.logger?.warn(`trisoul-consensus: 监控事件上报失败 ${String(e?.message ?? e)}`) }
  }
  try {
    yield* consensusBody(ctx, options, staticSouls, config, report, startedAt, turn, pending, notes)
  } finally {
    if (!done) report({ phase: 'done', mode: 'aborted', result: 'aborted', durationMs: Date.now() - startedAt })
  }
}

async function* consensusBody(ctx, options, staticSouls, config, report, startedAt, turn, pending = null, notes = new Map()) {
  // 每轮开始时快照一次实时配置（模式切换/改模型/增删灵魂即刻对下一轮生效；轮内保持一致）
  const souls = resolveSouls(ctx, staticSouls, options)
  const cfg = liveConsensusConfig(ctx, config)
  const timeout = { timeoutMs: cfg.soulTimeoutMs, idleTimeoutMs: cfg.soulIdleTimeoutMs, reasoningFuseChars: cfg.reasoningFuseChars }
  // 小作业档位：'off' 模式下按该灵魂的路由做能力门控（声明了 off 档才传，否则 undefined = 提供商默认）
  const jobEffort = (soul, mode) => mode === 'off' ? smallJobEffort(ctx, soul.provider, soul.model) : Promise.resolve(undefined)
  // 递增 block index：本流内所有块（旁白 + 重放胜者块）共用一个计数器
  let nextIndex = 0
  const text = function* (s) {
    const i = nextIndex++
    yield { type: 'block-start', index: i, blockType: 'text' }
    yield { type: 'text-delta', index: i, text: s }
    yield { type: 'block-end', index: i, block: { type: 'text', text: s } }
  }
  // 旁白通道：reasoning 模式下整段共识过程写进同一个 reasoning 块（UI 折叠成思维链）；
  // text 模式退回可见文本；none 模式只进日志/事件
  let noteIndex = null, noteText = ''
  const note = function* (s) {
    if (cfg.trace === 'none') return
    if (cfg.trace === 'text') { yield* text(s); return }
    if (noteIndex === null) {
      noteIndex = nextIndex++
      yield { type: 'block-start', index: noteIndex, blockType: 'reasoning' }
    }
    noteText += s
    yield { type: 'reasoning-delta', index: noteIndex, text: s }
  }
  // 正文开始前必须关掉旁白块（块不可交错）。
  // ⑪→②（2026-08-23）：BlockAssembler 按 block-end 对象落库（delta 只喂流式 UI），旁白只活在进行中视图；
  // ② release 传入蒸馏块 finalBlock → 旁白块 block-end 直接落它（同 index）——历史里这一块就是蒸馏思考链，
  // 主视图每步恰一行 Think。不传 = ⑪ 空 note 形态（非放行路径：中止/回退等，稀有，读侧双认照旧剥）。
  // llm-invariant 只校验块型/index 配对，不校验 text 与增量一致（已实测 dsh-llm invariant.js）。
  // text 模式补一条分隔线。
  //
  // 缺陷1 侧存（2026-08-24）：落库块再挂一个 note 暗字段装旁白全文——delta 只喂进行中视图，
  // 一刷新表决过程就零记录（真机 36/36 步 message 的 reasoning 无任何旁白痕迹）。选暗字段而非自定义块类型：
  // ① 保真——BlockAssembler 按 block-end 原样收块（直接引用 + structuredClone），全链路无 schema；
  // ② 天然不进模型——pi-ai 两条转换路径的 reasoning 分支都只读 block.text，压缩/标题这些插件拦不到的
  //    辅助调用同样只拿得到 text，不靠任何剥离代码兜底；
  // ③ 零 token——token-meter 的 reasoning 分支按 block.text.length 计价，暗字段不计分；反过来自定义块类型
  //    会掉进它的 default 分支按 JSON.stringify 全长计价，正是 bfdd41f 那类 messageTokens 投影漂移的病根。
  const closeNote = function* (finalBlock) {
    if (noteIndex !== null) {
      const base = finalBlock ?? { type: 'reasoning', text: '', trisoul: 'note' }
      yield { type: 'block-end', index: noteIndex, block: noteText ? { ...base, note: noteText } : base }
      noteIndex = null
      noteText = ''
    } else if (cfg.trace === 'text') {
      yield* text('────────────────\n\n')
    }
  }
  // 重放一段块流：index 整体平移到当前计数器之后；stripReplay 时剥 finish.replayState 走 foreignAssistant 正门；
  // dropReasoning 时过滤 raw reasoning（reasoning-delta 与 reasoning 块不进会话，v2：原生思考不外传）——
  // 剥块后块数变了，index 按块重排成连续（llm-invariant 要求；同一块的 start/delta/end 共享 index），
  // finish.replayState 必剥（replayedAssistant 要求块数一致）
  const replay = async function* (chunks, { stripReplay = false, dropReasoning = false } = {}) {
    const base = nextIndex
    let maxIndex = -1
    let seq = base
    let dropped = false
    const remap = new Map()
    for await (const c of chunks) {
      if (dropReasoning && (c.type === 'reasoning-delta' || (c.type === 'block-start' && c.blockType === 'reasoning') || (c.type === 'block-end' && c.block?.type === 'reasoning'))) { dropped = true; continue }
      if (typeof c.index === 'number') {
        if (dropReasoning) {
          if (!remap.has(c.index)) remap.set(c.index, seq++)
          yield { ...c, index: remap.get(c.index) }
          continue
        }
        maxIndex = Math.max(maxIndex, c.index)
        yield { ...c, index: base + c.index }
      } else if ((stripReplay || dropped) && c.type === 'finish' && c.replayState !== undefined) {
        const { replayState, ...rest } = c
        yield rest
      } else yield c
    }
    nextIndex = dropReasoning ? seq : base + maxIndex + 1
  }
  // submit_draft 工具化后放行必换块（收官步重建 / 工具步剥交稿块）→ replayState 恒剥，
  // 旧的 mustStrip/foreign/hasRawReasoning 判定不再需要（2026-08-22）
  // draftInfo：thinking/output 直取 submit_draft 参数（字段名不变，monitor 无感；text 保留正文通道原文，通常为空串）
  const draftInfo = (d) => {
    return {
      soul: d.soul.name, title: d.soul.title, provider: d.soul.provider, model: d.soul.model,
      reasoningEffort: d.reasoningEffort ?? null,
      reasoning: d.reasoning ?? '', reasoningChars: (d.reasoning ?? '').length,
      text: d.text ?? '', thinking: d.thinking ?? '', output: d.output ?? '',
      toolCalls: d.toolCalls ?? 0, tools: d.chunks ? toolCallsOf(d.chunks).map(t => t.name) : [], durationMs: d.durationMs ?? null,
      attempts: d.attempts ?? 1, retries: (d.retries ?? []).map(r => ({ attempt: r.attempt, error: r.error })),
      inner: (d.inner ?? []).map(t => ({ name: t.name, args: t.args, chars: t.chars, ok: t.ok, durationMs: t.durationMs, ...(t.reasoning ? { reasoning: t.reasoning } : {}) })),
      innerRounds: d.innerRounds ?? 0,
      ...(d.mend ? { mend: d.mend } : {}),
      ...(d.truncated ? { truncated: true } : {}),
      ...(d.error ? { error: d.error, timedOut: !!d.timedOut } : {}),
    }
  }
  /**
   * T4 UI 心跳：包住一段「无流式输出的等待」（表决 / 补枪 / 收官补一轮），期间周期性发 phase:'status'。
   * 返回 stop()——收尾时调；只有真的发过拍子才补一个 ended 事件把 Live 条上的状态清掉。
   * 纯监控面：不进正文、不进历史、不碰任何模型请求；定时器 unref，不拖住进程退出。
   */
  const heartbeat = (stage, extra = {}) => {
    if (!(cfg.statusHeartbeatMs > 0)) return () => {}
    const t0 = Date.now()
    let beat = false
    const timer = setInterval(() => {
      beat = true
      report({ phase: 'status', stage, elapsedMs: Date.now() - t0, ...extra })
    }, cfg.statusHeartbeatMs)
    timer.unref?.()
    return () => {
      clearInterval(timer)
      if (beat) report({ phase: 'status', stage, elapsedMs: Date.now() - t0, ended: true, ...extra })
    }
  }
  const retryOpts = (stage, soul, extra) => ({
    retries: cfg.soulRetries, backoffMs: cfg.soulRetryBackoffMs,
    onRetry: ({ attempt, error, delayMs, next }) => {
      ctx.logger?.warn(`trisoul: 灵魂 ${soul.name} ${stage} 第 ${attempt} 次失败（${error}），${fmtMs(delayMs)} 后第 ${next} 次尝试`)
      report({ phase: 'retry', stage, soul: soul.name, attempt, error, delayMs, next })
    },
    ...extra,
  })

  // ---- 内层工具（辩论期取证，⑬ 官位专属 only）----
  const agentOf = () => { try { return options.sessionId !== undefined ? ctx.agents?.get(options.sessionId) : undefined } catch { return undefined } }
  const innerEnabled = cfg.innerEvidence !== false && typeof ctx.tools?.execute === 'function' && !!agentOf()
  // ---- H 三官专属工具（专属排他；off 档无 officer = 零变化）----
  // 博识透传判据：主请求工具里真有联网工具才放行——netjail/未配置时自动降级回基础套（红线：评测下绝不联网）
  const mainToolNames = new Set((Array.isArray(options.tools) ? options.tools : []).map(t => t?.name).filter(Boolean))
  const webAllowed = WEB_TOOLS.filter(t => mainToolNames.has(t))
  /** ①（2026-08-23）该魂的专属工具名单（内层白名单/教学块/指引同源）；无官位 = 空 */
  const dedicatedToolsFor = (soul) => {
    if (!soul.officer || !innerEnabled) return []
    if (soul.officer === 'align') return [TASK_ORIGINAL_TOOL]
    if (soul.officer === 'erudite') return webAllowed
    if (soul.officer === 'empiric') return [RUN_VERIFY_TOOL]
    return []
  }
  // 隐藏工具栏（工单 v5）——面板豁免宿主工具与动作工具清单：
  // trisoul_recall 原豁免直调（检查点头/记忆注入教「call trisoul_recall」；它本就是只读取证），
  // 2026-08-25 用户令暂时撤出取证面（病例 9bd772f3：recall 变参内环空转）——名单改走 cfg.exemptHostTools
  // （默认空）；撤出后 recall 回落 actions 栏（放行后外层执行），检查点头教的取回通道仍可兑现。
  // write/edit 从 actions 清单剔除（大字符串埋深必崩，被 files/edits 顶层栏顶替）。
  const HOST_EXEMPT_NAMES = cfg.exemptHostTools
  const hostTools = Array.isArray(options.tools) ? options.tools : []
  const exemptHost = hostTools.filter(t => HOST_EXEMPT_NAMES.includes(t?.name))
  const exemptNames = exemptHost.map(t => t.name)
  const actionTools = hostTools.filter(t => t?.name && !HOST_EXEMPT_NAMES.includes(t.name) && t.name !== 'write' && t.name !== 'edit')
  /** 该魂的内层白名单（官位专属 + 面板豁免宿主工具）：白名单内=当场直调执行；其余真调用=违规剥丢 */
  const innerAllowFor = (soul) => new Set([...dedicatedToolsFor(soul), ...exemptNames])
  /** 该魂需要额外注入 schema 的私有工具（web 工具 schema 已在主请求 tools 里，不重复注） */
  const privateSchemasFor = (soul) => {
    if (!soul.officer || !innerEnabled) return []
    if (soul.officer === 'align') return [taskOriginalSchema()]
    if (soul.officer === 'empiric') return [runVerifySchema()]
    return []
  }
  /** B7（工单 v5 重写）工具分类教学（system 尾部，人设块后）：三分法——面板工具=当场私下出结果；
   *  执行栏=放行后系统代发、结果下步回、直调会被丢弃；submit_draft=唯一交稿通道。
   *  只此一处讲清三类；宿主 system 若有工具使用泛论，以此段压制。 */
  const toolClassesHint = (soul) => {
    const dedicated = dedicatedToolsFor(soul)
    const panel = [...dedicated, ...exemptNames]
    const ded = dedicated.length
      ? ` ${dedicated.join(' / ')} is your dedicated check — it answers immediately and privately while you draft, before you commit to a conclusion.`
      : ''
    return `\n\n## How your tools work\nYour tools fall into distinct classes — knowing which is which keeps a step clean:\n- Panel tools${panel.length ? ` (${panel.join(' / ')})` : ''}: executed immediately when called directly — your evidence channel for this very turn; call them when you need an answer now.${ded} Only the tools on this panel work this way — any other tool name issued directly (a read included) is discarded; route it through the execution fields.\n- Execution fields (actions / files / edits on submit_draft): real moves on the world. The system issues them after release, so their results arrive at your next step — record them and move on, never wait. A tool call issued directly is NOT executed — it is discarded; the fields are the only way to act.\n- submit_draft: the delivery channel — every reply includes it.`
  }
  /** 官位专属工具介绍（system 尾部；2026-08-25 定稿 P8–P10）：只陈述功能+存在理由（blurb 融合），
   *  何时用由模型自己决定——「让模型自己决定用什么不用什么，而不是写一堆提示词限制模型什么时候干什么」。 */
  const officerHint = (soul) => {
    if (!soul.officer || !innerEnabled) return ''
    if (soul.officer === 'align') return `\n\n## Dedicated tool\n${TASK_ORIGINAL_TOOL} returns the verbatim text of every user message in this session — a numbered complete list, newest last, untouched by compression. No parameters. It exists because of you: as you work you drift — wandering off on your own reading, shrinking the requirements without noticing — and after context compression all you hold is a paraphrase; this tool puts the actual words back in front of you, so you can study the user's intent from what they actually said and check your work against it.`
    if (soul.officer === 'erudite') return webAllowed.length
      ? `\n\n## Dedicated tool\n${webAllowed.join(' / ')} search the web and fetch pages, turning "I don't know" into "it's in my context" — sourced facts beyond your own knowledge. They exist because of you: your knowledge has a boundary, and past it, facts written from memory are made up — without you noticing, because the wrong parts come out with the same fluency and the same certainty as the right ones.`
      : ''
    if (soul.officer === 'empiric') return `\n\n## Dedicated tool\n${RUN_VERIFY_TOOL} tests code against reality with a real, read-only check — it never executes your code. kind is required, one of two: node-check runs node --check on a js/mjs/cjs file you just wrote to catch syntax errors (requires file, relative to the session working directory); tsc-noemit runs the project-local tsc --noEmit to catch type errors (cwd optionally points at a subproject). It exists because of you: your multi-step reasoning goes wrong without you noticing, and re-checking in your head uses the same head — one run tells you directly whether you're right, instead of re-reading with the same eyes that wrote it.`
    return ''
  }
  /** ①分岔直令的按魂定制参数：专属工具名单 + 该官位的工具说明；无官位/降级 → undefined（退化为只有路径 2+格式块） */
  const dedicatedOrderFor = (soul) => {
    const names = dedicatedToolsFor(soul)
    if (!names.length || !DEDICATED_BLURBS[soul.officer]) return undefined
    return { label: names.join(' / '), blurb: DEDICATED_BLURBS[soul.officer] }
  }
  /** 该魂的取证面板 schema（软路线=上面板的真工具；JSON 路=evidence 字段的 name enum 与参数说明书取材源）：
   *  豁免宿主工具（trisoul_recall）+ 官位专属宿主工具（博识 web 透传，此前靠继承全量 tools，单工具化后须显式加回）
   *  + officer 私有 schema。两条路线同源同集——一条路上能当场问的，另一条路上也能。 */
  const panelSchemasFor = (soul) => {
    const dedNames = dedicatedToolsFor(soul)
    return [...exemptHost, ...hostTools.filter(t => dedNames.includes(t?.name)), ...privateSchemasFor(soul)]
  }
  /** T2：这一魂这一轮走不走 JSON 强制输出。逐魂判而不是逐轮判——精细模式下三魂可以落在不同渠道上。 */
  const jsonModeFor = (soul) => usesJsonSchema(soul.provider, cfg.jsonSchemaProviders)
  /**
   * 盲写/独走/收官补一轮调用的完整 hint 与工具面（T2 起按渠道分岔）：
   * - JSON 路（白名单渠道）：面板**必须清空**——2026-08-25 实测 tools 在场时 json_schema 锁即失效
   *   （模型改发工具调用、JSON 缺失），所以「撤 tools」不是选择而是锁成立的前提；
   *   取证改走 evidence 字段，onPayload 给请求挂上 text.format 的语法锁。
   * - 软路线（其余渠道）：工单 v5 单工具面板原样保留，一个字节不改。
   */
  /** JSON 路 system 尾的环境块：cwd/平台/日期三件事实。真机两度为 `find -printf` 白付一轮（魂靠撞墙才知在 macOS）——
   *  CC 同款治法：开局给 Platform 一行。跨轮恒定（日期按天变），提供方前缀缓存照常命中。 */
  const envBlock = () => {
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return `\n\n## Environment\nWorking directory: ${sessionCwd()}\nPlatform: ${process.platform === 'darwin' ? 'macOS (darwin)' : process.platform}\nToday: ${today}`
  }
  const soulDraftExtra = (soul) => {
    const panel = panelSchemasFor(soul)
    if (jsonModeFor(soul)) {
      // 最小核：system 只剩人设+环境块，每步注入为零（order null）——字段语义全住 schema description
      return {
        hint: envBlock(),
        tools: [],
        onPayload: jsonSchemaPayload(draftJsonSchema(actionTools, innerEnabled ? panel : [])),
        order: null,
      }
    }
    return {
      hint: toolClassesHint(soul) + officerHint(soul) + draftDiscipline,
      tools: [...panel, submitDraftToolSchema(actionTools)],
      order: submitFirstOrder(dedicatedOrderFor(soul)),
    }
  }
  const sessionCwd = () => {
    const s = agentOf()?.session
    return s?.header?.cwd ?? s?.cwd ?? process.cwd()
  }
  /** 执行一次内层工具调用：结果原文全量喂回（⑬ 预算闸已拆，永不截断）；任何异常都变成 isError 结果喂回（灵魂自己决定怎么办） */
  const execInner = async (soul, call, signal) => {
    const t0 = Date.now()
    let text, isError = false
    try {
      let args
      try { args = call.arguments ? JSON.parse(call.arguments) : {} } catch { throw new Error(`Tool arguments are not valid JSON: ${argsSummary(call.arguments)}`) }
      const agent = agentOf()
      if (!agent) throw new Error('No agent bound to this request; inner tools unavailable')
      if (call.name === TASK_ORIGINAL_TOOL) {
        // 对齐官私有工具：插件内直接从会话全量日志抽用户原文，不经外层工具注册表
        text = taskOriginalText(agent.session)
      } else if (call.name === RUN_VERIFY_TOOL) {
        // 实证官私有工具：窄白名单只读检查（node --check / 本地 tsc --noEmit）
        const r = await runVerify(args, sessionCwd(), signal)
        text = r.text || '(no output)'
        isError = !r.ok
      } else {
        const r = await ctx.tools.execute({ callId: `inner-${soul.name}-${call.id ?? Date.now()}`, name: call.name, arguments: args, agent, signal: signal ?? new AbortController().signal })
        text = toolResultText(r?.content) || '(no output)'
        isError = r?.isError === true
      }
    } catch (e) { text = `Error: ${String(e?.message ?? e)}`; isError = true }
    return { name: call.name, args: argsSummary(call.arguments), chars: text.length, ok: !isError, durationMs: Date.now() - t0, text, isError, id: call.id }
  }
  /**
   * 一次灵魂稿（盲写/独走/收官补一轮）+ 取证循环：稿里若只含该魂官位专属工具 → 本插件执行、结果喂回该魂私有上下文、让它续写；
   * 直到它给出不含内层调用的最终稿。返回最终稿 + inner 轨迹。
   */
  // 落笔纪律（四格封皮版，2026-08-22）：内容只从 submit_draft 参数进来；拆格子让「要点全不全」变成表格结构。
  //（原生思考仍留在 reasoning 通道，插件内部可见、不外传；网关无解码级强制——缺封皮由补枪兜出口，见 draftWithInner）
  // 落笔纪律（三格 v2.1 英文版，2026-08-23）：内容只从 submit_draft 参数进来；新框架语直接英文写（⑨）。
  //（原生思考仍留在 reasoning 通道，插件内部可见、不外传；网关无解码级强制——缺封皮由补枪兜出口，见 draftWithInner）
  const draftDiscipline = `\n\n## Delivery discipline (hard requirement)\nEvery reply must include a call to submit_draft — your only delivery channel. Your distilled thinking and the user-facing prose come only from its parameters; words written in the plain-text body are not accepted:\n- findings: what you newly established this step — the concrete facts and observations that drove the decision; a path you ruled out and a suspicion you haven't verified count too; don't restate what's already established.\n- plan: your plan going forward — how you intend to proceed after this step, at whatever depth you've thought it through, key code included; what you don't record here is gone once this step ends. Leave it empty when you genuinely have none — never pad it.\n- action: the one concrete move you're making right now, matching the entries in the execution fields; one sentence.\n- output: the prose delivered to the user — respond in the user's language; only this field reaches the user. May be empty on a pure action step, but when there's something to say, say it plainly: what you did, what you saw, what you need next.\nfindings and action must be non-empty. Distillation compresses wording, not content — length tracks difficulty; never pad.\nReal actions (reading files, running commands, writing or modifying files) go in the actions/files/edits fields of submit_draft — never as directly issued tool calls: a direct call is NOT executed, it is discarded. Field entries execute after release, so their results do not come back within this turn — never hold back your submission waiting for results; you're recording what you decided to do and why, and that stands the moment the step is submitted. One submit_draft call carries it all: the envelope fields plus the execution fields. A reply without submit_draft is an unfinished step — nothing in it can be delivered until the submission arrives.`
  const draftWithInner = async (soul, stage, optsFor) => {
    const trail = []
    // 空调用判定要对照工具 schema 的 required——按名索引该魂的取证面（host 透传 + officer 私有）
    const panelByName = new Map(panelSchemasFor(soul).map(t => [t?.name, t]))
    const t0 = Date.now()
    let rounds = 0
    const json = jsonModeFor(soul)   // T2：这一魂走 JSON 强制输出还是软路线（渠道决定，轮内不变）
    // 病例 05b705a2（08-25「你好」场）：B 魂 evidence 同 query 五连发直到用户 abort——取证轮内无写操作，
    // 同 name+arguments 幂等零信息增益，重复请求不执行、按交稿收口（测试里同款剧本不判重会膨胀到 OOM）。
    const seenEvidence = new Set()
    const allow = innerAllowFor(soul)   // H：白名单按魂（officer 专属排他；无 officer = 基础套）
    let extraMessages = []
    let lastOpts
    // 封皮出口保证（2026-08-23 夜改版：③兜底 1 发+实答代填，补枪三连废除——f850 实录 5/54 步三连全灭失联，
    // 模型把 mend 请求当「继续干活」回正经下一步思考，重试同分布无用）：盲写流按模型天性收——
    // essay / 纯工具 / 带封皮都先收下；最终稿缺封皮（没调 submit_draft / 三格有空）→ 不重写全稿，
    // 同上下文追加③兜底直令的单工具请求，只发 1 次（传输层真故障照旧走 soulRetries——断流/空响应/超时是病不是格式）；
    // 回来仍缺封皮 → autofillEnvelope 实答代填（reasoning=模型实答，action 从已发真工具调用抽取），封皮失联归零。
    // T2：JSON 路上语法锁保证交稿合法，B9 补枪从「依从性防线」退成**解析失败兜底一枪**——
    // 只在 JSON 真的没解出来（桥补丁不在位而锁没挂上 / 被输出上限截断）时才发，面板照旧空、锁照旧挂。
    const mendJson = async () => callSoul(ctx, () => ({
      ...lastOpts,
      messages: [...lastOpts.messages, ...extraMessages, mkMsg(`mend-${soul.name}`, 'Format error — your last reply was not a single well-formed JSON object. Resend this step as one JSON object matching the required schema, nothing before it and nothing after it.')],
    }), timeout, retryOpts('mend', soul, {}))
    const mendEnvelope = async (d) => {
      if (json) return mendJson()
      const stamp = Date.now()
      // 二期（工单 v5）：传入稿的违规直调块已在上游剥除，blocks 里不再有真调用——旧「悬空调用配占位结果」
      // 机制（(Action recorded as this step's proposal…) 假结果）随之退役，少一处对模型说假话。
      const blocks = assistantBlocksOf(d.chunks)
      const mendMsgs = []
      if (blocks.length) {
        mendMsgs.push(Object.freeze({ id: `trisoul-mend-a-${soul.name}-${stamp}`, role: 'assistant', content: Object.freeze(blocks), source: Object.freeze({ kind: 'plugin', plugin: 'trisoul-consensus' }) }))
      }
      // C1：带回本步至今的思考原文（assistantBlocksOf 剥掉了 reasoning，填表这一发本来是断片的）
      const raw = String(d.reasoning ?? '').trim()
      if (raw) mendMsgs.push(rawCarryMessage(soul, stamp, raw))
      // ③ 兜底填表直令（B9 二期语境扩：封皮缺失或动作发错位置，动作重交进三栏；无封皮校验重试——1 发收啥算啥，缺了代填）
      mendMsgs.push(mkMsg(`mend-${soul.name}`, `Format error — your actions were issued in the wrong place or the envelope is missing. Use the submit_draft tool to resubmit: put everything to execute in its actions/files/edits fields (directly issued calls have been discarded), and fill the envelope fields.
${submitFormatBlock(SPAN_SO_FAR)}`))
      return callSoul(ctx, () => ({
        ...lastOpts,
        tools: [submitDraftToolSchema(actionTools)],
        messages: [...lastOpts.messages, ...extraMessages, ...mendMsgs],
      }), timeout, retryOpts('mend', soul, {}))
    }
    // 盲写实况（draft-delta，2026-08-25 用户拍板真流式）：每魂 ≥250ms 一帧快照进监控事件流；
    // round = 第几发盲写（取证后重发递增），attempt 由 callSoul 挂上（重试时 UI 按它清屏重来）
    const liveFire = liveGate((snap) => report({ phase: 'draft-delta', stage, soul: soul.name, ...snap }))
    for (;;) {
      const d = await callSoul(ctx, () => {
        lastOpts = optsFor(soul)
        return extraMessages.length ? { ...lastOpts, messages: [...lastOpts.messages, ...extraMessages] } : lastOpts
      }, { ...timeout, onDelta: (s) => liveFire({ round: rounds + 1, ...s }) }, retryOpts(stage, soul, {}))
      // ---- T2 JSON 路：整条回复就是一个 JSON 对象；取证请求走 evidence 字段（面板是空的，调用物理发不出去）----
      let jsonSub = null, jsonFin = null
      if (json) {
        jsonSub = parseJsonDraft(d.text)
        const want = jsonSub?.evidence
        // canonJson 键序规范化：evRepeat 是取证循环仅剩的刹车（innerRounds 默认不限），模型两次同参但键序不同不得绕过防抖
        const evKey = want ? `${want.name} ${JSON.stringify(canonJson(want.arguments ?? {}))}` : ''
        const evRepeat = !!want && seenEvidence.has(evKey)
        // 空调用（2026-08-25 用户令「空的应该也是不执行」）：required 参数空 = 与 null 同等对待
        const evEmpty = !!want && allow.has(want.name) && emptyRequiredArgs(panelByName.get(want.name), want.arguments)
        // 取证多轮化与软路线同一套账（rounds / innerRounds 上限 / trail / inner 事件）——换的只是请求取证的语法
        if (innerEnabled && !evRepeat && !evEmpty && (!(cfg.innerRounds > 0) || rounds < cfg.innerRounds) && want && allow.has(want.name)) {
          seenEvidence.add(evKey)
          const stamp = Date.now()
          const r0 = await execInner(soul, { name: want.name, arguments: JSON.stringify(want.arguments ?? {}), id: `ev-${soul.name}-${stamp}` }, lastOpts.signal)
          // 盲写多步思考链外传（2026-08-25 用户令）：这一取证轮的 raw 思考挂上 trail 与 inner 事件——
          // 「模型为什么选取证路」的第一手原料，此前只回灌私有上下文、监控看不见
          const r = { ...r0, reasoning: String(d.reasoning ?? '') }
          rounds++
          trail.push(r)
          report({ phase: 'inner', stage, soul: soul.name, round: rounds, evidence: true, reasoning: r.reasoning, calls: [{ name: r.name, args: r.args, chars: r.chars, ok: r.ok, durationMs: r.durationMs }] })
          ctx.logger?.info(`trisoul: 灵魂 ${soul.name} ${stage} 内层取证第 ${rounds} 轮（evidence 字段）：${r.name}(${r.args}) ${fmtK(r.chars)} 字${r.ok ? '' : ' ✗'}`)
          extraMessages = [
            ...extraMessages,
            // 它自己上一轮的 JSON 原样回灌（保持这一轮的连贯）；结果只能走普通 user 消息——
            // 这条路上没有 tool-call 可配对，发 tool-result 会留下孤儿 result 被提供方 400
            Object.freeze({ id: `trisoul-inner-a-${soul.name}-${stamp}`, role: 'assistant', content: Object.freeze([Object.freeze({ type: 'text', text: String(d.text ?? '') })]), source: Object.freeze({ kind: 'plugin', plugin: 'trisoul-consensus' }) }),
            evidenceResultMessage(soul, stamp, r),
            ...(String(d.reasoning ?? '').trim() ? [rawCarryMessage(soul, stamp, String(d.reasoning).trim())] : []),
            // 最小核：喂回不再挂直令——结果消息即事件本身,下一稿仍被 schema 强制,继续查还是交稿由模型自决
          ]
          continue
        }
        // 点名了白名单外的工具（enum 本该挡住——挡不住说明锁没挂上）：不执行、不报错，如实记一笔就当交稿
        if (want && !allow.has(want.name)) {
          ctx.logger?.info(`trisoul: 灵魂 ${soul.name} ${stage} evidence 点名了取证面之外的 ${want.name} —— 未执行，按交稿处理`)
        }
        // 同参重复取证（死循环病）：不执行，如实记一笔就当交稿——封皮用的就是这一稿自己的
        if (evRepeat) {
          ctx.logger?.info(`trisoul: 灵魂 ${soul.name} ${stage} evidence 重复了已执行过的取证 ${want.name} —— 未执行，按交稿收口`)
        }
        // 空调用：required 参数缺失/空值——不执行，如实记一笔就当交稿（与 null 同等对待）
        if (evEmpty && !evRepeat) {
          ctx.logger?.info(`trisoul: 灵魂 ${soul.name} ${stage} lookup 点名 ${want.name} 但必填参数为空 —— 未执行，按交稿收口`)
        }
        // 交稿：原始 JSON 文本块整块剥掉——它是封皮，不是给用户看的话。剥掉之后 fin 的形状与软路线逐字一致
        //（只剩 reasoning + usage + finish，动作块随后由三栏合成塞进来），下游指纹/候选卡/放行/监控零分叉。
        const textIdx = new Set()
        for (const c of d.chunks) {
          if (c.type === 'block-start' && c.blockType === 'text') textIdx.add(c.index)
          else if (c.type === 'block-end' && c.block?.type === 'text') textIdx.add(c.index)
        }
        jsonFin = { ...d, text: '', chunks: d.chunks.filter(c => !(typeof c.index === 'number' && textIdx.has(c.index))) }
      }
      let calls = json ? [] : toolCallsOf(d.chunks)
      // C2 取证多轮化（2026-08-25，推翻 08-23「两路固定节奏」单轮拍板）：只要这一稿全是专属调用就继续挖，
      // 每轮喂回挂②二选一直令由模型自己决定收口。innerRounds 默认 0=不限（参数纪律：不设保守默认，
      // 0=关出口）；设了正数就是轮数上限，超出后的专属调用回落混合稿防呆（照常执行、块剥除、缺封皮走补枪）。
      const roundsLeft = !(cfg.innerRounds > 0) || rounds < cfg.innerRounds
      const allInner = innerEnabled && roundsLeft && calls.length > 0 && calls.every(c => allow.has(c.name))
      if (allInner) {
        const results = await Promise.all(calls.map(c => execInner(soul, c, lastOpts.signal)))
        rounds++
        // 思考链外传：一发多调用时挂该轮第一条（同发同思考，逐条重复只会白涨事件体积）
        results.forEach((r, i) => trail.push(i === 0 ? { ...r, reasoning: String(d.reasoning ?? '') } : r))
        report({ phase: 'inner', stage, soul: soul.name, round: rounds, reasoning: String(d.reasoning ?? ''), calls: results.map(r => ({ name: r.name, args: r.args, chars: r.chars, ok: r.ok, durationMs: r.durationMs })) })
        ctx.logger?.info(`trisoul: 灵魂 ${soul.name} ${stage} 内层取证第 ${rounds} 轮：${results.map(r => `${r.name}(${r.args}) ${fmtK(r.chars)} 字${r.ok ? '' : ' ✗'}`).join('；')}`)
        const stamp = Date.now()
        extraMessages = [
          ...extraMessages,
          Object.freeze({ id: `trisoul-inner-a-${soul.name}-${stamp}`, role: 'assistant', content: Object.freeze(assistantBlocksOf(d.chunks)), source: Object.freeze({ kind: 'plugin', plugin: 'trisoul-consensus' }) }),
          Object.freeze({ id: `trisoul-inner-r-${soul.name}-${stamp}`, role: 'user', source: Object.freeze({ kind: 'plugin', plugin: 'trisoul-consensus' }),
            content: Object.freeze(results.map(r => Object.freeze({ type: 'tool-result', toolCallId: r.id, isError: r.isError, content: Object.freeze([Object.freeze({ type: 'text', text: r.text })]) }))) }),
          // C1：思考非空则带回本轮思考原文（off 档无思考不附）
          ...(String(d.reasoning ?? '').trim() ? [rawCarryMessage(soul, stamp, String(d.reasoning).trim())] : []),
          evidenceReturnOrder(dedicatedOrderFor(soul)),   // ② 取证喂回末尾恒挂二选一直令（继续挖 / 交稿+动作）
        ]
        continue
      }
      // ③ 混合稿防呆（2026-08-23）：专属工具与真动作/交稿同稿——专属调用照常当场执行（结果进私有上下文，
      // 补枪封皮能参考），调用块随稿剥除（外层不认识私有工具，漏出去 = 坏步）；真动作照旧随稿放行。
      let fin = jsonFin ?? d
      const mixedCalls = innerEnabled ? calls.filter(c => allow.has(c.name)) : []
      if (mixedCalls.length > 0) {
        const results = await Promise.all(mixedCalls.map(c => execInner(soul, c, lastOpts.signal)))
        rounds++
        results.forEach((r, i) => trail.push(i === 0 ? { ...r, reasoning: String(d.reasoning ?? '') } : r))
        report({ phase: 'inner', stage, soul: soul.name, round: rounds, mixed: true, reasoning: String(d.reasoning ?? ''), calls: results.map(r => ({ name: r.name, args: r.args, chars: r.chars, ok: r.ok, durationMs: r.durationMs })) })
        ctx.logger?.info(`trisoul: 灵魂 ${soul.name} ${stage} 混合稿内层取证：${results.map(r => `${r.name}(${r.args}) ${fmtK(r.chars)} 字${r.ok ? '' : ' ✗'}`).join('；')}（真动作照旧随稿放行）`)
        const stamp = Date.now()
        extraMessages = [
          ...extraMessages,
          Object.freeze({ id: `trisoul-inner-a-${soul.name}-${stamp}`, role: 'assistant', content: Object.freeze(mixedCalls.map(c => Object.freeze({ type: 'tool-call', id: c.id, name: c.name, arguments: c.arguments ?? '{}' }))), source: Object.freeze({ kind: 'plugin', plugin: 'trisoul-consensus' }) }),
          Object.freeze({ id: `trisoul-inner-r-${soul.name}-${stamp}`, role: 'user', source: Object.freeze({ kind: 'plugin', plugin: 'trisoul-consensus' }),
            content: Object.freeze(results.map(r => Object.freeze({ type: 'tool-result', toolCallId: r.id, isError: r.isError, content: Object.freeze([Object.freeze({ type: 'text', text: r.text })]) }))) }),
        ]
        const dropIdx = new Set()
        for (const c of d.chunks) if (c.type === 'block-end' && c.block?.type === 'tool-call' && allow.has(c.block.name)) dropIdx.add(c.index)
        fin = { ...d, chunks: d.chunks.filter(c => !(typeof c.index === 'number' && dropIdx.has(c.index))) }
        calls = toolCallsOf(fin.chunks)
      }
      // 违规直调（隐藏工具栏，工单 v5）：非豁免真调用=动作发错了位置——剥除丢弃（与直令「直调会被丢弃」
      // 言行一致，宽容代收会让模型永远学不会）；名单记下供 mend 直令语境与代填如实自述。
      const violated = toolCallsOf(fin.chunks).map(c => c.name)
      if (violated.length) {
        const dropIdx = new Set()
        for (const c of fin.chunks) if (c.type === 'block-end' && c.block?.type === 'tool-call' && c.block.name !== SUBMIT_TOOL) dropIdx.add(c.index)
        fin = { ...fin, chunks: fin.chunks.filter(c => !(typeof c.index === 'number' && dropIdx.has(c.index))) }
        report({ phase: 'violation', stage, soul: soul.name, calls: violated })
        ctx.logger?.info(`trisoul: 灵魂 ${soul.name} ${stage} 直调违规（${violated.join(', ')}）——调用已剥除丢弃，动作以 submit 三栏为准`)
      }
      // 最终稿（不含内层调用与违规直调）：四格+三栏直取工具参数；缺封皮 → 补枪（截断稿同样补——封皮是新请求，不吃已耗尽的上限）
      let sub = json ? jsonSub : submitArgsOf(fin)
      // JSON 路最小核：非空校验退场（四格皆可空,凑数病的根在「必须写点什么」）——
      // 只有解析失败（语法锁没兜住：桥补丁不在位 / 被输出上限截断）才补枪；软路线照旧走 envelopeError
      const missing = json ? (!sub ? 'JSON 交稿解析失败：回复不是一个合法 JSON 对象' : undefined) : envelopeError(sub)
      let mend
      if (missing) {
        // kind:'staged' = 没调交稿（二期常见于违规直调后收流——动作发错位置被剥，封皮缺失）；
        // kind:'blank' = 真坏稿（调了交稿但格有空）。两者都补 1 发，仍缺 → 实答代填（失联归零）。
        const kind = sub ? 'blank' : 'staged'
        const t0m = Date.now()
        let md = null
        // T4：补枪是又一次完整请求，期间流上一个字都没有——发心跳让 UI 分得清「在补」与「死了」
        const stopBeat = heartbeat('mend', { soul: soul.name, from: stage })
        try { md = await mendEnvelope(fin) } catch { /* 传输层重试耗尽也不失联：代填退原稿实答 */ }
        finally { stopBeat() }
        sub = md ? (json ? parseJsonDraft(md.text) : submitArgsOf(md)) : null
        // JSON 路只认「解析得出」；软路线仍卡非空封皮
        const autofilled = json ? !sub : !!envelopeError(sub)
        if (autofilled) sub = autofillEnvelope(fin, md, violated)
        mend = { kind, reason: missing, attempts: md?.attempts ?? 1, durationMs: Date.now() - t0m, ...(autofilled ? { autofilled: true } : {}) }
        report({ phase: 'mend', stage, soul: soul.name, kind, reason: missing, attempts: mend.attempts, durationMs: mend.durationMs, ...(autofilled ? { autofilled: true } : {}) })
        ctx.logger?.info(autofilled
          ? `trisoul: 灵魂 ${soul.name} ${stage} 兜底未交封皮，实答代填（${missing}；findings ${sub.findings.length} 字）`
          : kind === 'staged'
            ? `trisoul: 灵魂 ${soul.name} ${stage} 两段收稿（封皮第 ${md.attempts} 次请求交回）`
            : `trisoul: 灵魂 ${soul.name} ${stage} 补枪成功（${missing}；第 ${md.attempts} 次）`)
      }
      // 隐藏工具栏合成（工单 v5）：三栏 → 标准 tool-call 块塞回稿 chunks（固定序 files→edits→actions）。
      // 此后指纹/免表决/收官/独走/候选卡/监控/放行重放照旧从 chunks 数调用，下游零改动。
      const bridge = bridgeCallsOf(sub, Date.now())
      if (bridge.length) {
        const base = Math.max(-1, ...fin.chunks.filter(c => typeof c.index === 'number').map(c => c.index)) + 1
        // 完整三件套（block-start/delta/end）：流协议要求块配对，光 block-end 过不了宿主与 validate 校验
        const blocks = bridge.flatMap((b, i) => [
          { type: 'block-start', index: base + i, blockType: 'tool-call' },
          { type: 'tool-call-delta', index: base + i, id: b.id, name: b.name, argumentsDelta: b.arguments },
          { type: 'block-end', index: base + i, block: { type: 'tool-call', id: b.id, name: b.name, arguments: b.arguments } },
        ])
        // 插在 finish 之前（finish 是流的终结符，块排它后面=非法流）
        const fi = fin.chunks.findIndex(c => c.type === 'finish')
        fin = { ...fin, chunks: fi >= 0 ? [...fin.chunks.slice(0, fi), ...blocks, ...fin.chunks.slice(fi)] : [...fin.chunks, ...blocks] }
      }
      // 取证稿/补枪稿的 durationMs = 全程；toolCalls 报真工具数（=三栏合成块数，不含 submit_draft 交稿通道与豁免取证）
      return {
        ...fin,
        durationMs: (rounds > 0 || mend) ? Date.now() - t0 : fin.durationMs,
        // 四格单独带出（下游要分格取用）：C3 直通条件看 plan 空否、C4 候选卡分格带标签
        findings: sub.findings, plan: sub.plan, submitted: sub.action,
        thinking: sub.thinking, output: sub.output,
        toolCalls: bridge.length, opts: lastOpts, inner: trail, innerRounds: rounds,
        ...(mend ? { mend } : {}),
      }
    }
  }

  /** 并发采集一批灵魂的完整响应（盲写 / 独走 / 收官补一轮）：起步按魂序错峰 soulStaggerMs 压瞬时突发（防提供方 burst 保护；独走单魂天然零延迟）；单魂失败自动重试；重试用尽仍失败/超时 → 该魂本轮失联，其余继续 */
  const gather = (soulList, stage, label, optsFor) => Promise.all(soulList.map((s, si) => {
    let t0 = Date.now()
    let lastOpts
    return sleep(si * cfg.soulStaggerMs)
      .then(() => { t0 = Date.now(); return draftWithInner(s, stage, (soul) => (lastOpts = optsFor(soul))) })
      .then(d => {
        ctx.logger?.info(`trisoul: 灵魂 ${s.name} ${label}完成 ${d.output.length} 字（思考 ${d.reasoning.length} 字，${d.durationMs}ms${d.attempts > 1 ? `，第 ${d.attempts} 次尝试` : ''}${d.truncated ? '，输出被上限截断' : ''}）`)
        return { soul: s, reasoningEffort: d.opts.reasoningEffort ?? null, ...d }
      })
      .catch(e => {
        const timedOut = e?.code === 'TIMEOUT'
        const error = timedOut ? e.message : describeErr(e)
        ctx.logger?.warn(`trisoul: 灵魂 ${s.name} ${label}${timedOut ? '超时' : '失联'} ${error}（已尝试 ${e?.attempts ?? 1} 次）`)
        return { soul: s, reasoningEffort: lastOpts?.reasoningEffort ?? null, error, timedOut,
          attempts: e?.attempts ?? 1, retries: e?.retries ?? [], durationMs: Date.now() - t0 }
      })
  }))
  const narrateDead = function* (dead, label) {
    for (const d of dead) {
      const tries = d.attempts > 1 ? `（已自动重试 ${d.attempts - 1} 次）` : ''
      yield* note(d.timedOut
        ? `[警告] 灵魂 ${d.soul.name} ${label}${d.error}${tries}，判为失联\n`
        : `[警告] 灵魂 ${d.soul.name} ${label}失联：${d.error}${tries}\n`)
    }
  }
  /** 重试后成功的灵魂：把过程写进旁白（失败原因 + 第几次成功），失联的由 narrateDead 说 */
  const narrateRetried = function* (list, label) {
    for (const d of list) {
      if (d.error || !(d.attempts > 1)) continue
      const why = (d.retries ?? []).map(r => `第 ${r.attempt} 次 ${r.error}`).join('；')
      yield* note(`[重试] 灵魂 ${d.soul.name} ${label}${why} → 自动重试，第 ${d.attempts} 次成功\n`)
    }
  }
  /** 补枪的灵魂：稿缺蒸馏封皮 → 单工具补交成功（依从率的真机可见面；高频出现 = 该模型盲写依从差） */
  /** 收稿旁白：常态两段式（staged）中性报一行；真坏稿（blank：调了交稿但三格有空）才标补枪并带原因 */
  const narrateMended = function* (list, label) {
    for (const d of list) {
      if (d.error || !d.mend) continue
      const again = d.mend.attempts > 1 ? `（第 ${d.mend.attempts} 次成功）` : ''
      yield* note(d.mend.autofilled
        ? `[代填] 灵魂 ${d.soul.name} ${label}兜底未交封皮 → 实答代填收稿\n`
        : d.mend.kind === 'blank'
          ? `[补枪] 灵魂 ${d.soul.name} ${label}${d.mend.reason} → 单工具补交封皮${again}\n`
          : `[收稿] 灵魂 ${d.soul.name} ${label}动作先发，封皮单工具交回${again}\n`)
    }
  }
  /** 取证轨迹：谁在盲写/重写期间私下查了什么（不含结果全文；结果只在该魂自己的私有上下文里） */
  const narrateInner = function* (list, label) {
    for (const d of list) {
      if (!d.inner?.length) continue
      const items = d.inner.map(t => `${t.name}(${argsSummary(t.args)})${t.chars ? ` ${fmtK(t.chars)} 字` : ''}${t.ok ? '' : ' ✗'}`).join('；')
      yield* note(`[取证] 灵魂 ${d.soul.name} ${label}内层 ${d.inner.length} 次${items ? `：${items}` : ''}\n`)
    }
  }
  /**
   * 旁白里的稿（四格直取 submit_draft 参数；thinking 已是三格拼合文——自带 结论/依据/排除 标签）。
   * 缺陷5（2026-08-24）：pending=盲写呈现——此刻还没表决，调用一个都没执行，最终也只有胜者那份会执行，
   * 而稿内叙事常带「已执行」口吻（autofill 的 Issuing the tool calls already sent: … 就是现成载体）。
   * f67bcad 的免责改造只覆盖 tips 通道，旁白通道这里补上标注；放行后才执行的独走/收官稿不标。
   * 只标有调用的稿：病因就是「被扣押的调用被写成已执行」，无调用的散文稿没有可执行的动作，标了是外延。
   * 缺陷4：工具调用型盲稿正文必空，空则整行不出——「输出：（无文本）」每魂一行纯噪音。
   */
  const narrateDrafts = function* (list, label, { pending = false } = {}) {
    for (const d of list) {
      const badge = d.toolCalls ? `（含 ${d.toolCalls} 个工具调用${pending ? ' · 尚未执行' : ''}）` : ''
      yield* note(`\n【${soulTitle(d.soul)}${label ? ` · ${label}` : ''}】${badge}${d.reasoningEffort ? `（effort ${d.reasoningEffort}）` : ''}${d.truncated ? '（输出被上限截断，稿不完整）' : ''}\n`)
      yield* note(`${d.thinking}\n`)
      if (d.output?.trim()) yield* note(`输出：${d.output}\n`)
    }
  }
  /**
   * 放行一份候选：done 事件 + 关旁白 + 重放。thinking/output 均取自 submit_draft 参数。
   * ①（2026-08-23）：每步都发一个**蒸馏思考块**（trisoul 标记，常驻历史——sanitize 永不剥）：
   * 短 raw（<SHORT_RAW_CHARS）直通原文、长 raw 换三格拼合文；工具步与收官步同样发。
   * ② Think 合一行（2026-08-23）：蒸馏块不再独立成块——旁白块 block-end 直接落蒸馏块（同一 index），
   * 主视图每步恰一行 Think（进行中=旁白流式，落库后=蒸馏链）；raw 也不再独立成块：replayReasoning='latest'
   * 时存进蒸馏块的 raw 暗字段（显示层永不渲染字段、session 档案全量留 raw），sanitize 对最新步展开折回。
   * 旁白全文随 done 事件进监控（narration）。trace=text/none 无旁白块时蒸馏块单独发。
   * 收官步（无真工具调用）：output 做正文；
   * 工具步：真工具调用照旧重放（submit_draft 是交稿通道不是动作，整块剥掉）；正文取封皮 output（非空则
   * 顶掉盲写正文原文——补枪常态化后真内容都在封皮里），output 为空串才落回重放 d.text。
   * 换块/剥块后块数与原流不一致 → finish.replayState 恒剥（pi-ai replayedAssistant 要求块数一致）。
   */
  const release = async function* (d, doneInfo) {
    const noTools = toolCallsOf(d.chunks).length === 0
    const replayReasoning = cfg.replayReasoning === 'latest' && (d.reasoning ?? '') !== ''
    report({ phase: 'done', winner: d.soul.name, finalText: d.output, narration: noteText, durationMs: Date.now() - startedAt, ...doneInfo })
    // 短 raw 直通不蒸（原生 p25≈310 字符）：raw 短就原样入历史零失真；长 raw 才换四格拼合文。
    // C3（2026-08-25）加 plan 空条件：raw 是「这一步想到了什么」，plan 是「下一步打算怎么干」——
    // 直通只搬 raw，plan 非空时直通等于把这一步刚想定的方案整段扔掉（正是本次改造要治的设计蒸发）。
    const raw = String(d.reasoning ?? '').trim()
    const planEmpty = !String(d.plan ?? '').trim()
    const distilled = (raw && raw.length < SHORT_RAW_CHARS && planEmpty) ? raw : (d.thinking ?? '')
    const merged = (distilled || replayReasoning)
      ? { type: 'reasoning', text: distilled, trisoul: DISTILLED_TAG, ...(replayReasoning ? { raw: d.reasoning } : {}) }
      : null
    const noteOpen = noteIndex !== null
    yield* closeNote(merged ?? undefined)
    if (merged && !noteOpen) {
      const i = nextIndex++
      yield { type: 'block-start', index: i, blockType: 'reasoning' }
      yield { type: 'reasoning-delta', index: i, text: distilled }
      yield { type: 'block-end', index: i, block: merged }
    }
    if (noTools) {
      // T3：无动作可放行的步，可见正文是这一步的全部产出——空了就用 action 顶上，再空落如实句（零输出结束不许发生）
      yield* text(releaseText(d.output, d.submitted))
      for await (const c of d.chunks) {
        if (c.type === 'usage') yield c
        else if (c.type === 'finish' && c.replayState !== undefined) { const { replayState, ...rest } = c; yield rest }
        else if (c.type === 'finish') yield c
      }
      return
    }
    // submit_draft 整块按 index 剔除；封皮 output 非空 → 它就是外发正文（盲写正文原文一并剔除、output 独立成块放最前）：
    // 补枪常态化后真内容都写在封皮里，盲写轮正文往往只是「我先看看」的过场话，照原文重放等于把稿子扣在思考里
    const dropped = new Set()
    const useEnvelopeText = (d.output ?? '') !== ''
    for (const c of d.chunks) {
      if (c.type !== 'block-end' || !c.block) continue
      if (c.block.type === 'tool-call' && c.block.name === SUBMIT_TOOL) dropped.add(c.index)
      else if (useEnvelopeText && c.block.type === 'text') dropped.add(c.index)
    }
    if (useEnvelopeText) yield* text(d.output)
    const kept = dropped.size ? d.chunks.filter(c => !dropped.has(c.index)) : d.chunks
    yield* replay(kept, { stripReplay: true, dropReasoning: true })
  }

  // 阶段 1：盲写（并发，互不可见；单魂失败/超时→降级继续）
  // start 必须在第一次 yield 之前发出：消费者可能拿到第一个 chunk 就停止，finally 里的 done 要有 start 配对
  report({
    phase: 'start', startedAt, prompt: promptOf(options.messages),
    // promptSeq = 本轮对应的用户原话事件 seq（监控按用户消息把多步 agent 循环归成一组；拿不到为 null）
    promptSeq: lastUserSeq(agentOf()?.session),
    souls: souls.map(s => ({ name: s.name, title: s.title, provider: s.provider, model: s.model })),
  })
  // 独走步（v2）：上一步挂账的 tips → 本次请求不跑共识，单发胜者魂（② tips=请求内末尾 user 直令），输出直接放行；
  // 胜者魂已不在列表 / 调用失联 → 丢弃 tips 落回下方正常共识步（同一轮流按共识结果收尾）
  if (pending) {
    const winner = souls.find(s => s.name === pending.winnerSoul)
    if (!winner) {
      yield* note(`${NOTE_MARK} 独走步：胜者灵魂 ${pending.winnerSoul} 已不在当前列表 → 丢弃 tips，回退共识\n`)
      ctx.logger?.warn(`trisoul: 独走步胜者 ${pending.winnerSoul} 不在列表，丢弃 tips 回退共识`)
    } else {
      yield* note(`${NOTE_MARK} 独走步 · 灵魂 ${winner.name} 单发（吸收上一步 ${pending.tips.length} 条 tips，无盲写无表决）\n`)
      const soloT0 = Date.now()
      const [d] = await gather([winner], 'draft', '独走 ', s =>
        // ② tips 走请求内末尾 user 直令（instruction 追加在 sanitize 后的消息尾）；system 与普通盲写一致=缓存命中
        soulOptions(options, s, 'draft', { ...soulDraftExtra(s), instruction: tipsMessage(pending.tips) }, cfg))
      report({ phase: 'solo', winner: winner.name, tips: pending.tips.length, durationMs: Date.now() - soloT0, ...(d.error ? { error: d.error } : {}) })
      if (!d.error) {
        report({ phase: 'draft', round: 1, solo: true, alive: [winner.name], dead: [], drafts: [draftInfo(d)] })
        yield* narrateRetried([d], '独走 ')
        yield* narrateMended([d], '独走 ')
        yield* narrateInner([d], '独走 ')
        yield* narrateDrafts([d], '独走稿')
        yield* release(d, { mode: 'solo', result: 'solo', rounds: 0, tips: pending.tips.length })
        return
      }
      yield* narrateDead([d], '独走 ')
      yield* note('[警告] 独走步失联 → 丢弃 tips，回退正常共识\n')
    }
  }
  // 缺陷3：固定配置口径只在会话首个共识步给全量，之后短版；拿不到 sessionId 就每步都当首步（宁重复勿漏报）
  const seen = options.sessionId != null ? notes.get(options.sessionId) : undefined
  yield* note(seen
    ? `${NOTE_MARK} ${souls.length === 1 ? '单魂启动 · 盲写' : `共识启动 · ${souls.length} 魂盲写`}\n`
    : `${NOTE_MARK} ${souls.length === 1 ? `单魂启动 · 灵魂 ${souls[0].name} 盲写` : `共识启动 · ${souls.length} 个灵魂并行盲写`}（无输出 ${fmtMs(cfg.soulIdleTimeoutMs)} 判失联 · 总上限 ${cfg.soulTimeoutMs > 0 ? fmtMs(cfg.soulTimeoutMs) : '不限'}${cfg.reasoningFuseChars > 0 ? ` · 思考超 ${cfg.reasoningFuseChars >= 10000 ? `${Math.round(cfg.reasoningFuseChars / 10000)} 万` : cfg.reasoningFuseChars} 字熔断` : ''} · 失败自动重试 ${cfg.soulRetries} 次${souls.length > 1 ? ' · 平票按轮次轮换定胜者' : ''}）\n`)
  // H 官位专属工具旁白：谁带什么加菜；博识在主请求无联网工具时如实标降级（netjail 评测下这是硬要求，不是容错）。
  // 缺陷3：配置没变就不重复报——空串也记，专属工具整体消失再回来同样算变化
  const narrateOfficers = () => souls.filter(s => s.officer).map(s => {
    const extra = s.officer === 'align' ? [TASK_ORIGINAL_TOOL] : s.officer === 'erudite' ? webAllowed : s.officer === 'empiric' ? [RUN_VERIFY_TOOL] : []
    return `${s.name}(${s.officer})${extra.length ? `+${extra.join('/')}` : '——降级（主请求无联网工具，本会话无内层）'}`
  }).join('，')
  const officerLine = (innerEnabled && souls.some(s => s.officer)) ? narrateOfficers() : ''
  if (officerLine && (!seen || seen.officerLine !== officerLine)) yield* note(`[官位] 专属工具：${officerLine}\n`)
  if (options.sessionId != null) notes.set(options.sessionId, { officerLine })
  const drafts = await gather(souls, 'draft', '盲写', s => soulOptions(options, s, 'draft', soulDraftExtra(s), cfg))
  let alive = drafts.filter(d => !d.error)
  const dead = drafts.filter(d => d.error)
  yield* narrateRetried(drafts, '盲写')
  yield* narrateMended(drafts, '盲写')
  yield* narrateInner(drafts, '盲写')
  yield* narrateDead(dead, '')
  report({
    phase: 'draft', round: 1,
    alive: alive.map(d => d.soul.name), dead: dead.map(d => d.soul.name),
    drafts: drafts.map(draftInfo),
  })
  // ⑫ 上下文框架（监控实时面板）：本步盲写主请求的消息结构投影 + 各魂 usage
  //（cacheReadTokens 画前缀缓存命中分界线；各魂 messages 相同、只差 persona system，投影取任一份即可）
  {
    const frameOpts = drafts.find(d => d.opts)?.opts
    if (frameOpts) report({ phase: 'context', frame: contextFrameOf(frameOpts),
      souls: drafts.filter(d => d.usage).map(d => ({ soul: d.soul.name,
        inputTokens: d.usage.inputTokens ?? null, cacheReadTokens: d.usage.cacheReadTokens ?? null })) })
  }
  if (alive.length === 0) {
    yield* note('[警告] 所有灵魂失联，降级为单路\n')
    report({ phase: 'done', mode: 'fallback', result: 'all-dead', durationMs: Date.now() - startedAt })
    yield* closeNote()
    // 兜底走主路由：messages 同样去污染；无 purpose 会重入本插件的瀑布监听，用 PASSTHROUGH 标记穿透
    const fallback = { ...options, messages: sanitizeMessages(options.messages, cfg) }
    PASSTHROUGH.add(fallback)
    yield* replay(ctx.llm.stream(fallback), { stripReplay: nextIndex > 0 })
    return
  }
  if (alive.length === 1) {
    // 配置态单魂（2026-08-27 放开）与「多魂死剩一个」分开记账：前者是正常形态（mode:'single'，不进降级指标），后者才是降级
    if (souls.length === 1) {
      yield* note(`[单魂] 灵魂 ${alive[0].soul.name} 直接放行（无表决）\n`)
      yield* release(alive[0], { mode: 'single', result: 'single' })
      return
    }
    yield* note(`[警告] 仅灵魂 ${alive[0].soul.name} 存活，直接放行\n`)
    yield* release(alive[0], { mode: 'fallback', result: 'single' })
    return
  }
  yield* note(`[盲写] ${alive.length} 个灵魂完成: ${alive.map(d => d.soul.name).join(', ')}\n`)
  yield* narrateDrafts(alive, '', { pending: true })

  // 阶段 2：表决，全程仅 1 次——每魂 1 票、只投别人（候选卡不含自己那份）→ 票数最高放行；
  // 平票（≥3 魂 1-1-1 环投 / 2 魂互不放行）/ 全员弃权 → 按「对话轮次+表决轮」错位轮换取一份直接放行（v2 删融合轮）
  const round = 1
  // 免表决：各稿文本与工具调用参数完全一致 → 表决/融合都没有信息量，直接放行候选 1
  if (alive.every(d => fingerprint(d) === fingerprint(alive[0]))) {
    const chosen = alive[0]
    yield* note(`\n[通过] ${cnNum(alive.length)}稿一致，免表决 → 放行 灵魂 ${chosen.soul.name}\n`)
    ctx.logger?.info(`trisoul: ${alive.length} 稿一致，免表决 → 灵魂 ${chosen.soul.name}`)
    yield* release(chosen, { mode: 'winner', result: 'identical', rounds: round })
    return
  }
  // 近似免表决（P2-4）：工具调用语义相似 + 正文两两相似度全超阈 → 实质一致，放行正文最长的一份
  //（信息量最大；并列取靠前）。nearIdentical:false 关闭；阈值 nearIdenticalSimilarity（默认 0.7，2026-08-21 放宽）。
  // 参数从全等改相似（similarToolCalls）：短参数仍全等锁死动作，长文本参数容忍措辞差异。
  // 终审 F4：只对「带真工具调用的稿」启用（toolCallsOf 已滤 submit_draft）——零工具时工具比对恒真（0===0），
  // 唯一守门只剩词面 Jaccard，而词集对语序不敏感（「改成 8080 不要 3000」与其反转同集）→ 结论相反的纯文本稿会被判实质一致。
  // 有工具调用时动作语义已由参数比对锁死，正文只是随行注释，词面阈值才够格当第二道门。
  // submit_draft 化后「正文」在交稿参数里（d.text 通常空串，空对空恒 1 会架空第二道门）→ 相似度/最长稿都改比两段拼合。
  if (cfg.nearIdentical !== false
    && toolCallsOf(alive[0].chunks).length > 0
    && alive.every(d => similarToolCalls(d, alive[0], cfg.nearIdenticalSimilarity))) {
    const draftBody = (d) => `${d.thinking ?? ''}\n${d.output ?? ''}`
    let minSim = 1
    for (let i = 0; i < alive.length && minSim >= cfg.nearIdenticalSimilarity; i++) {
      for (let j = i + 1; j < alive.length; j++) {
        const s = textSimilarity(draftBody(alive[i]), draftBody(alive[j]))
        if (s < minSim) minSim = s
      }
    }
    if (minSim >= cfg.nearIdenticalSimilarity) {
      const chosen = alive.reduce((best, d) => (draftBody(d).length > draftBody(best).length ? d : best), alive[0])
      yield* note(`\n[通过] ${cnNum(alive.length)}稿实质一致（工具调用相似，正文相似度 ${Math.round(minSim * 100)}% ≥ 阈 ${Math.round(cfg.nearIdenticalSimilarity * 100)}%），免表决 → 放行 灵魂 ${chosen.soul.name}（正文最长）\n`)
      ctx.logger?.info(`trisoul: ${alive.length} 稿实质一致（相似度 ${minSim.toFixed(2)}），免表决 → 灵魂 ${chosen.soul.name}`)
      yield* release(chosen, { mode: 'winner', result: 'identical', near: true, rounds: round })
      return
    }
  }

  const n = alive.length
  const m = n - 1   // 每个投票者看到的候选数 = 别人的稿（不含自己那份：防只投自己，输入也更短）
  // 选票 = 候选两段卡全文（v2 删选票截断：稿子已是蒸馏两段，零截断原样发，物理墙/注水分配不复存在）。
  // 票面附投票人自己的稿（标注不可投）——只用于发现互补（salvage = tips 闸门）
  const ballotFor = (perm, selfIdx) => ({
    text: perm.map((ci, k) => `[Candidate ${k + 1}]${alive[ci].toolCalls ? ` (with ${alive[ci].toolCalls} tool calls)` : ''}\n${fullCard(alive[ci])}`).join('\n\n'),
    self: fullCard(alive[selfIdx]),
  })
  yield* note(`\n[表决] ${n} 份候选，每人 1 票、只投别人${m === 1 ? '（两魂互审对方稿）' : ''}，表决中...\n`)
  // 结构化选票开关：表决用 cast_ballot 工具；关掉则退回纯文本 JSON
  const useTool = cfg.ballotTool !== false
  // 尺②：只问「哪一份可以原样作为这一步的回复直接放行」；风格 / 篇幅 / 整任务未闭环都不是理由。
  // 尺③（2026-08-22 用户令「不止要输出还要输出好」）：蒸馏封皮含金量计入评判——表决是质量闸门
  const scaleText =
    `Judge this step on its own: is the content correct, does it address the request, does it give prose where prose is due and tool calls where action is due.\n` +
    // B4（2026-08-25）：尺③追加非替换——封皮含金量照旧计入，格名换 findings/plan；
    // 末句是 plan 的防 Goodhart 边——评委只看 tailWindow(4)+voteEffort off，硬要求「必须有具体 plan」
    // 会直接教出垫料稿；所以只卡「非空就得具体」，空 plan 一律不降档。
    `Whether the distilled envelope (findings/plan/action) is factual and grounded counts too: a draft of boilerplate or missing key points ranks below one with a solid envelope. A non-empty plan must be concrete; an empty plan is not a defect — never rank a draft lower for not writing one.\n` +
    `Never rule out a candidate over style, length, or phrasing; never rule it out because the whole task isn't finished — in a multi-step task, this step only needs to be a correct step.\n`
  // T4：表决全程无流式输出（三魂各自私下投票），是「慢与死不可分辨」的头号现场 → 心跳伴随
  const stopVoteBeat = heartbeat('vote', { souls: n })
  const votes = await Promise.all(alive.map(async (d, vi) => {
    const others = alive.map((_, i) => i).filter(i => i !== vi)
    const perm = shuffleFor(d.soul.name, turn, m).map(k => others[k])
    const base = { soul: d.soul.name, perm, order: perm.map(i => alive[i].soul.name) }
    const voteEffort = await jobEffort(d.soul, cfg.voteEffort)
    const ballot = ballotFor(perm, vi)
    // 结构化选票：给灵魂 cast_ballot 一个工具，从工具调用参数取票（via 'tool'）；没调工具就退回正文解析（via 'text'）
    const readBallot = (v) => {
      const call = toolCallsOf(v.chunks).filter(c => c.name === BALLOT_TOOL).at(-1)
      return call ? { ...parseBallotArgs(call.arguments, { m, perm }), via: 'tool', toolArgs: call.arguments }
        : { ...parseBallot(v.text, { m, perm }), via: 'text' }
    }
    // 选票不合要求（工具参数坏 / 无 JSON / 被输出上限截断）也重试：第 k 次尝试 maxTokens 放大 k 倍（推理模型思考吃预算）
    const validate = (v) => {
      const b = readBallot(v)
      return b.parsed ? undefined : `选票${b.via === 'tool' ? '工具参数不合法' : v.truncated ? '被输出上限截断' : '不含可解析 JSON'}`
    }
    const submit = useTool
      ? `Submit via the ${BALLOT_TOOL} tool (${m === 1 ? 'pick=1 to release, pick=0 to withhold' : 'pick is the candidate number, digits only'}; reason in one sentence; salvage as above); do not write the ballot in prose. Only if you cannot call the tool, fall back to printing JSON only: {"pick": ${m === 1 ? 1 : 2}, "reason": "one sentence", "salvage": ""}`
      : `Print JSON only: {"pick": ${m === 1 ? '1 or 0' : '<candidate number>'}, "reason": "one sentence", "salvage": "as above, may be empty"} (pick is a bare number — not "candidate 2")`
    return callSoul(ctx, (attempt) => soulOptions(options, d.soul, 'vote', {
      tools: useTool ? [ballotToolSchema(m)] : undefined,
      maxTokens: cfg.voteMaxTokens > 0 ? cfg.voteMaxTokens * attempt : undefined,
      reasoningEffort: voteEffort,
      messages: tailWindow(options.messages, 4),
      instruction: mkMsg(`v${round}-${d.soul.name}`,
        (m === 1
          ? `Below is another candidate response to the same request (the only one; your own draft is not among them).\n${ballot.text}\n\n`
          : `Below are ${m} candidate responses to the same request.\n${ballot.text}\n\n`) +
        // D1 败稿回收：附自己稿只为找互补——明说不可投、不作评判基准（护「无我评判」，2026-08-21 用户拍板的张力处理）
        `[Your own draft — for comparison only, not votable]\n${ballot.self}\n` +
        `The draft above is your own: it is not among the candidates, you cannot vote for it, and don't use it as the yardstick to pick faults in the candidates. It has exactly one use — if, comparing against it, you find substantive content your draft has that the candidate you're voting for lacks (a concrete finding / evidence result / risk), put that into the ballot's salvage field (one or two factual sentences); otherwise leave salvage empty.\n\n` +
        (m === 1
          ? `Answer one question only: can it ship as-is as the reply for this step?\n`
          : `Answer one question only: which one can ship as-is as the reply for this step? Choose exactly 1.\n`) +
        scaleText +
        (m === 1 ? '' : `If every candidate has problems, pick the one with the smallest ones.\n`) +
        submit),
    }, cfg), timeout, retryOpts('vote', d.soul, { validate }))
      .then(v => ({ ...base, ...readBallot(v), reasoning: v.reasoning, attempts: v.attempts }))
      .catch(e => {
        // 重试用尽仍拿不到合格选票：弃权（via 'none'）；raw = 最后一次原始输出摘录（监控排查到底输出了什么）
        const partial = e?.partial ? readBallot(e.partial) : null
        const tries = e?.attempts > 1 ? `，已重试 ${e.attempts - 1} 次` : ''
        const rawText = partial?.via === 'tool' ? String(partial.toolArgs ?? '') : (e?.partial?.text ?? '')
        return { ...base, picks: [], labels: [], parsed: false, via: 'none', salvage: '', reasoning: e?.partial?.reasoning ?? '', attempts: e?.attempts ?? 1,
          raw: rawText.trim() ? rawText.trim() : undefined,
          reason: `（弃权：${e?.code === 'TIMEOUT' ? `表决${e.message}` : e?.code === 'INVALID_OUTPUT' ? e.message : `表决失败 ${describeErr(e)}`}${tries}）` }
      })
  })).finally(stopVoteBeat)
  const tally = tallyVotes(votes, n, turn)
  const nameOf = (i) => alive[i].soul.name
  // 缺陷2（2026-08-24）：「候选N」是投票者私有编号——每张票的候选卡各自乱序，同一个 N 在三张票里指三个不同的魂，
  // 逐票读必然误导。旁白呈现直写真身（映射本就在 v.perm 手里）；喂投票魂的候选卡照旧匿名乱序，一个字不动。
  const pickLabel = (i) => `灵魂 ${nameOf(i)}`
  /** 票据 reason 是模型用自己那张票的编号写的 → 按这张票的 perm 还原成真身。
   *  覆盖单数与枚举式复数（"candidates 1 and 2" 是高频写法，只还原头一个会剩个裸编号，比不还原更误导）、
   *  大小写、井号、繁体。两条保守边：整段里只要有一个编号指不到人就整段原样不动（映射错比不映射更糟）；
   *  尾部否定前瞻挡住 "candidate 2.txt"、"候选1.5" 这类根本不是候选编号的数字。 */
  const CANDIDATE_RE = /(?:候选|候選|candidates?)\s*#?\s*\d+(?:\s*(?:,|、|and|与|和)\s*#?\d+)*(?![\d.\w])/gi
  const deanonReason = (v, s) => String(s ?? '').replace(CANDIDATE_RE, (m) => {
    const names = (m.match(/\d+/g) ?? []).map(d => { const i = v.perm[Number(d) - 1]; return i === undefined ? null : nameOf(i) })
    if (!names.length || names.some(x => x === null)) return m
    return m.replace(/^(?:候选|候選|candidates?)\s*#?\s*/i, '').replace(/#?\d+/g, () => `灵魂 ${names.shift()}`)
  })
  const voteWord = (v) => v.picks.length ? v.picks.map(nameOf).join('+') : v.reject ? '不放行' : '弃权'
  for (const v of votes) {
    // 弃权时 reason 本身就是「（弃权：原因）」，不再重复前缀
    const why = deanonReason(v, v.reason)
    const reasonStr = v.reason ? (v.picks.length || v.reject ? `：${why}` : why.startsWith('（弃权') ? why : `（弃权：${why}）`) : ''
    yield* note(`  灵魂 ${v.soul} → ${v.picks.length ? v.picks.map(pickLabel).join(' + ') : v.reject ? `不放行（灵魂 ${nameOf(v.perm[0])} 的稿）` : '弃权'}${v.via === 'text' ? '（文本票）' : ''}${reasonStr}\n`)
  }
  const tallyStr = alive.map((d, i) => `${d.soul.name} ${tally.counts[i]} 票`).join('，')
  const voteStr = votes.map(v => `${v.soul}→${voteWord(v)}`).join(', ')
  const chosen = alive[tally.chosenIdx]
  // 事件：picks 为灵魂名（0/1 个）；tie 只在真的动用了平票轮换（平票 / 全员弃权）选出候选时为 true
  report({
    phase: 'vote', round, ballots: 1, total: votes.length, tie: tally.tie, decision: tally.decision,
    counts: alive.map((d, i) => ({ soul: d.soul.name, votes: tally.counts[i] })),
    winner: chosen.soul.name,
    votes: votes.map(v => ({
      soul: v.soul, picks: v.picks.map(nameOf), labels: v.labels, parsed: v.parsed, via: v.via, order: v.order, attempts: v.attempts,
      ...(v.raw ? { raw: v.raw } : {}),
      best: v.picks.length ? v.picks.map(nameOf).join(' + ') : null, ...(v.reject ? { reject: true } : {}),
      salvage: v.salvage,   // tips 闸门：恒带 salvage 位（空串也带）——监控以「带位票数」为 claim 率分母
      reason: v.reason, reasoning: v.reasoning,
    })),
  })
  // 胜者放行（平票 / 全员弃权时 chosenIdx 已是轮换结果，v2 无融合轮）
  yield* note(tally.decision === 'abstain'
    ? `[放行] 全员弃权（${tallyStr}）→ 按轮次轮换选 灵魂 ${chosen.soul.name}\n`
    : tally.tie
      // 措辞中性：tie 覆盖双放行 [1,1]、双拒 [0,0]、环投 [1,1,1] 等所有最高票并列场景，
      // 旧文案「双方都放行对方的稿」在后两类是事实性错误（2026-08-26 B1）
      ? `[通过] 平票（${tallyStr}）→ 按轮次轮换选 灵魂 ${chosen.soul.name}\n`
      : `[通过] 胜者: 灵魂 ${chosen.soul.name}（${tallyStr}）\n`)
  ctx.logger?.info(`trisoul: 表决 ${voteStr} → 胜者 灵魂${chosen.soul.name}${tally.tie ? '（平票轮换）' : ''}`)
  // v2 tips 闸门（2026-08-26 用户令放宽：**所有票**的非空 salvage 都算 claim，不再只收投给胜稿的票——
  // 票越分散 tips 越少不合理；败稿方向的互补线索同样喂给胜者，tipsMessage 本就令其自行判断价值。
  // 唯一排除：胜者自己那张票——其 salvage 引用的内容就在放行的胜稿里，喂回是重复）。
  // 工具步 → tips 挂账，下一次同会话请求由胜者独走吸收；收官步 → 放行前胜者补一轮吸收。无 claim → 直接放行（独走步不存在）
  const claims = votes
    .filter(v => v.soul !== chosen.soul.name && typeof v.salvage === 'string' && v.salvage.trim())
    .map(v => ({ voter: v.soul, claim: v.salvage.trim(), draft: alive.find(d => d.soul.name === v.soul) }))
    .filter(c => c.draft)
  if (!claims.length) {
    yield* release(chosen, { mode: 'winner', result: 'winner', rounds: round, votes: voteStr, tie: tally.tie })
    return
  }
  // B5 终裁：thinking 直接用四格拼合文（含 plan），tips 零特殊处理——plan 自然传递即是全部
  const tips = claims.map(c => ({ claim: c.claim, thinking: c.draft.thinking ?? '', output: c.draft.output ?? '' }))
  const winnerHasTools = toolCallsOf(chosen.chunks).length > 0
  report({ phase: 'tips', round, winner: chosen.soul.name, dest: winnerHasTools ? 'solo' : 'final', claims: claims.map(c => ({ voter: c.voter, claim: c.claim })) })
  if (winnerHasTools) {
    // 工具步：tips 挂账（只活到下一次同会话请求，不进会话历史），胜稿照常放行 → 宿主执行工具
    if (options.sessionId != null) {
      pendingTips.set(options.sessionId, { winnerSoul: chosen.soul.name, tips })
      yield* note(`\n[tips] ${claims.length} 条互补声明指向胜稿 → 挂账，下一步由 灵魂 ${chosen.soul.name} 独走吸收\n`)
      ctx.logger?.info(`trisoul: ${claims.length} 条 claim 指向胜稿 → 挂账独走（灵魂 ${chosen.soul.name}）`)
    } else {
      yield* note(`\n[tips] ${claims.length} 条互补声明指向胜稿，但本请求无会话上下文无法挂账 → 丢弃\n`)
      ctx.logger?.warn('trisoul: claim 无 sessionId 可挂账，丢弃 tips')
    }
    yield* release(chosen, { mode: 'winner', result: 'winner', rounds: round, votes: voteStr, tie: tally.tie, tips: tips.length })
    return
  }
  // 收官步（胜稿无工具调用）：放行前胜者魂带 tips 私下补一轮（同独走形态：② tips=消息尾 user 直令、匿名），放行第二稿；
  // 失联 → 放行原胜稿（胜稿地位不因补一轮失败动摇）
  yield* note(`\n[tips] ${claims.length} 条互补声明指向胜稿（收官步）→ 灵魂 ${chosen.soul.name} 放行前补一轮吸收\n`)
  ctx.logger?.info(`trisoul: ${claims.length} 条 claim 指向胜稿（收官步）→ 灵魂 ${chosen.soul.name} 补一轮`)
  // T4：收官补一轮同样是放行前的一段静默等待（用户已经看完稿了却迟迟不结束）
  const stopFinaleBeat = heartbeat('finale', { winner: chosen.soul.name, tips: tips.length })
  const [fd] = await gather([chosen.soul], 'draft', '收官补一轮 ', s =>
    soulOptions(options, s, 'draft', { ...soulDraftExtra(s), instruction: tipsMessage(tips) }, cfg)).finally(stopFinaleBeat)
  report({ phase: 'draft', round: round + 1, finale: true, writer: chosen.soul.name,
    alive: fd.error ? [] : [chosen.soul.name], dead: fd.error ? [chosen.soul.name] : [], drafts: [draftInfo(fd)] })
  if (fd.error) {
    yield* narrateDead([fd], '收官补一轮 ')
    yield* note(`[放行] 收官补一轮失联 → 放行原胜稿 灵魂 ${chosen.soul.name}\n`)
    ctx.logger?.warn(`trisoul: 收官补一轮失联，放行原胜稿 灵魂${chosen.soul.name}`)
    yield* release(chosen, { mode: 'winner', result: 'winner', rounds: round, votes: voteStr, tie: tally.tie, finale: 'failed', tips: tips.length })
    return
  }
  yield* narrateRetried([fd], '收官补一轮 ')
  yield* narrateMended([fd], '收官补一轮 ')
  yield* narrateInner([fd], '收官补一轮 ')
  yield* narrateDrafts([fd], '收官补一轮稿')
  yield* release(fd, { mode: 'winner', result: 'winner', rounds: round + 1, votes: voteStr, tie: tally.tie, finale: true, tips: tips.length })
}
