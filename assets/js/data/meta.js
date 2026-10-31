export const SITE = {
  name: { zh: "Claude Code 源码解析", en: "Claude Code: Source Decoded" },
  sub: { zh: "鱼心快跑 · Yuxin Rush", en: "Yuxin Rush" },
  author: { zh: "鱼心", en: "Yuxin" },
  brand: { zh: "鱼心快跑", en: "Yuxin Rush" },
  site: "https://www.yuxin.run",
  url: "https://yuxinrun.github.io/claude-code-analysis/",
  github: "https://github.com/yuxinrun/claude-code-analysis",
  motto: { zh: "鱼心快跑，Bug 追不到。", en: "Run, Yuxin, run — bugs can't catch you." },
  edition: "v1.0 · 2026-10",
};

export const UI = {
  "nav.home": { zh: "首页", en: "Home" },
  "nav.chapters": { zh: "章节", en: "Chapters" },
  "nav.dashboard": { zh: "报表中心", en: "Dashboards" },
  "nav.roadmap": { zh: "转型路线", en: "Roadmap" },
  "nav.glossary": { zh: "术语表", en: "Glossary" },
  "nav.sources": { zh: "资料来源", en: "Sources" },
  "nav.about": { zh: "关于", en: "About" },
  "brand.title": SITE.name,
  "brand.sub": SITE.sub,
  "footer.note": {
    zh: "本站为学习用途的技术解读，不隶属于 Anthropic；结论以官方文档与一手拆解为准。",
    en: "A fan-made engineering study. Not affiliated with Anthropic; official docs and primary teardowns take precedence.",
  },
};

export const PARTS = [
  { id: 1, name: { zh: "第一部分 · 全景", en: "Part I · The Big Picture" }, blurb: { zh: "先看懂骨架，再谈细节。", en: "Skeleton first, details later." } },
  { id: 2, name: { zh: "第二部分 · 核心系统", en: "Part II · Core Systems" }, blurb: { zh: "六个把模型变成产品的子系统。", en: "The six subsystems that turn a model into a product." } },
  { id: 3, name: { zh: "第三部分 · 高级架构", en: "Part III · Advanced Architecture" }, blurb: { zh: "多 Agent、扩展面、渲染与成本。", en: "Multi-agent, extension surface, rendering, cost." } },
  { id: 4, name: { zh: "第四部分 · 边界", en: "Part IV · The Edge Cases" }, blurb: { zh: "安全、未来功能与两个 Claude Code。", en: "Security, unreleased features, and the two Claude Codes." } },
  { id: 5, name: { zh: "第五部分 · 方法论与职业", en: "Part V · Method & Career" }, blurb: { zh: "把别人的决策变成你的能力。", en: "Turn their decisions into your craft." } },
];

export const SISTER = [
  { slug: "better-agent", name: { zh: "如何构建更好的 Agent", en: "Building a Better Agent" }, desc: { zh: "转型 Agent 开发的实战手册", en: "Field handbook for agent development" } },
  { slug: "harness-engineering", name: { zh: "Harness Engineering", en: "Harness Engineering" }, desc: { zh: "笼具工程学方法论", en: "The methodology behind the harness" } },
  { slug: "agent-loop-engineering", name: { zh: "Agent Loop 工程", en: "Agent Loop Engineering" }, desc: { zh: "循环、停止条件与自愈", en: "Loops, stop conditions, self-repair" } },
  { slug: "agent-memory-patterns", name: { zh: "Agent 记忆模式", en: "Agent Memory Patterns" }, desc: { zh: "跨会话持久化的取舍", en: "Persistence trade-offs across sessions" } },
  { slug: "agent-evaluation-patterns", name: { zh: "Agent 评估模式", en: "Agent Evaluation Patterns" }, desc: { zh: "怎么知道它真的变好了", en: "How to know it actually got better" } },
  { slug: "agent-observability-patterns", name: { zh: "Agent 可观测性", en: "Agent Observability" }, desc: { zh: "追踪、指标与成本仪表盘", en: "Traces, metrics, cost dashboards" } },
  { slug: "agent-skillhub-patterns", name: { zh: "Skill 市场模式", en: "Skill Hub Patterns" }, desc: { zh: "能力的分发与治理", en: "Distributing and governing capabilities" } },
  { slug: "agent-ontology", name: { zh: "Agent 本体论", en: "Agent Ontology" }, desc: { zh: "给 Agent 世界建模", en: "Modelling the agent's world" } },
  { slug: "mcp-patterns", name: { zh: "MCP 模式集", en: "MCP Patterns" }, desc: { zh: "工具协议的工程实践", en: "Engineering the tool protocol" } },
  { slug: "rag-flow", name: { zh: "RAG Flow", en: "RAG Flow" }, desc: { zh: "检索增强的流程图", en: "Retrieval-augmentation, diagrammed" } },
  { slug: "llm-gateway-patterns", name: { zh: "LLM 网关模式", en: "LLM Gateway Patterns" }, desc: { zh: "路由、配额与成本治理", en: "Routing, quotas, cost control" } },
  { slug: "deepseek-harness", name: { zh: "DeepSeek Harness", en: "DeepSeek Harness" }, desc: { zh: "另一种模型的笼具选择", en: "A harness for another model family" } },
  { slug: "lean-strong", name: { zh: "Lean Strong", en: "Lean Strong" }, desc: { zh: "精简而强大的工程习惯", en: "Lean, strong engineering habits" } },
  { slug: "live-better", name: { zh: "Live Better", en: "Live Better" }, desc: { zh: "把工程师的生活也重构", en: "Refactoring the engineer's life" } },
];

