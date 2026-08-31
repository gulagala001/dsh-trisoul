# TriSoul —— 三魂共识 Agent

**三个灵魂盲写互评的共识 agent——用一个便宜的小模型，做到接近大模型的事。**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Node](https://img.shields.io/badge/node-%E2%89%A520-brightgreen)
[![评测报告](https://img.shields.io/badge/DeepSWE-完整评测报告-orange)](https://gulagala001.github.io/dsh-trisoul/deepswe-report.html)

[快速开始](#快速开始) · [它怎么工作](#它怎么工作) · [跑分](#跑分) · [常用命令](#常用命令) · [风险提示](#风险提示)

> [!WARNING]
> **v0.2 · 半成品，拿来玩玩可以，别拿来干正事。** 装之前先读[风险提示](#风险提示)。

![同一批难题上谁能过](docs/bench-models.svg)

同一个 `deepseek-v4-flash`，在官方通过率 ≤ 1/4 的 38 道 DeepSWE 难题上：官方 **10.5%**，
TriSoul **30.6%**——每题只跑一次、全程断网。两道 Claude Opus 5 官方 20 次尝试 0 通过的题
（`awilix`、`meriyah`），它过了。

## 快速开始

前置：Node.js ≥ 20、pnpm（没有就 `npm i -g pnpm`）。

```bash
npx github:gulagala001/dsh-trisoul init
npx github:gulagala001/dsh-trisoul start
```

装进独立目录（macOS / Linux `~/.dsh-trisoul`，Windows `%LOCALAPPDATA%\dsh-trisoul`），
跑在自己的端口上，**不碰你已有的 `~/.dsh`**；不想要了一条命令删干净。
启动后打开 http://127.0.0.1:3081，在网页 **设置 → 模型** 填一个
[DeepSeek API key](https://platform.deepseek.com/)，保存即用。
key 存在你自己的安装目录里，页面不会回显明文。

想让它在某个项目里干活：在那个目录下 `start`，或 `start --cwd /path/to/project`。

> 没有 `git` 的机器上 `npx github:` 会失败，改用 [Releases](https://github.com/gulagala001/dsh-trisoul/releases)
> 压缩包，解压后在目录里跑 `node cli/index.mjs init`。

## 它怎么工作

普通 agent 是一个模型自己想、自己写、自己交。TriSoul 的立论是：**弱模型的病在生成时穷**——
顾一头就丢其他，所以补偿要发生在生成阶段（几份完整稿各补一头），而不是对一份穷稿做事后质检。

![TriSoul 的一步](docs/flow.svg)

- **三魂共识**：同一份上下文发给三个「灵魂」并行盲写（互相看不见稿子），写完**匿名互评**——
  只能投别人、不能投自己，胜者带着落败稿里的有用要点去执行。
- **三官镜头**：三个灵魂是同一模型的三份实例，各带一个补偿镜头。对齐官盯「做什么」
  （`task_map` 任务账本：动手前铺成清单，做一条勾一条）；博识官盯「凭什么做」
  （`web_search` / `web_fetch`：把「我记得」逼成有出处的事实）；实证官盯「做对没有」
  （`verify_link`：给结论挂证据——引原文，或真跑一条过安全门名单的验证命令）。
  设置里只选**灵魂数量** 1 / 2 / 3，嫌贵就降魂数。
- **画布式上下文**：不按「新旧」自动截断。上下文分恒真区 / 状态区 / 工作区，由读得懂内容的
  「手术刀」圈定区间改写，改完做探针题验收。
- **记忆中枢**：独立模型订阅事件流，自动消化沉淀成记忆；推（开场注入）、拉（`trisoul_recall`）、
  手术后回捞三条通道。

装上以后你看到的还是 dsh 原来的网页，只是多了「监控」「记忆」两个标签页和设置里的 TriSoul 分区。

## 跑分

[DeepSWE](https://deepswe.ai/) 是让前沿大模型也只能做对七成的编程题库。从官方 28010 次公开
运行记录里挑出 `deepseek-v4-flash` 通过率 ≤ 1/4 的 38 道题，用 TriSoul 驱动**同一个 flash**
再跑一遍：全程断网、每题只跑一次、不看答案（对比口径均为平均每次通过率 pass@1）。

| | 通过率 | 口径 |
|---|---|---|
| `deepseek-v4-flash` 官方（同底座） | **10.5%** | 16/152 次 · $0.10/次 |
| **TriSoul（同一个 flash）** | **30.6%** | **11/36 题 · 每题只跑 1 次** |
| `gpt-5.4 xhigh` 官方 | 28.3% | 43/152 次 · $5/次 |
| `deepseek-v4-pro` 官方 | 38.8% | 59/152 次 · $0.25/次 |
| `claude-opus-5` 全档 官方 | 58.7% | 436/743 次 · $5–12/次 |

- **同一个模型，架构带来 2.9 倍。**
- **两道 Opus 5 官方 0/20 的题（`awilix`、`meriyah`），TriSoul 过了**；另有三道 Opus 5
  仅 2–3/20 的题也过了。
- 表决不是摆设：183 轮里胜者 A/B/C 均衡（36% / 29% / 35%），没人垄断；投票者只看别人的稿，
  **2-1 就是这套架构里最强的共识信号**。

逐题转胜分析、表决全景、断网与作弊面审计、全量外推算法，都在
**[完整评测报告 →](https://gulagala001.github.io/dsh-trisoul/deepswe-report.html)**
（单文件 HTML，可下载本地打开，无外链无脚本）。

## 常用命令

```bash
npx github:gulagala001/dsh-trisoul <命令>
```

| 命令 | 干什么 |
|---|---|
| `init` / `start` | 安装（首次）/ 启动并开浏览器 |
| `stop` / `restart` | 停止 / 重启（有任务在跑会拒绝，`--force` 无视） |
| `status` / `log [n]` | 看状态 / 看最后 n 行日志 |
| `doctor` | 重打上游补丁 + 自检 |
| `uninstall [--keep-data]` | 卸载整个安装目录（`--keep-data` 先把记忆库和会话备份到 `~/trisoul-data-backup`） |

常用选项：`--port <n>`（默认 3081）、`--cwd <目录>`（agent 的工作目录）、`--no-open`。

## 风险提示

这套架构是拿资源换准确率的，代价很实在：

| 风险 | 说明 |
|---|---|
| **账单高一个量级** | 三魂各吃一份完整上下文（输入 ×3 起）+ 每魂一份官位人设 + 记忆/手术后台调用；人设温度各异，缓存也难命中。先用小额度试，嫌贵把灵魂数量降到 2 或 1。 |
| **并发压力** | 三路盲写并行，容易撞 API 限流；撞上表现为变慢、报错或某魂掉线（自动降级 2/3 继续）。 |
| **结果不保证收敛** | 同样的问题问两次可能不同答案；平票（实测约 18.6%）走轮换兜底——那是「有个结果」，不是「更对」。 |
| **只能本机用** | 默认只绑 `127.0.0.1`，接口没有鉴权，**不要暴露到公网**。 |
| **模型得会输出 JSON** | 支持强制格式输出的渠道（DeepSeek 官方就支持）会被自动上语法锁；其余渠道靠提示词软约束，弱模型可能偶尔跑飞。 |

## 和原版 dsh 的关系

TriSoul 是 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`，MIT）的插件套件：

- 全部功能以 dsh 插件实现，宿主一行没改；上游依赖的三处小补丁在安装时自动打
  （`doctor` 可重打，均有幂等标记与 `.orig` 备份）。
- 独立目录、独立端口（3081，原版默认 3080），和你已有的 dsh 互不影响，可以同时开着。
- 宿主标着 developer preview，会有破坏性变更；本项目钉死在一个已知能跑的版本上。

<details>
<summary><b>仓库结构</b></summary>

```
cli/            安装器与启停命令（零第三方依赖，直接 node 跑）
  index.mjs       命令分发入口
  lib/init.mjs    装宿主 dsh → 复制插件 → 装配 profile → 打上游补丁 → 自检
  lib/server.mjs  start / stop / status / restart（Windows 走 taskkill，POSIX 走信号）
  lib/uninstall.mjs  卸载（带路径安全围栏，拒绝删 $HOME、~/.dsh 这类目录）
  lib/patch-pi-ai.mjs  给上游 pi-ai 打一个 O(n²) 性能补丁，可用 doctor 重打
  lib/patch-onpayload.mjs  桥/官方适配器放行 onPayload（JSON 格式锁的通道），同样 doctor 可重打

config/
  trisoul.patch.yml  profile 配置模板：挂哪些插件、灵魂数量、模型路由

packages/       TriSoul 插件本体（服务端 6 个 + 客户端 3 个）
  dsh-plugin/     三魂共识：盲写 / 匿名表决 / tips 挂账 / 平票轮换
  dsh-canvas/     画布式上下文：恒真区 / 状态区 / 工作区的分区与触发
  dsh-surgeon/    上下文手术刀：圈定区间改写 + 探针题验收
  dsh-memory/     记忆中枢：事件流消化、推 / 拉 / 回捞三通道
  dsh-guard/      安全门：共识 ≠ 授权，三个灵魂一致同意的危险动作照样拦
  dsh-api/        Web UI 的后端接口 + 灵魂名册解析 + 监控归因
  client/memory-ui、client/monitor、client/settings   三个网页插件（预构建产物）

docs/           README 里的图表 + 完整评测报告（单文件 HTML）
```

装完以后东西都在安装目录里，和这个仓库无关。

</details>

## 许可证

[MIT](LICENSE)
