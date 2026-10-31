/* ============================================================
   Part I · The Big Picture (ch.01–02)
   ============================================================ */

const c = (zh, en) => ({ zh, en });
const src = (label, url, dom) => ({ label, url, dom });

export const PART1 = [
  {
    id: "01-blueprint",
    num: "01",
    part: 1,
    read: 9,
    tags: { zh: ["泄露事件", "数字直觉"], en: ["The leak", "By the numbers"] },
    title: c("一个价值数十亿美元的设计蓝图", "A Billion-Dollar Blueprint"),
    sub: c("51 万行代码是怎么跑到我们手里的", "How 510,000 lines fell into our laps"),
    lead: c(
      "2026 年 3 月 31 日，Anthropic 把 Claude Code 的完整 TypeScript 源码打包进了 npm。不是被黑，不是内鬼，是打包脚本少写了一行。",
      "On 31 March 2026, Anthropic shipped the full TypeScript source of Claude Code inside its npm package. Not a breach, not a mole — a packing script missing one line."
    ),
    body: {
      zh: `这一章不聊代码，先聊一件事：为什么一份意外泄露的源码，值得你花 17 章去读。

因为真正值钱的不是那 51 万行，而是藏在里面的**决策**。代码告诉你 what 和 how，决策告诉你 why。而 why 才是可迁移的。

## 事故现场：一条最贵的「少写一行」

故事有前传。2025 年 2 月 Claude Code 首次发布时，包里就出现过 source map 文件，当时没人当回事——毕竟大多数产品的 source map 里只有压缩后的变量名，读起来像乱码。

真正的伏笔埋在 2026 年 3 月 11 日：社区发现 Bun 有一个已知 issue，在生产模式下仍可能把 source map 一起服务出去。这个 issue 一直开着，没人想到它会咬到谁。

然后就是 3 月 31 日。

:::chart leak-timeline
:::

一个安全研究员发现 v2.1.88 的 npm 包体积是 59.8 MB，比正常版本大了好几倍。解压之后，大约 1,900 个严格模式的 TypeScript 文件、51 万行代码、59 个工具定义、44 个 feature flag，全部躺在那里，整整齐齐。

Anthropic 在几小时内下架了版本，但 GitHub 上已经出现了镜像。代码在互联网上学会了自我复制。

:::aha 最讽刺的地方
源码里本来有一套完整的「防泄露模式」（Undercover Mode），结果真正的泄露是因为打包脚本少写了一行 \`.npmignore\`。安全工程里最古老的笑话：你造了十道门，忘了关窗。
:::

## 为什么是 40%，而不是 100%

一个常见的误解：Claude Code 好用，是因为 Anthropic 的模型强。

模型当然强。但同一个模型，套上不同的 harness（笼具），就是完全不同的产品。你可以用同一个 API 写出「会聊天的自动补全」，也可以写出「能自己修 CI 的实习生」。差别不在模型，在你围绕模型搭的那套系统：工具、权限、上下文、记忆、循环、护栏。

我的判断是：Claude Code 的体验，大约 60% 来自模型能力，40% 来自 harness 工程。

这本书只讲那 40%。

:::tip 为什么 40% 更值得学
模型能力你控制不了，换一代就洗牌；harness 工程你能控制，而且跨模型、跨语言、跨框架都能复用。把 40% 学到手，你换任何模型都能立刻组装出一个能干活的东西。
:::

## 五个数字，建立量级

| 指标 | 数字 | 这意味着什么 |
| --- | --- | --- |
| TypeScript 文件 | 约 1,900 | 全部严格模式，没有 \`any\` 满地跑 |
| 代码行数 | 约 510,000 | 一个人逐行读完大约要两年 |
| 内置工具 | 59 | 但只有 4 个原语：读、写、跑、连 |
| Feature Flags | 44 | 未发布功能的藏身处，路线图最诚实的泄露者 |
| 权限分类器预算 | 64 → 4,096 token | 先用白菜价粗筛，再决定要不要细想 |

看完这张表，你应该得出一个结论：**逐行读源码是策略上的懒惰**。你读不完，读完了也记不住，记住了也未必用得上。

正确姿势是：找到那些「一个决定影响一万行」的地方，把它拆开。

## 这本书怎么拆

每一章都遵循同一个结构：

1. **这个系统在解决什么问题**——先讲人话，讲你遇到过的那种痛。
2. **Anthropic 怎么解的**——拆关键设计，必要时上代码。
3. **为什么不是另一种解**——讲取舍，讲代价。
4. **你能抄走什么**——给一份能落地的清单。

不追求覆盖每一个文件，追求每一个讲到的点都能让你在下次设计 Agent 时少踩一个坑。

## 你的身份，决定你的起跑线

| 你现在是谁 | 建议路线 | 为什么 |
| --- | --- | --- |
| 用过 Claude Code，但没看过内部 | 第 2 章 → 第 3 章 → 第 5 章 | 先建立骨架，再看循环和工具 |
| 正在自己做 Agent | 第 3、5、7 章 → 第 12 章 | 这三章能救活 80% 的早期设计问题 |
| 想转岗 / 面试 Agent 工程师 | 第 16 章 → 第 17 章 → 回读第 4 章 | 方法论 + 路线图，面试最缺的是「为什么」 |
| 带团队的技术负责人 | 第 6、13、14 章 | 权限、安全、功能治理，都是团队级决策 |

:::quote 一句话总结
源码是别人的，决策可以是你的。
:::

## 本章带走

- [ ] 别再问「Claude Code 为什么好用」，改问「它的 harness 做了哪些反直觉的选择」
- [ ] 记住 60/40 这个拆分：模型决定上限，harness 决定兑现多少
- [ ] 把「读源码」换成「读决策」：每个设计都问一句「不这么做会怎样」
- [ ] 收藏第 1 章的时间线，下次有人吹「AI 工具没有护城河」时给他看`,
      en: `This chapter is not about code. It is about why a leaked repository deserves seventeen chapters of your time.

Because the value is not in the 510,000 lines. It is in the decisions buried inside them. Code tells you what and how; decisions tell you why. And only why travels.

## The scene: the most expensive missing line

There is a prequel. When Claude Code launched in February 2025, its package already shipped source maps. Nobody cared — most source maps contain minified names that read like noise.

The real setup came on 11 March 2026: the community noticed a known Bun issue where source maps could still be served in production. The issue stayed open. Nobody expected it to bite.

Then came 31 March.

:::chart leak-timeline
:::

A security researcher noticed that npm package v2.1.88 weighed 59.8 MB — several times the normal size. Unpacked, it held roughly 1,900 strict TypeScript files, 510,000 lines, 59 tool definitions and 44 feature flags, all neatly arranged.

Anthropic pulled the version within hours, but mirrors were already up. The code had learned to replicate.

:::aha The most ironic part
The source already contained a full anti-leak mode. The actual leak happened because a packing script missed one line of \`.npmignore\`. The oldest joke in security: you built ten doors and forgot the window.
:::

## Why 40%, not 100%

A common misconception: Claude Code is good because Anthropic's models are strong.

The model is strong, sure. But the same model under a different harness is a different product. With one API you can build "chatty autocomplete"; with another you can build "an intern that fixes CI by itself". The difference is not the model, it is the system around it: tools, permissions, context, memory, loop, guardrails.

My read: roughly 60% of the Claude Code experience comes from model capability, 40% from harness engineering.

This book is about the 40%.

:::tip Why the 40% is the better investment
You do not control model capability; a new generation reshuffles the board. You do control harness engineering, and it transfers across models, languages and frameworks. Learn the 40% and you can assemble a working agent on top of any model tomorrow.
:::

## Five numbers for scale

| Metric | Number | What it means |
| --- | --- | --- |
| TypeScript files | ~1,900 | Strict mode throughout, no \`any\` soup |
| Lines of code | ~510,000 | Roughly two years for one human to read |
| Built-in tools | 59 | But only four primitives: read, write, run, connect |
| Feature flags | 44 | Where unreleased work hides — the honest leak of a roadmap |
| Permission budget | 64 → 4,096 tokens | A cheap first pass before paying for a deeper think |

The conclusion is uncomfortable: **reading every line is strategic laziness**. You will not finish, you will not remember, and remembering would not help.

The right move is to find the places where one decision shapes ten thousand lines, and take those apart.

## How this book is built

Every chapter follows the same shape:

1. **What problem this system solves** — plain language, the pain you have felt.
2. **How Anthropic solved it** — key designs, code when it earns its place.
3. **Why not the other way** — trade-offs and costs.
4. **What you can steal** — a list you can act on.

Coverage is not the goal. Every point should save you one mistake the next time you design an agent.

## Your starting line depends on who you are

| Who you are | Suggested path | Why |
| --- | --- | --- |
| Used Claude Code, never looked inside | ch.2 → ch.3 → ch.5 | Skeleton first, then loop and tools |
| Building your own agent | ch.3, 5, 7 → ch.12 | These three fix 80% of early design mistakes |
| Switching roles / interviewing | ch.16 → ch.17 → back to ch.4 | Method plus roadmap; interviews lack the why |
| Tech lead | ch.6, 13, 14 | Permissions, security and flags are team-level calls |

:::quote One line
The source belongs to them. The decisions can belong to you.
:::

## Takeaways

- [ ] Stop asking "why is Claude Code good"; ask "which counter-intuitive harness calls did it make"
- [ ] Keep the 60/40 split: the model sets the ceiling, the harness collects it
- [ ] Replace "read the source" with "read the decision": always ask what breaks otherwise
- [ ] Keep the timeline handy for the next person claiming AI tools have no moat`,
    },
    sources: [
      src(c("花生 · Claude Code 源码解析（事件时间线）", "Huasheng · Claude Code teardown (timeline)"), "https://www.huasheng.ai/orange-books/source-code/read/", "huasheng.ai"),
      src(c("Anthropic 工程博客 · 构建高效 Agent", "Anthropic Engineering · Building effective agents"), "https://www.anthropic.com/engineering/building-effective-agents", "anthropic.com/engineering"),
      src(c("Claude Code 官方文档", "Claude Code documentation"), "https://code.claude.com/docs", "code.claude.com"),
    ],
  },

  {
    id: "02-architecture",
    num: "02",
    part: 1,
    read: 12,
    tags: { zh: ["架构", "Harness"], en: ["Architecture", "Harness"] },
    title: c("架构全景：Harness 的六层骨架", "Architecture: the six layers of a harness"),
    sub: c("先看懂骨架，再谈细节", "Skeleton first, details later"),
    lead: c(
      "把 Claude Code 想成一辆车：模型是发动机，harness 是底盘、变速箱、刹车和仪表盘。发动机决定能跑多快，其余部分决定你敢不敢开快。",
      "Think of Claude Code as a car: the model is the engine, the harness is the chassis, gearbox, brakes and dashboard. The engine sets the top speed; everything else decides whether you dare use it."
    ),
    body: {
      zh: `这一章只做一件事：给你一张地图。后面 15 章，都是在地图上某个格子里往下挖。

## 一句话定义 harness

> Harness 是围绕模型搭建的一整套运行时系统：它决定模型能看到什么、能做什么、做完之后世界变成什么样，以及什么时候必须停下来问人。

注意这句话里的四个动词：**看到、能做、变成、停下来**。它们分别对应上下文、工具、状态与权限。再加一个「怎么循环」，就是完整的骨架。

:::tip 一个判断标准
如果去掉模型，剩下的那部分还能独立运行、还值得单独测试，那它就是 harness。你的 Agent 项目里，harness 的代码量通常应该是模型的 10 倍以上——如果你写了 200 行 prompt 就宣布完成，那你做的不是 Agent，是聊天机器人。
:::

## 六层骨架

<div class="layers">
  <div class="layer"><b>L1 · 入口层</b><span>CLI、REPL、Slash 命令、IDE 插件、SDK。负责把人的意图翻译成一次会话。</span></div>
  <div class="layer"><b>L2 · 循环层</b><span>Agent Loop（TAOR）：Think → Act → Observe → Repeat。整个产品的心跳。</span></div>
  <div class="layer"><b>L3 · 能力层</b><span>工具系统：59 个工具，4 个原语。模型唯一的「手」。</span></div>
  <div class="layer"><b>L4 · 上下文层</b><span>System Prompt、CLAUDE.md、压缩、检索。决定模型此刻「记得什么」。</span></div>
  <div class="layer"><b>L5 · 安全层</b><span>权限模式、分类器、Hooks、沙箱。决定哪些动作能落地。</span></div>
  <div class="layer"><b>L6 · 状态层</b><span>会话持久化、任务列表、成本统计、遥测。让长跑可恢复、可观测。</span></div>
</div>

这六层不是 Anthropic 官方文档里的划分，而是我拆完之后觉得最好用的一种切法。它的好处是：每一层都能单独问一句「如果我只有 200 行预算，这层该保留什么」。

## 一次请求的旅程（速览）

<div class="flow">
  <div class="flow-step"><b>01 · 输入</b><p>你敲下一句话。入口层做语法解析、Slash 命令展开、附件预处理。</p></div>
  <div class="flow-step"><b>02 · 组装</b><p>上下文层拼出 system prompt、工具 schema、CLAUDE.md、历史消息。</p></div>
  <div class="flow-step"><b>03 · 推理</b><p>模型返回文本或 tool_use。此时世界还没有任何变化。</p></div>
  <div class="flow-step"><b>04 · 审查</b><p>安全层决定这个工具调用是自动放行、还是拿来问你。</p></div>
  <div class="flow-step"><b>05 · 执行</b><p>工具真正运行，结果回填进上下文，进入下一圈。</p></div>
</div>

第 3 章会把这条链路拆到每一行。这里你只需要记住一件事：**模型永远不直接改变世界，它只能请求调用工具**。这个间接层，是整个安全模型的地基。

## 三个反直觉的架构选择

### 1. 单线程循环，而不是复杂的编排图

很多 Agent 框架喜欢画 DAG：节点、边、条件分支、并行。Claude Code 的主循环非常朴素——一个 while，每次调用一次模型，有工具就执行，没工具就结束。

为什么？因为 LLM 最擅长的就是决定下一步做什么。你在外面再套一层状态机，等于用代码去猜模型的判断，通常猜不准，还失去了灵活性。

:::aha 一个类比
DAG 像地铁：线路固定，换乘麻烦，但可预测。Agent Loop 像出租车：路线随机，但能处理「前面修路」。Claude Code 选择了出租车，因为编程任务的「路况」实在太不可预测。
:::

### 2. 工具少而正交，而不是多而专用

59 个工具听起来很多，但核心只有四类动作：读（Read/Grep/Glob）、写（Edit/Write）、跑（Bash）、连（MCP/WebFetch）。其余工具都是这四类的组合或特化。

工具越正交，模型越容易组合；工具越专用，schema 越占上下文，模型越容易选错。

### 3. 把不确定性关进确定性

模型是概率性的，但产品必须可靠。Claude Code 的做法是：**能用代码保证的，绝不交给提示词**。

「改完文件必须跑格式化」不写成 prompt，写成 PostToolUse hook；「删库必须问人」不写成 prompt，写进权限规则。提示词是建议，代码是法律。

## 一张表：哪层最容易做错

| 层 | 新手常见做法 | 更接近 Claude Code 的做法 |
| --- | --- | --- |
| 循环 | 最多转 5 圈就停 | 让模型自己决定停，代码只兜底异常 |
| 工具 | 一个功能一个工具，越细越好 | 少而正交，用描述教模型何时用 |
| 上下文 | 把所有资料塞进 system prompt | 分层加载，按需披露，保护缓存前缀 |
| 安全 | 用 prompt 写「不要删库」 | 权限规则 + hook 硬拦截 |
| 状态 | 只存聊天记录 | 存任务、文件快照、成本、可恢复点 |

## 本章带走

- [ ] 用「看到 / 能做 / 变成 / 停下来」四问检查你的 Agent 设计
- [ ] 主循环保持朴素：一个 while，加异常兜底，别急着上 DAG
- [ ] 工具设计追求正交，而不是覆盖所有场景
- [ ] 把「必须发生」的事从提示词迁移到代码（hook / 权限 / 校验）
- [ ] 给每一层留一个「200 行最小实现」的版本，先跑通再变复杂`,
      en: `This chapter does one thing: hand you a map. The next fifteen chapters dig inside one square of it.

## Harness in one sentence

> A harness is the runtime built around a model: it decides what the model can see, what it can do, what the world looks like afterwards, and when it must stop and ask a human.

Four verbs: **see, do, become, stop**. They map to context, tools, state and permissions. Add "how it loops" and the skeleton is complete.

:::tip A useful test
Remove the model. If the rest still runs and deserves its own tests, that is the harness. In a real agent project the harness is usually ten times the code of the model layer. If you wrote 200 lines of prompt and called it done, you built a chatbot, not an agent.
:::

## Six layers

<div class="layers">
  <div class="layer"><b>L1 · Entry</b><span>CLI, REPL, slash commands, IDE plugins, SDK. Turns human intent into a session.</span></div>
  <div class="layer"><b>L2 · Loop</b><span>The agent loop (TAOR): Think → Act → Observe → Repeat. The heartbeat.</span></div>
  <div class="layer"><b>L3 · Capability</b><span>Tools: 59 of them, four primitives. The model's only hands.</span></div>
  <div class="layer"><b>L4 · Context</b><span>System prompt, CLAUDE.md, compaction, retrieval. What the model remembers right now.</span></div>
  <div class="layer"><b>L5 · Safety</b><span>Permission modes, classifiers, hooks, sandboxing. What is allowed to land.</span></div>
  <div class="layer"><b>L6 · State</b><span>Session persistence, task lists, cost accounting, telemetry. Makes long runs recoverable.</span></div>
</div>

This is not an official Anthropic diagram; it is the cut that survived my own teardown. Its value: every layer can be asked "what stays if I only have 200 lines".

## One request, in brief

<div class="flow">
  <div class="flow-step"><b>01 · Input</b><p>You type. The entry layer parses, expands slash commands, preprocesses attachments.</p></div>
  <div class="flow-step"><b>02 · Assemble</b><p>The context layer builds system prompt, tool schemas, CLAUDE.md and history.</p></div>
  <div class="flow-step"><b>03 · Reason</b><p>The model returns text or a tool_use. Nothing in the world has changed yet.</p></div>
  <div class="flow-step"><b>04 · Review</b><p>The safety layer decides: auto-approve, or ask the human.</p></div>
  <div class="flow-step"><b>05 · Execute</b><p>The tool runs, the result returns to context, the loop spins again.</p></div>
</div>

Chapter 3 takes this apart line by line. For now remember one thing: **the model never changes the world directly — it can only request a tool call**. That indirection is the foundation of the entire safety model.

## Three counter-intuitive choices

### 1. A single-threaded loop, not an orchestration graph

Many frameworks love DAGs: nodes, edges, branches, parallelism. Claude Code's main loop is almost boring — a while, one model call per spin, execute tools if any, stop if none.

Why? Because deciding the next step is exactly what an LLM is good at. Wrapping another state machine around it means guessing the model's judgement in code, usually wrongly, while losing flexibility.

:::aha An analogy
A DAG is a subway: fixed lines, painful transfers, predictable. An agent loop is a taxi: random route, but it handles the road being dug up. Claude Code takes the taxi, because programming's road conditions are violently unpredictable.
:::

### 2. Few orthogonal tools, not many specialised ones

59 sounds like a lot, but the core moves are four: read (Read, Grep, Glob), write (Edit, Write), run (Bash), connect (MCP, WebFetch). Everything else is a composition or a specialisation.

Orthogonal tools compose in the model's head. Specialised tools bloat the schema, cost context, and get picked wrongly.

### 3. Confine uncertainty with determinism

Models are probabilistic; products must be reliable. Claude Code's rule: **anything that can be guaranteed by code never relies on a prompt**.

"Format after editing" is a PostToolUse hook, not a sentence. "Ask before dropping a database" is a permission rule, not a polite request. Prompts are advice; code is law.

## Which layer is easiest to get wrong

| Layer | Beginner move | Closer to Claude Code |
| --- | --- | --- |
| Loop | Stop after five spins | Let the model stop; code only catches exceptions |
| Tools | One tool per feature, ever finer | Few and orthogonal; descriptions teach usage |
| Context | Dump everything into the system prompt | Layer it, disclose on demand, protect the cache prefix |
| Safety | Prompt: "never delete data" | Permission rules plus hard hooks |
| State | Store chat history only | Store tasks, file snapshots, cost, resume points |

## Takeaways

- [ ] Audit your design with four questions: see / do / become / stop
- [ ] Keep the loop boring: one while plus exception handling, resist the DAG
- [ ] Optimise tools for orthogonality, not coverage
- [ ] Move "must happen" out of prompts into code (hooks, permissions, validation)
- [ ] Write a 200-line version of every layer first, then complicate it`,
    },
    sources: [
      src(c("Anthropic 工程博客 · 构建高效 Agent", "Anthropic Engineering · Building effective agents"), "https://www.anthropic.com/engineering/building-effective-agents", "anthropic.com/engineering"),
      src(c("Anthropic 工程博客 · Claude Code 最佳实践", "Anthropic Engineering · Claude Code best practices"), "https://www.anthropic.com/engineering/claude-code-best-practices", "anthropic.com/engineering"),
      src(c("Claude Code 官方文档", "Claude Code documentation"), "https://code.claude.com/docs", "code.claude.com"),
      src(c("鱼心快跑 · 如何构建更好的 Agent", "Yuxin Rush · Building a better agent"), "https://yuxinrun.github.io/better-agent/", "yuxinrun.github.io"),
    ],
  },
];