export const FAQ = [
  {
    q: { zh: "这是官方文档吗？", en: "Is this official documentation?" },
    a: { zh: "不是。这是第三方学习笔记，不隶属于 Anthropic。所有事实都标了出处，官方口径以 code.claude.com/docs 与 anthropic.com 为准；和官方冲突时，请信官方。", en: "No — it is an independent study guide, not affiliated with Anthropic. Every claim carries a source; when this site disagrees with code.claude.com/docs or anthropic.com, believe the official one." },
  },
  {
    q: { zh: "源码不是没开源吗，你解析的是什么？", en: "Claude Code isn't open source — what are you analysing?" },
    a: { zh: "三个来源：官方文档与工程博客（最可靠）、2026 年 3 月 npm 包里意外带出的 source map 与社区据此的拆解（次可靠，属事件性材料）、以及我自己反复观察 CLI 行为得到的推断（会在正文标注为「推断」）。每一章末尾都有来源清单和可信度说明。", en: "Three layers: official docs and engineering blogs (strongest); the March 2026 npm package that shipped source maps plus community teardowns of it (event-based, weaker); and my own observation of CLI behaviour, always labelled as inference. Each chapter ends with a source list and confidence notes." },
  },
  {
    q: { zh: "我应该从哪一章开始？", en: "Where should I start?" },
    a: { zh: "用过 Claude Code 但没读过内部实现：直接从第 2 章架构全景开始。正在自己做 Agent：先读第 3 章请求旅程 + 第 5 章工具系统 + 第 7 章上下文，这三章能救活你 80% 的设计问题。面试/转岗导向：读第 16 章方法论 + 第 17 章路线图。", en: "Used it but never looked inside: start at ch.2 Architecture. Building your own agent: ch.3 Anatomy of a Request, ch.5 Tools, ch.7 Context — those three fix 80% of naive designs. Career switcher: ch.16 Method + ch.17 Roadmap." },
  },
  {
    q: { zh: "为什么要有「报表中心」？", en: "Why a dashboard page?" },
    a: { zh: "Agent 工程一半的钱花在「看不见的 token」上。把缓存命中、上下文预算、工具分布、成本结构画出来，才谈得上优化。图表数据分三类标注：官方公布、社区实测、示意估算。", en: "Half of agent engineering is spending money on tokens you never looked at. You cannot optimise cache hits, context budget or tool distribution until you draw them. Every chart is tagged: official, community-measured, or illustrative estimate." },
  },
  {
    q: { zh: "中英文内容完全一样吗？", en: "Are the Chinese and English versions identical?" },
    a: { zh: "结构与结论一致，表达各自地道：中文更口语、案例偏国内工程语境；英文更直给、术语用行业通用写法。代码、图表与数据来源两边共享。", en: "Same structure and conclusions, each written idiomatically: Chinese is more conversational with local engineering context, English is blunter with industry terms. Code, charts and sources are shared." },
  },
];

