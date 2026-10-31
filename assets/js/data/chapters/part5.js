/* ============================================================
   Part III · Advanced Architecture, second half (ch.11–12)
   ============================================================ */

const c = (zh, en) => ({ zh, en });
const src = (label, url, dom) => ({ label, url, dom });

export const PART5 = [
  {
    id: "11-extension",
    num: "11",
    part: 3,
    read: 12,
    tags: { zh: ["MCP", "Skills", "Plugin"], en: ["MCP", "Skills", "Plugins"] },
    title: c("扩展面：MCP、Skills、Hooks、Plugin", "The extension surface: MCP, skills, hooks, plugins"),
    sub: c("四个扩展点，四种代价", "Four extension points, four different prices"),
    lead: c(
      "一个 Agent 产品能走多远，取决于别人能多容易地给它加能力。Claude Code 给了四个扩展点，每一个都在「能力」和「上下文成本」之间做了不同的取舍。",
      "How far an agent product goes depends on how easily others can extend it. Claude Code offers four extension points, each trading capability against context cost differently."
    ),
    body: {
      zh: `## 四个扩展点一览

| 扩展点 | 加什么 | 谁维护 | 上下文成本 | 确定性 |
| --- | --- | --- | --- | --- |
| MCP | 外部系统的工具 | 第三方 | 高（schema 常驻） | 低（模型决定调用） |
| Skills | 领域知识与流程 | 团队/个人 | 低（渐进披露） | 中（模型决定读不读） |
| Hooks | 确定性脚本 | 团队 | 零 | 高（代码执行） |
| Plugin | 上面三种的打包 | 生态 | 取决于内容 | 取决于内容 |

记住这张表，你就能回答 90% 的「该用哪个」的问题。

## MCP：协议的代价是 token 税

MCP（Model Context Protocol）解决了一个真问题：如何把外部系统（数据库、Jira、Slack、浏览器）接成 Agent 的工具。

它做得很好，但有一个绕不开的代价：**工具定义要常驻上下文**。

一个中等规模的 MCP server 暴露 15 个工具，schema 大约 3,000-5,000 token。接五个 server，就是 2 万多 token 的固定开销——还没开始干活。

:::warn 接 MCP 之前先算账
每接一个 MCP server，先问三件事：它的工具定义占多少 token？这些工具一周用几次？能不能改成 Skill 按需加载？如果一周用两次却常驻 4,000 token，这笔买卖不划算。
:::

三种降低 token 税的办法：

1. **按需连接**：只在相关任务里启用特定 server，而不是全局常开。
2. **精简工具集**：server 端只暴露必要工具，别把整个 API 都映射成工具。
3. **改成 Skill**：如果这个能力是「一套流程」而不是「一组原子操作」，用 Skill 更省。

## Skills：渐进披露的正确姿势

Skill 的核心思想是：**先给目录，正文按需加载**。

一个 Skill 的元数据只有一两行（名字 + 什么时候用），常驻成本极低；当模型判断需要时，才把完整正文读进上下文。

这解决了 MCP 最大的痛点：能力可以很多，常驻成本却很小。

~~~markdown
---
name: release-checklist
description: 发布前的检查流程。当用户要求发版、打 tag、或部署到生产时使用。
---

1. 确认 main 分支 CI 通过
2. 检查 CHANGELOG 是否有本次版本条目
3. 运行 npm run build && npm run test:e2e
4. 打 tag 并推送，等待发布流水线
5. 在生产环境跑 smoke test，确认关键接口 200
~~~

注意 description 的写法：**触发条件写清楚**，因为模型只靠这一行决定要不要读正文。

:::tip Skill 的边界
Skill 适合「流程」和「领域知识」，不适合「原子操作」。如果你写了一个 Skill，里面全是「调用工具 A，再调用工具 B」，那它其实应该是一个工具或者一个 hook。
:::

## Hooks：不占上下文的扩展

Hook 是唯一一种**零上下文成本**的扩展：它不进入 prompt，不参与推理，只在特定时机执行代码。

代价是它只能做确定性的事：格式化、校验、拦截、记录。它不能「理解」任务，也不需要。

最佳实践是把 hook 用在三处：

- 工具执行前的硬拦截（危险命令、敏感路径）；
- 工具执行后的自动修复（格式化、lint --fix）；
- 会话结束时的清理与汇总（成本、临时文件、审计日志）。

## Plugin：把上面三种打包

Plugin 是一个分发单元：把一个 Skill、几个 hook、一个 MCP server 配置、若干 slash 命令打成一个包，让别人一键安装。

它解决的是「生态」问题，而不是「能力」问题。你在设计自己的 Agent 产品时，如果想让第三方贡献能力，Plugin 式的打包是必经之路。

## 选择指南

| 你的需求 | 推荐 | 理由 |
| --- | --- | --- |
| 接一个外部系统（数据库、SaaS） | MCP | 标准化、可复用 |
| 教 Agent 一套团队流程 | Skill | 渐进披露，成本低 |
| 保证某个动作一定发生 | Hook | 确定性，零上下文 |
| 分发一整套能力给他人 | Plugin | 打包与版本管理 |
| 只是想让模型多知道一件事 | CLAUDE.md | 别过度工程 |

:::aha 一个反直觉的建议
大多数团队的第一反应是写 MCP server。但如果你数一下实际使用频率，会发现 80% 的需求用「一个 Skill + 两个 hook + 一段 CLAUDE.md」就能解决，而且成本低一个数量级。先写便宜的，等真的不够用了再上协议。
:::

## 本章带走

- [ ] 四个扩展点：MCP 换能力、Skill 换流程、Hook 换确定性、Plugin 换分发
- [ ] 接 MCP 前先算 token 税：schema 常驻是固定成本
- [ ] Skill 的 description 要写触发条件，模型只靠它决定读不读
- [ ] 确定性的事交给 hook，别塞进 prompt
- [ ] 先用最便宜的扩展点，不够用再升级`,
      en: `## Four extension points at a glance

| Extension | Adds | Maintained by | Context cost | Determinism |
| --- | --- | --- | --- | --- |
| MCP | Tools for external systems | Third party | High (schemas resident) | Low (model decides) |
| Skills | Domain knowledge and flows | Team / individual | Low (progressive) | Medium |
| Hooks | Deterministic scripts | Team | Zero | High (code runs) |
| Plugins | Packaging of the above | Ecosystem | Depends | Depends |

Memorise this table and you can answer 90% of "which one should I use".

## MCP: the price of a protocol is a token tax

MCP solves a real problem: how to plug external systems (databases, Jira, Slack, browsers) into an agent as tools.

It does this well, at an unavoidable cost: **tool definitions live in context**.

A mid-sized MCP server exposing fifteen tools costs roughly 3,000–5,000 tokens of schema. Five servers means 20,000+ tokens of fixed overhead — before any work starts.

:::warn Do the maths before connecting
Before adding an MCP server, ask: how many tokens do its schemas cost? How often will these tools be used this week? Could this be a Skill loaded on demand? twice a week against 4,000 resident tokens is a bad trade.
:::

Three ways to cut the tax:

1. **Connect on demand**: enable the server for relevant tasks, not globally.
2. **Trim the toolset**: expose the necessary tools, not the whole API surface.
3. **Convert to a Skill**: if the capability is a flow rather than atomic operations, a Skill is cheaper.

## Skills: progressive disclosure, done right

The core idea: **serve the menu first, load the recipe on demand**.

A Skill's metadata is one or two lines (name plus when to use), nearly free to keep resident. Only when the model decides it is relevant does the full body enter context.

This fixes MCP's biggest pain: many capabilities, tiny resident cost.

~~~markdown
---
name: release-checklist
description: Pre-release checks. Use when the user asks to release, tag, or deploy to production.
---

1. Confirm CI is green on main
2. Check CHANGELOG has an entry for this version
3. Run npm run build && npm run test:e2e
4. Tag and push, wait for the release pipeline
5. Smoke-test production, confirm key endpoints return 200
~~~

Note the description: **the trigger condition must be explicit**, because that line alone decides whether the body is read.

:::tip The boundary of a Skill
Skills fit flows and domain knowledge, not atomic operations. If your Skill is a list of "call tool A, then tool B", it should be a tool or a hook instead.
:::

## Hooks: extensions that cost no context

Hooks are the only extension with **zero context cost**: they never enter the prompt, never participate in reasoning, and run code at precise moments.

The trade-off is determinism only: format, validate, block, record. A hook cannot "understand" a task, and does not need to.

Use hooks in three places:

- Hard blocks before a tool runs (risky commands, sensitive paths);
- Automatic repair after a tool runs (formatting, lint --fix);
- Cleanup and summary at session end (cost, temp files, audit log).

## Plugins: packaging the other three

A plugin is a distribution unit: a Skill, some hooks, an MCP server config and slash commands bundled into one installable package.

It solves an ecosystem problem, not a capability problem. If you want third parties to contribute to your agent, packaging is unavoidable.

## Choosing

| Your need | Pick | Why |
| --- | --- | --- |
| Connect an external system | MCP | Standardised and reusable |
| Teach a team workflow | Skill | Progressive disclosure, cheap |
| Guarantee something happens | Hook | Deterministic, zero context |
| Distribute a capability set | Plugin | Packaging and versioning |
| Just add one fact | CLAUDE.md | Do not over-engineer |

:::aha A counter-intuitive recommendation
Most teams reach for an MCP server first. Count actual usage and you will find 80% of needs are met by one Skill, two hooks and a paragraph of CLAUDE.md — at an order of magnitude less cost. Start cheap; reach for the protocol when genuinely necessary.
:::

## Takeaways

- [ ] MCP buys capability, Skills buy flows, Hooks buy determinism, Plugins buy distribution
- [ ] Count the token tax before connecting a server
- [ ] A Skill's description is its trigger; make it explicit
- [ ] Deterministic work belongs in hooks, not prompts
- [ ] Start with the cheapest extension point`,
    },
    sources: [
      src(c("Model Context Protocol 规范", "Model Context Protocol specification"), "https://modelcontextprotocol.io", "modelcontextprotocol.io"),
      src(c("Claude Code 文档 · Skills / Hooks / Plugins", "Claude Code docs · Skills, hooks, plugins"), "https://code.claude.com/docs", "code.claude.com"),
      src(c("Anthropic 工程博客 · 给 Agent 写工具", "Anthropic Engineering · Writing tools for agents"), "https://www.anthropic.com/engineering/writing-tools-for-agents", "anthropic.com/engineering"),
    ],
  },

  {
    id: "12-cost-rendering",
    num: "12",
    part: 3,
    read: 15,
    tags: { zh: ["成本", "终端渲染"], en: ["Cost", "Terminal UI"] },
    title: c("渲染与成本：终端里的 React 与 token 经济学", "Rendering and cost: React in a terminal, and token economics"),
    sub: c("一半的钱花在看不见的地方", "Half the bill is spent where you never look"),
    lead: c(
      "Claude Code 是一个跑在终端里的 React 应用——这句话听起来像个玩笑，但它是真的。而它每一屏漂亮的输出，背后都有一张你要付的账单。",
      "Claude Code is a React app running in a terminal. That sounds like a joke; it is true. And every pretty screen comes with a bill you pay."
    ),
    body: {
      zh: `## 终端 UI 为什么用 React

终端界面传统上是用命令式代码画的：清屏、定位光标、逐行输出。状态一多，代码就会变成一堆「什么时候该重绘哪里」的 if。

Claude Code 用 Ink（React for CLI）解决了这个问题：

- 组件化：状态栏、消息流、输入框、进度条各自独立；
- 声明式：状态变了，框架负责算最小重绘；
- 可复用：同一套组件在交互模式和打印模式下都能用。

代价是启动时要初始化 React 运行时（几百毫秒），以及一个不便宜的渲染循环。这也是为什么第 12 章要讲成本——渲染本身也是成本。

:::aha 一个有意思的细节
终端里做流式输出，最大的挑战不是「怎么打印」，而是「怎么在已经打印的内容上原地更新」。React 的调和算法恰好适合这件事：它知道哪一行动了，只重绘那一行。
:::

## 流式：优化的是感知，不是速度

:::chart stream-latency
:::

总耗时没变，但用户在第 1 秒就看到了内容。这个差别在体感上是决定性的：一个 6 秒不出字的界面会被认为卡死，一个 6 秒慢慢出字的界面会被认为在思考。

流式实现有三个坑：

1. **部分 JSON**：工具调用是结构化输出，流式过程中 JSON 不完整，必须做增量解析。
2. **重绘抖动**：每一帧都全量重绘会闪，必须做差异更新。
3. **中断处理**：用户按 Ctrl+C 时，要能干净地取消请求并保留已输出内容。

## 成本三杠杆

:::chart token-composition
:::

先看清一件事：一次请求里，你打的那句话只占 2K，而 system prompt、工具 schema、历史对话加起来是 48K。所以省钱的顺序是：

| 杠杆 | 做法 | 典型收益 |
| --- | --- | --- |
| 减少圈数 | 更好的工具、更清晰的 brief、更少试错 | 30-60% |
| 提高缓存命中 | 稳定前缀、动态内容后置、别乱改 prompt | 50-80% |
| 压缩上下文 | 工具结果摘要、历史压缩 | 20-40% |

注意这三个杠杆是乘法的，不是加法的。三个都做，账单能降一个数量级。

## 缓存：最被低估的优化

:::chart cache-economics
:::

缓存的第一性原理只有一句：**前缀完全一致就能命中**。

所以所有缓存优化，本质都是同一件事：**让前缀更稳定**。

具体做法：

- system prompt 里别放时间戳、随机 ID、会话相关的内容；
- 工具定义排序稳定，别每次启动顺序不一样；
- 历史消息不要在中途「编辑」，只追加；
- 需要动态内容时，放在最后，或者放进第一条 user 消息。

:::warn 缓存失效的隐形杀手
最常见的缓存杀手不是大改动，而是「小聪明」：在 system prompt 开头加一句「当前用户是 VIP」，在工具列表里按使用频率排序，在历史里插入一条「系统提示：注意时间」——每一样都会让缓存前缀整体失效。
:::

## 启动成本

:::chart startup-waterfall
:::

启动时最贵的是 MCP server 的加载。每多一个 server，就要多等一次进程启动 + 握手 + 工具列表拉取。所以「按需连接」不只是省 token，也是省启动时间。

优化手段：并行连接、缓存工具列表、懒加载不常用的 server。

## 三个成本监控指标

如果你的 Agent 要长期运行，至少要盯这三个数：

1. **每任务成本**：不是每次请求，而是每个完整任务。它才是用户感知的单位。
2. **缓存命中率**：低于 60% 说明前缀设计有问题。
3. **平均圈数**：突然上升通常意味着工具描述变差或任务变难。

## 本章带走

- [ ] 终端 UI 用声明式框架，省下的是状态同步的心智负担
- [ ] 流式优化的是感知延迟，不是总耗时
- [ ] 成本三杠杆：减圈数、提缓存、压上下文，三者相乘
- [ ] 缓存优化的唯一目标是「前缀稳定」
- [ ] 盯每任务成本、缓存命中率、平均圈数三个指标`,
      en: `## Why a terminal UI uses React

Terminal interfaces are traditionally imperative: clear the screen, move the cursor, print lines. As state grows, the code becomes a pile of "when to redraw what" conditionals.

Claude Code uses Ink (React for CLI) to remove that:

- Components: status bar, message stream, input, progress are independent;
- Declarative: state changes, the framework computes the minimal redraw;
- Reusable: the same components work in interactive and print modes.

The price is initialising a React runtime at startup (hundreds of milliseconds) and a non-trivial render loop. Which is why cost belongs in this chapter — rendering is cost too.

:::aha A neat detail
The hard part of streaming in a terminal is not printing; it is updating in place over what you already printed. React's reconciler happens to be good at exactly this: it knows which line changed and redraws only that line.
:::

## Streaming optimises perception, not speed

:::chart stream-latency
:::

Total time is unchanged, but the user sees content at second one. That difference is decisive: a UI silent for six seconds reads as frozen; one that fills in over six seconds reads as thinking.

Three traps in streaming:

1. **Partial JSON**: tool calls are structured; the JSON is incomplete mid-stream and needs incremental parsing.
2. **Redraw jitter**: full redraws every frame flicker; diff the updates.
3. **Interruption**: Ctrl+C must cancel the request cleanly and keep what was printed.

## Three levers of cost

:::chart token-composition
:::

Look at the split: your sentence is 2K; system prompt, tool schemas and history total 48K. So the savings order is:

| Lever | How | Typical gain |
| --- | --- | --- |
| Fewer turns | Better tools, clearer briefs, less trial and error | 30–60% |
| Higher cache hits | Stable prefix, volatile content last, stop editing prompts | 50–80% |
| Compaction | Summarise tool output, compact history | 20–40% |

These multiply, not add. Do all three and the bill drops by an order of magnitude.

## Caching: the most underrated optimisation

:::chart cache-economics
:::

One principle: **an identical prefix hits the cache**.

Every cache optimisation is therefore the same project: **make the prefix more stable**.

Concretely:

- No timestamps, random ids or session data in the system prompt;
- Stable tool ordering across runs;
- Append to history, never edit mid-stream;
- Dynamic content last, or in the first user message.

:::warn The invisible cache killer
The usual culprit is not a big change but a "clever" one: adding "the current user is VIP" at the top, sorting tools by usage, inserting "note: watch the time" into history — each invalidates the entire prefix.
:::

## Startup cost

:::chart startup-waterfall
:::

The expensive part of startup is MCP loading. Every server costs a process spawn, a handshake and a tool-list fetch. "Connect on demand" saves startup time as well as tokens.

Fixes: connect in parallel, cache tool lists, lazy-load rarely used servers.

## Three metrics to watch

1. **Cost per task**, not per request — the unit users feel.
2. **Cache hit rate**: below 60% means the prefix design is off.
3. **Average turns**: a sudden rise usually means worse tool descriptions or harder tasks.

## Takeaways

- [ ] Declarative terminal UI buys back state-sync sanity
- [ ] Streaming optimises perceived latency, not total time
- [ ] Cost levers multiply: turns, cache, compaction
- [ ] The only goal of cache work is prefix stability
- [ ] Watch cost per task, cache hit rate, average turns`,
    },
    sources: [
      src(c("Prompt Caching 文档", "Prompt caching docs"), "https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching", "docs.anthropic.com"),
      src(c("Anthropic 文档 · Streaming", "Anthropic docs · Streaming"), "https://docs.anthropic.com/en/docs/build-with-claude/streaming", "docs.anthropic.com"),
      src(c("鱼心快跑 · LLM 网关模式（姊妹站）", "Yuxin Rush · LLM gateway patterns (sister site)"), "https://yuxinrun.github.io/llm-gateway-patterns/", "yuxinrun.github.io"),
    ],
  },
];