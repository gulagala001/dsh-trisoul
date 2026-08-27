# TriSoul —— 三体共识 Agent

> 基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）的插件套件。
> 一条命令装好，跑在自己的目录和端口上，**不碰你已有的 `~/.dsh`**；不想要了一条命令删干净。

**v0.1 · 半成品，拿来玩玩可以，别拿来干正事。** 先把下面的[风险提示](#风险提示)读完再装。

---

## 它是什么

普通 agent 是一个模型自己想、自己写、自己交。TriSoul 把这一步拆成三个：

1. **三体共识** —— 同一份上下文同时发给三个「灵魂」盲写（互相看不见对方的稿子），
   写完匿名投票，票不够就再融合一轮，达成共识才输出。
   三个灵魂人设不同：**求稳**（只做要求的事，宁可少做不做错）、
   **求成**（走主流程、最直接的做法，能交付就交付）、
   **求全**（主动覆盖异常和没说透的隐含要求，宁可多想一步）。
2. **画布式上下文** —— 不按「新旧」自动截断对话。上下文分成恒真区 / 状态区 / 工作区，
   由一个读得懂内容的「手术刀」圈定区间改写，改完还要做探针题验收。
3. **记忆中枢** —— 独立的模型订阅事件流，自动消化沉淀成记忆；推（开场注入）、
   拉（`trisoul_recall`）、手术后回捞三条通道。

装上以后你看到的还是 dsh 原来的网页，只是多了「监控」「记忆」两个标签页和设置里的 TriSoul 分区。

---

## 安装

**前置**：Node.js ≥ 20、pnpm。没有 pnpm 就先装一个：

```bash
npm i -g pnpm
```

然后：

```bash
npx github:gulagala001/dsh-trisoul init
npx github:gulagala001/dsh-trisoul start
```

`init` 会把宿主 dsh 和 TriSoul 插件装进一个独立目录（Windows 是
`%LOCALAPPDATA%\dsh-trisoul`，macOS / Linux 是 `~/.dsh-trisoul`），首次约 1~3 分钟。
`start` 起服务并打开浏览器，默认地址 **http://127.0.0.1:3081**。

最后一步：在网页里点 **设置 → 模型**，填一个 [DeepSeek API key](https://platform.deepseek.com/)，保存即用。
key 存在你自己的安装目录里，页面不会回显明文。

> 没有 `git` 的机器上 `npx github:` 会失败，改用 [Releases](https://github.com/gulagala001/dsh-trisoul/releases)
> 里的压缩包，解压后在目录里跑 `node cli/index.mjs init`。

---

## 用法

```bash
npx github:gulagala001/dsh-trisoul <命令>

  init        安装（首次）
  start       启动并开浏览器
  stop        停止
  restart     重启（有任务在跑时会拒绝，除非 --force）
  status      看状态
  log [n]     看最后 n 行日志
  doctor      重打上游补丁 + 自检
  uninstall   卸载
```

常用选项：`--port <n>`（默认 3081）、`--cwd <目录>`（Agent 的工作目录，默认是你当前所在目录）、
`--no-open`（不自动开浏览器）、`--force`。

想让它在某个项目里干活，就在那个项目目录下 `start`，或者 `start --cwd /path/to/project`。

---

## 卸载

```bash
npx github:gulagala001/dsh-trisoul uninstall              # 删干净
npx github:gulagala001/dsh-trisoul uninstall --keep-data  # 先把记忆库和会话备份到 ~/trisoul-data-backup
```

会先停掉服务，再删掉整个安装目录（宿主 dsh、插件、profile、记忆、日志、你填的 key 都在里面）。
**你原有的 `~/.dsh`、原版 dsh 的配置和会话一律不动**，系统里也没有别的残留。

---

## 风险提示

这套架构是拿准确率换资源的，代价很实在，装之前请知悉：

| 风险 | 说明 |
|---|---|
| **输入暴涨** | 三个灵魂各自吃一份完整上下文，输入 token 至少 ×3；再加上记忆中枢和手术刀的后台调用，**账单比单模型高一个量级**是常态。先用小额度试。 |
| **缓存命中差** | 三个灵魂人设、温度各不相同，每轮盲写又要重组上下文，prompt 缓存很难命中，省不下这部分钱。 |
| **并发限制** | 三路盲写并行，外加后台的记忆消化和上下文手术，很容易撞上 API 的并发/限流上限。撞上了表现为变慢、报错或某个灵魂掉线（会降级到 2/3 继续）。 |
| **结果不稳定** | 共识机制不保证每次都收敛到同一答案：同样的问题问两次可能给出不同方案。平票时有轮换兜底，但那不是「更对」，只是「有个结果」。 |
| 只能本机用 | 服务默认只绑 `127.0.0.1`，接口没有鉴权，**不要暴露到公网**。 |
| 模型得会输出 JSON | 盲写协议要求模型稳定输出 JSON，做不到的渠道不适配。 |
| 还是半成品 | 宿主 dsh 自己也标着 developer preview，会有破坏性变更；本项目钉死在一个已知能跑的版本上。 |

---

## 跑分（简单说一下）

在 [DeepSWE](https://deepswe.ai/) 的一个 38 题子集上做过一轮评测，底座是 `deepseek-v4-flash`：

- **TriSoul 11/36 ≈ 30.6%**，同底座同模型的官方 mini-swe-agent 基线是 **10.5%**。
- 那批题里有几道是官方基线四次全败的；其中一道 `meriyah`，官方榜上 opus 级模型跑 20 次全挂，
  TriSoul 用 flash 做出来了。

需要说清楚的是：那轮评测用的是另一条 API 渠道、推理档位拉满，和这里的默认配置不一样，
所以**别指望在自己机器上复现这个数字**。它只说明「三个便宜模型互相盯着」这个思路有效，
不代表现在这个版本调好了。

---

## 和原版 dsh 的关系

- 全部功能都以 dsh 插件形式实现，宿主一行没改；两个上游依赖的补丁在安装时自动打（`doctor` 可重打）。
- 装在独立目录、独立端口（3081，原版默认 3080），和你已有的 dsh 互不影响，可以同时开着。
- 宿主 dsh 是 [MIT](https://github.com/deepseek-ai/deepseek-harness) 协议的开源项目，本项目同样 MIT。

## 许可证

[MIT](LICENSE)