export const GLOSSARY = [
  { t: { zh: "Harness（笼具）", en: "Harness" }, cat: "架构", c: { zh: "围绕模型搭的那套系统：工具、权限、上下文、记忆、循环、护栏。模型决定能力上限，harness 决定上限能兑现多少。", en: "Everything you build around a model: tools, permissions, context, memory, loop, guardrails. The model sets the ceiling; the harness decides how much of it you actually collect." } },
  { t: { zh: "Agent Loop / TAOR", en: "Agent Loop / TAOR" }, cat: "架构", c: { zh: "Think→Act→Observe→Repeat 的循环。每一圈都是一次完整的模型调用，工具调用是唯一的「Act」手段，停止条件由模型自己判断。", en: "Think→Act→Observe→Repeat. Each spin is a full model call; tool use is the only way to Act, and the model itself decides when to stop." } },
  { t: { zh: "Prompt Caching（提示缓存）", en: "Prompt Caching" }, cat: "成本", c: { zh: "请求前缀完全一致时复用已计算的 KV，读取价格远低于写入价。前缀里任何一处变动，其后全部重新计算。", en: "Reusing computed KV state when the request prefix matches exactly. Cache reads are far cheaper than writes; one byte of change in the prefix invalidates everything after it." } },
  { t: { zh: "动态分界线", en: "Dynamic Boundary" }, cat: "成本", c: { zh: "把 system prompt 切成「人人共享的静态段」和「每会话独立的动态段」的标记，用来保护缓存前缀不被条件分支打碎。", en: "A marker splitting the system prompt into a globally shared static part and a per-session dynamic part, protecting the cache prefix from conditional branches." } },
  { t: { zh: "Agentic Search", en: "Agentic Search" }, cat: "检索", c: { zh: "不建向量索引，让模型像工程师一样用 grep/glob/Read 现场导航代码库。优点是从最新状态出发，缺点是超大代码库会先撞上下文墙。", en: "No embedding index: the model navigates the repo live with grep/glob/Read. It always starts from current state, but on billion-line repos you hit the context wall first." } },
  { t: { zh: "Compaction（压缩续跑）", en: "Compaction" }, cat: "上下文", c: { zh: "接近窗口上限时，把历史对话结构化成摘要再续跑，用少量精度换取继续工作的能力。", en: "Near the window limit, history is distilled into a structured summary so work continues — trading some fidelity for the ability to carry on." } },
  { t: { zh: "CLAUDE.md", en: "CLAUDE.md" }, cat: "记忆", c: { zh: "项目级长期记忆文件，按企业/项目/用户分层加载，等价于给模型的「入职培训材料」。", en: "Layered project memory (enterprise / project / user) — the onboarding doc you hand the model every session." } },
  { t: { zh: "Subagent（子 Agent）", en: "Subagent" }, cat: "多 Agent", c: { zh: "独立上下文窗口的专职助手。父 Agent 给任务、拿结论，中间过程不污染主上下文。", en: "A specialist with its own context window. The parent sends a task and gets a conclusion; the messy middle stays out of the main context." } },
  { t: { zh: "MCP", en: "MCP (Model Context Protocol)" }, cat: "扩展", c: { zh: "把外部系统作为工具接入的开放协议。代价是工具定义本身也要占上下文，服务器越多，token 税越重。", en: "An open protocol for plugging external systems in as tools. The tax: tool definitions themselves consume context — more servers, bigger bill." } },
  { t: { zh: "Hook（钩子）", en: "Hook" }, cat: "扩展", c: { zh: "在工具调用前后插入的确定性脚本，把「必须发生的事」从概率性指令变成代码。", en: "Deterministic scripts around tool calls — moving what must happen from probabilistic instructions into code." } },
  { t: { zh: "权限模式", en: "Permission Modes" }, cat: "安全", c: { zh: "default / acceptEdits / plan / bypass 等档位，决定哪些操作自动放行、哪些必须问人。", en: "default / acceptEdits / plan / bypass — the dial between ‘ask me’ and ‘don’t bother me’." } },
  { t: { zh: "Context Rot（上下文腐化）", en: "Context Rot" }, cat: "上下文", c: { zh: "token 越多，模型精确回忆的能力越差。上下文是有限资源，不是仓库。", en: "Recall accuracy degrades as tokens accumulate. Context is a depleting resource, not a warehouse." } },
  { t: { zh: "Progressive Disclosure（渐进披露）", en: "Progressive Disclosure" }, cat: "扩展", c: { zh: "技能/工具的说明只在需要时才被读进上下文：先给目录，正文按需加载。", en: "Skills and tools are read only when needed: metadata first, body on demand." } },
  { t: { zh: "Token 经济学", en: "Token Economics" }, cat: "成本", c: { zh: "Agent 的每次循环都要重发上下文，成本 ≈ 循环数 × 上下文大小。省钱的两条路：缓存命中与少发内容。", en: "Every loop re-sends the context, so cost ≈ loops × context size. Two levers: hit the cache, and send less." } },
  { t: { zh: "Feature Flag（功能开关）", en: "Feature Flag" }, cat: "架构", c: { zh: "源码里未发布能力的开关，也是路线图最诚实的泄露者。", en: "Switches for unreleased capability — the roadmap's most honest leak." } },
];

