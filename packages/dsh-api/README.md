# @trisoul/dsh-api —— 配置 + 监控聚合 + HTTP 接口

TriSoul 的服务端「后台」：注册 settings 命名空间、聚合各包上报的事件成 metrics、提供 `/trisoul/api/*` 接口。
Web 面板在 `packages/client/*`（React + CSS Modules）：监控 tab / 设置页分区 / 记忆 tab 各自打包成 dsh 客户端插件。
（08-30 重写：旧版描述的三份静态 HTML、`/api/memory/list` 等端点、npx 启动、固定 soul-A/B/C 均已不存在。）

## 接口（全部挂在 `/trisoul/api/` 前缀；`/api/*` 归官方 apiProxy，不占用）

| 路由 | 方法 | 用途 |
|---|---|---|
| `/trisoul/api/state` | GET | 一次拉齐：当前配置解析值、灵魂列表、`metrics`（**metrics 没有独立端点**）、会话绑定 |
| `/trisoul/api/settings` | GET / POST | 读写 settings 层 `trisoul:` 段（统一/精细路由、灵魂列表、共识管线参数）；保存即热生效，无需重启 |
| `/trisoul/api/consensus` | GET | 共识轮环形缓冲（`?turnId=` 取单轮全文；进程内存，重启即清） |
| `/trisoul/api/consensus/stream` | GET (SSE) | 共识事件实时流（`?sessionId=` 只看一个会话） |

记忆库接口 `/trisoul/api/memory` 由 `@trisoul/dsh-memory` 自己注册，不在本包。

## 给其它 TriSoul 插件的查询面（`ctx.bail`，改配置即刻生效）

- `trisoul/ai-config`（`'soul-<name>' | 'surgeon' | 'memory' | 'canvas'`）→ `{ provider, model, temperature?, reasoningEffort? }`
- `trisoul/souls` → 已解析灵魂列表（名册前 soulCount 个，含 officer 与猛档人设；sessionId 参数忽略）
- `trisoul/consensus-config` → 共识管线参数（trace / voteMaxTokens / soulRetries / 超时 / innerRounds / exemptHostTools …）
- `trisoul/provider-api`（provider）→ 渠道协议字符串或 undefined（内建官方适配器固定 `deepseek`；桥自定义渠道读宿主 `llm-pi-ai.providers.<id>.api`）——格式锁按协议挑字段用

## 监控聚合

订阅 `trisoul/consensus`、`trisoul/canvas`、`trisoul/memory` 事件，按会话与全局聚合成 `metrics`（共识胜负/表决 divergence 知情票率/独走/降级/截断，压缩健康，记忆消化整理），供监控 tab 读取；各 AI 的 usage 按 `soul-<name>` 与中枢 id 归因。

## 配置

`patch.yml` 里的 `config.base` 只是默认值：`mode`（unified / fine）、`unified` 路由、`soulCount`（1/2/3，名册 A/B/C 写死在代码里）。用户在设置页保存后落 settings 层覆盖；旧 `souls[]` / `effort{}` 键残留静默忽略。