export const ROADMAP = {
  intro: {
    zh: "从「会用 Claude Code」到「能设计一个 Claude Code」，中间不是再多读几篇论文，而是一连串可验证的里程碑。下面这条 12 周路径按「每周可交付」设计，跑完你就有一件能拿出来讲的作品。",
    en: "The gap between ‘using Claude Code’ and ‘being able to design one’ isn’t more papers — it’s a set of verifiable milestones. This 12-week path is built around what you can ship each week, and ends with something you can show in an interview.",
  },
  levels: [
    {
      rung: { zh: "Lv.1 使用者", en: "Lv.1 Operator" },
      weeks: { zh: "第 1–2 周", en: "Weeks 1–2" },
      goal: { zh: "把工具用熟，理解你按下的每个键背后发生了什么", en: "Use the tool fluently and know what happens behind every key" },
      items: [
        { zh: "读第 1–3 章，画出一次请求的完整旅程", en: "Read ch.1–3 and diagram one full request" },
        { zh: "写一份 CLAUDE.md，观察它如何改变行为", en: "Write a CLAUDE.md and observe the behaviour change" },
        { zh: "用 /cost 与 /context 建立 token 直觉", en: "Build token intuition with /cost and /context" },
      ],
      deliver: { zh: "交付物：一份被同事复用的项目记忆文件", en: "Deliverable: a memory file a teammate reuses" },
    },
    {
      rung: { zh: "Lv.2 组装工", en: "Lv.2 Assembler" },
      weeks: { zh: "第 3–5 周", en: "Weeks 3–5" },
      goal: { zh: "能用 API 搭一个带工具的最小 Agent", en: "Ship a minimal tool-using agent against the API" },
      items: [
        { zh: "实现 5 个工具：Read/Write/Bash/Grep/Fetch 的等价物", en: "Implement 5 tools: Read/Write/Bash/Grep/Fetch equivalents" },
        { zh: "手写一次 tool_use 循环，包含错误回填", en: "Hand-roll one tool_use loop with error feedback" },
        { zh: "读第 4–6 章，抄作业：schema、只读标记、权限询问", en: "Read ch.4–6 and copy homework: schema, read-only flags, ask-first" },
      ],
      deliver: { zh: "交付物：一个 200 行以内、能自动修 lint 的 agent", en: "Deliverable: a sub-200-line agent that fixes lint by itself" },
    },
    {
      rung: { zh: "Lv.3 工程化", en: "Lv.3 Industrialise" },
      weeks: { zh: "第 6–9 周", en: "Weeks 6–9" },
      goal: { zh: "让它在长跑中不崩、不烧钱、不闯祸", en: "Make it survive long runs without burning money or causing damage" },
      items: [
        { zh: "接入 prompt caching，量化命中率与成本曲线", en: "Add prompt caching; measure hit rate and cost curve" },
        { zh: "实现压缩续跑与上下文预算分配", en: "Implement compaction and a context budget" },
        { zh: "加权限系统与 hook：PreToolUse 拦截危险命令", en: "Add permissions + a PreToolUse hook blocking dangerous commands" },
        { zh: "读第 7–9 章、第 14 章", en: "Read ch.7–9 and ch.14" },
      ],
      deliver: { zh: "交付物：一份成本/延迟报表 + 一次事故复盘", en: "Deliverable: a cost/latency report plus one incident review" },
    },
    {
      rung: { zh: "Lv.4 编排者", en: "Lv.4 Orchestrator" },
      weeks: { zh: "第 10–12 周", en: "Weeks 10–12" },
      goal: { zh: "从单 Agent 到系统：分工、隔离、评估", en: "From one agent to a system: division, isolation, evaluation" },
      items: [
        { zh: "拆出 2 个子 Agent，验证上下文隔离的收益", en: "Split out 2 subagents and measure the isolation payoff" },
        { zh: "建一套 20 条用例的评估集，跑 A/B", en: "Build a 20-case eval set and run A/B" },
        { zh: "读第 10–11 章、第 16 章方法论", en: "Read ch.10–11 and the ch.16 method" },
      ],
      deliver: { zh: "交付物：可复现的评估报告（含失败样本）", en: "Deliverable: a reproducible eval report including failures" },
    },
  ],
};
