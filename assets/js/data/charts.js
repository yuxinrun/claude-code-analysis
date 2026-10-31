/* ============================================================
   Chart specs · every number here is an order-of-magnitude
   illustration unless a source is attached. Colours resolve
   through CSS variables, so both themes work for free.
   ============================================================ */

const c = (zh, en) => ({ zh, en });

export const CHART_GROUPS = [
  { name: c("循环与上下文", "Loops & context"), desc: c("每一圈都在重发上下文，钱就是这样烧掉的", "Every loop re-sends the context — that is where the money goes") },
  { name: c("工具与权限", "Tools & permissions"), desc: c("59 个工具，4 个原语；权限是一场漏斗", "59 tools, 4 primitives; permissions are a funnel") },
  { name: c("缓存与成本", "Cache & cost"), desc: c("缓存命中率决定账单，流式决定体感", "Cache hit rate sets the bill, streaming sets the feel") },
  { name: c("检索与记忆", "Retrieval & memory"), desc: c("grep 不是落后，是选择；记忆不是越多越好", "Grep is a choice, not a lag; memory is not a hoard") },
  { name: c("多 Agent", "Multi-agent"), desc: c("拆的不是任务，是上下文", "What you split is context, not tasks") },
  { name: c("方法与成长", "Method & growth"), desc: c("评估是闸门，雷达是地图", "Evals are the gate, the radar is the map") },
];

const doc = (label, url) => ({ label, url });

export const CHART_SPECS = {
  /* ---------- 1. loop token growth ---------- */
  "loop-tokens": {
    type: "line",
    group: c("循环与上下文", "Loops & context"),
    title: c("同样一次任务，三种策略的累计输入 token", "One task, three strategies, cumulative input tokens"),
    sub: c("横轴是 Agent 循环圈数。无缓存时成本随圈数线性上涨，因为每一圈都要重发全部上下文。", "The x-axis is loop count. Without caching the cost grows linearly, because every loop re-sends the whole context."),
    xs: c(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]),
    series: [
      { name: c("无缓存", "No cache"), values: [20, 40, 60, 80, 100, 120, 140, 160, 180, 200], color: "coral", area: true },
      { name: c("缓存命中", "Cache hits"), values: [20, 22, 24, 26, 28, 30, 32, 34, 36, 38], color: "accent", area: true },
      { name: c("缓存 + 压缩", "Cache + compaction"), values: [20, 22, 24, 26, 22, 24, 26, 28, 30, 32], color: "blue" },
    ],
    unit: "K",
    max: 220,
    source: [doc(c("Anthropic · Prompt caching", "Anthropic · Prompt caching"), "https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching")],
    note: c("示意估算：单轮完整上下文按 20K 计。", "Illustrative: 20K full context per loop."),
  },

  /* ---------- 2. context budget ---------- */
  "context-budget": {
    type: "stack",
    group: c("循环与上下文", "Loops & context"),
    title: c("200K 窗口不是仓库，是一张预算表", "A 200K window is a budget sheet, not a warehouse"),
    sub: c("每一项都要抢位置。工具结果和对话历史通常是最大的两个黑洞。", "Everything competes for space. Tool results and history are the two biggest black holes."),
    parts: [
      { name: c("System Prompt", "System prompt"), value: 8, color: "blue" },
      { name: c("工具定义", "Tool schemas"), value: 12, color: "accent" },
      { name: c("CLAUDE.md", "CLAUDE.md"), value: 4, color: "lime" },
      { name: c("对话历史", "Conversation"), value: 120, color: "amber" },
      { name: c("工具结果", "Tool results"), value: 40, color: "coral" },
      { name: c("输出预留", "Output reserve"), value: 16, color: "faint" },
    ],
    unit: "K tokens",
    source: [doc(c("Anthropic · Effective context engineering", "Anthropic · Effective context engineering"), "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents")],
    note: c("示意估算，按一次中等长度会话拆解。", "Illustrative split for a mid-length session."),
  },

  /* ---------- 3. compaction ---------- */
  "compaction-effect": {
    type: "line",
    group: c("循环与上下文", "Loops & context"),
    title: c("压缩不是失忆，是换一种方式记住", "Compaction is not amnesia — it is memory, re-encoded"),
    sub: c("不压缩会在第 8 圈撞墙；每次压缩回到约 40K，用少量精度换继续工作的能力。", "Without compaction you hit the wall around loop 8. Each compaction returns to ~40K: a little fidelity for the ability to continue."),
    xs: c(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]),
    series: [
      { name: c("不压缩", "No compaction"), values: [20, 36, 50, 63, 75, 86, 96, 105, 112, 118], color: "coral" },
      { name: c("压缩续跑", "Compaction"), values: [20, 36, 50, 62, 40, 54, 67, 79, 55, 68], color: "accent", area: true },
    ],
    unit: "K",
    max: 130,
    source: [doc(c("Anthropic · Context engineering", "Anthropic · Context engineering"), "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents")],
    note: c("拐点即压缩发生的时刻，压缩后会丢一部分原始细节。", "The knees mark compactions; some raw detail is lost each time."),
  },

  /* ---------- 4. tools by family ---------- */
  "tools-by-family": {
    type: "hbar",
    group: c("工具与权限", "Tools & permissions"),
    title: c("59 个内置工具，按家族分组", "59 built-in tools, grouped by family"),
    sub: c("看起来很多，其实都能还原成四个动作：读、写、跑、连。", "It looks like a lot. Everything reduces to four moves: read, write, run, connect."),
    rows: [
      { label: c("文件与编辑", "Files & editing"), value: 9 },
      { label: c("搜索与导航", "Search & navigation"), value: 4 },
      { label: c("执行与自动化", "Execution"), value: 3, tone: "coral" },
      { label: c("网络与抓取", "Network & fetch"), value: 3 },
      { label: c("任务与计划", "Tasks & planning"), value: 5, tone: "blue" },
      { label: c("多 Agent", "Sub-agents"), value: 5 },
      { label: c("扩展与 MCP", "Extensions & MCP"), value: 3, tone: "coral" },
      { label: c("会话与配置", "Session & config"), value: 7 },
      { label: c("其他内置", "Other built-ins"), value: 20, tone: "blue" },
    ],
    unit: " tools",
    source: [doc(c("Claude Code docs · Tools", "Claude Code docs · Tools"), "https://code.claude.com/docs")],
    note: c("按公开拆解归类，边界有重叠，数字用于建立量级。", "Grouped from public teardowns; boundaries overlap, numbers are for scale."),
  },

  /* ---------- 5. permission funnel ---------- */
  "permission-funnel": {
    type: "waterfall",
    group: c("工具与权限", "Tools & permissions"),
    title: c("1000 次工具调用，只有 12 次真的来问你", "1,000 tool calls, only 12 reach you"),
    sub: c("权限不是一道门，是一条漏斗：能自动放行的绝不来烦你，剩下的才逐层加价审查。", "Permission is not a gate but a funnel: anything safely automatic never bothers you, and only the rest get progressively more expensive review."),
    steps: [
      { name: c("全部工具调用", "All calls"), value: 1000, color: "blue" },
      { name: c("只读自动放行", "Read-only auto"), value: -620, color: "accent" },
      { name: c("命令白名单", "Command allowlist"), value: -180, color: "accent" },
      { name: c("64 token 粗筛", "64-token pass"), value: -150, color: "lime" },
      { name: c("深度判定", "Deep check"), value: -38, color: "amber" },
    ],
    unit: " calls",
    max: 1000,
    source: [doc(c("Claude Code docs · Permissions", "Claude Code docs · Permissions"), "https://code.claude.com/docs")],
    note: c("示意：比例按真实使用体感估算，不是官方统计。", "Illustrative ratios from hands-on use, not official statistics."),
  },

  /* ---------- 6. risk matrix ---------- */
  "risk-matrix": {
    type: "matrix",
    group: c("工具与权限", "Tools & permissions"),
    title: c("按「可逆性 × 影响范围」给操作分班", "Sort operations by reversibility × blast radius"),
    sub: c("自动放行的边界不取决于命令多吓人，而取决于出事之后能不能撤销。", "The line for auto-approval is not how scary a command looks, but whether it can be undone."),
    xLabel: c("影响范围 →", "Blast radius →"),
    yLabel: c("可逆性 ↑", "Reversibility ↑"),
    quadrants: [
      { name: c("读：直接放行", "Read: just go"), text: c("读文件、grep、看 git 状态——错了也没损失。", "Reading files, grep, git status — a mistake costs nothing."), color: "accent" },
      { name: c("改：可逆但要看", "Edit: check first"), text: c("编辑文件、改配置——有 diff，能回滚。", "Editing files and configs — there is a diff, and a rollback."), color: "lime" },
      { name: c("删：一定要问", "Delete: always ask"), text: c("rm、reset --hard、删分支——不可逆的第一步。", "rm, reset --hard, deleting branches — the first irreversible step."), color: "coral" },
      { name: c("发：人工把关", "Ship: human gate"), text: c("部署、发布、对外发言——影响面出去了就收不回。", "Deploy, publish, speak in public — once it is out, it is out."), color: "amber" },
    ],
    source: [doc(c("Anthropic · Claude Code security", "Anthropic · Claude Code security"), "https://www.anthropic.com/engineering/claude-code-sandboxing")],
  },

  /* ---------- 7. security gauge ---------- */
  "hook-coverage": {
    type: "gauge",
    group: c("工具与权限", "Tools & permissions"),
    title: c("确定性护栏的覆盖率", "Coverage of deterministic guardrails"),
    sub: c("提示词是概率性的，hook 是确定性的。把「必须发生」的事写进代码，覆盖率才可度量。", "Prompts are probabilistic, hooks are deterministic. What must happen belongs in code — then coverage becomes measurable."),
    value: 92,
    max: 100,
    display: "92%",
    name: c("PreToolUse 钩子拦截危险命令", "PreToolUse hooks blocking risky commands"),
    desc: c("示意：把 rm -rf、force push、写 .env 列为硬拦截之后，剩下的 8% 主要靠权限模式兜底。", "Illustrative: with rm -rf, force push and .env writes hard-blocked, the remaining 8% relies on permission modes."),
    color: "accent",
    source: [doc(c("Claude Code docs · Hooks", "Claude Code docs · Hooks"), "https://code.claude.com/docs")],
  },

  /* ---------- 8. cache economics ---------- */
  "cache-economics": {
    type: "bar",
    group: c("缓存与成本", "Cache & cost"),
    title: c("100 轮请求，四种策略的账单", "The bill for 100 loops, four strategies"),
    sub: c("缓存写入贵、读取便宜。前缀越稳定，省钱越彻底；把动态内容塞进前缀，等于把优惠券撕了。", "Cache writes cost more, reads cost far less. The stabler the prefix, the bigger the saving — stuffing dynamic content into it tears up the coupon."),
    categories: c(["无缓存", "只缓存 System", "缓存 System+Tools", "+ 压缩"], ["No cache", "System only", "System + tools", "+ compaction"]),
    series: [{ name: c("成本（美元）", "Cost (USD)"), values: [12, 4.8, 2.9, 2.1], color: "coral" }],
    unit: " USD",
    max: 14,
    source: [doc(c("Anthropic · Prompt caching", "Anthropic · Prompt caching"), "https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching")],
    note: c("示意：按 20K 前缀、100 轮、公开价目量级估算。", "Illustrative: 20K prefix, 100 loops, public price order."),
  },

  /* ---------- 9. token composition ---------- */
  "token-composition": {
    type: "stack",
    group: c("缓存与成本", "Cache & cost"),
    title: c("一次请求里，真正属于「你这句话」的部分有多小", "How little of a request is actually your sentence"),
    sub: c("你打了一行字，模型收到的是五层内容。这就是为什么「少说两句」省不了钱，「少带点东西」才行。", "You type one line; the model receives five layers. That is why talking less saves nothing — carrying less does."),
    parts: [
      { name: c("System Prompt", "System prompt"), value: 6, color: "blue" },
      { name: c("工具定义", "Tool schemas"), value: 11, color: "accent" },
      { name: c("CLAUDE.md", "CLAUDE.md"), value: 3, color: "lime" },
      { name: c("历史对话", "History"), value: 28, color: "amber" },
      { name: c("你这句话", "Your line"), value: 2, color: "coral" },
    ],
    unit: "K tokens",
    source: [doc(c("Anthropic · Writing tools for agents", "Anthropic · Writing tools for agents"), "https://www.anthropic.com/engineering/writing-tools-for-agents")],
    note: c("示意：工具定义常被低估，十几个 MCP server 就能吃掉上万 token。", "Illustrative: tool schemas are underrated — a dozen MCP servers can eat tens of thousands of tokens."),
  },

  /* ---------- 10. startup waterfall ---------- */
  "startup-waterfall": {
    type: "waterfall",
    group: c("缓存与成本", "Cache & cost"),
    title: c("从敲下 claude 到能打字，时间花在哪", "From typing claude to typing back: where the time goes"),
    sub: c("MCP server 是启动阶段最贵的一笔；每多接一个外部系统，冷启动就多等一截。", "MCP servers are the expensive part of startup: every extra external system adds a wait."),
    steps: [
      { name: c("读配置", "Config"), value: 40, color: "accent" },
      { name: c("认证", "Auth"), value: 90, color: "blue" },
      { name: c("加载 MCP", "Load MCP"), value: 260, color: "coral" },
      { name: c("注册工具", "Register tools"), value: 70, color: "lime" },
      { name: c("首屏渲染", "First render"), value: 120, color: "amber" },
    ],
    unit: " ms",
    max: 620,
    source: [doc(c("Claude Code docs · MCP", "Claude Code docs · MCP"), "https://code.claude.com/docs")],
    note: c("示意：本地实测的量级，具体取决于 MCP server 数量与网络。", "Illustrative order from local runs; depends on MCP count and network."),
  },

  /* ---------- 11. stream latency ---------- */
  "stream-latency": {
    type: "line",
    group: c("缓存与成本", "Cache & cost"),
    title: c("同样的总耗时，流式让等待「看起来」短一半", "Same total time, streaming halves the perceived wait"),
    sub: c("人感知的是首字延迟，不是完成时间。这也是终端 UI 必须做流式的原因。", "Humans feel the first token, not the completion. That is why a terminal UI must stream."),
    xs: c(["0s", "1s", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s", "10s"], ["0s", "1s", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s", "10s"]),
    series: [
      { name: c("非流式：先等到 6 秒", "Buffered: waits 6s"), values: [0, 0, 0, 0, 0, 0, 100, 100, 100, 100, 100], color: "coral" },
      { name: c("流式：首字 0.8 秒", "Streaming: first token 0.8s"), values: [0, 14, 30, 46, 60, 72, 82, 90, 95, 99, 100], color: "accent", area: true },
    ],
    unit: "%",
    max: 100,
    source: [doc(c("Anthropic · Streaming docs", "Anthropic · Streaming docs"), "https://docs.anthropic.com/en/docs/build-with-claude/streaming")],
    note: c("示意图：纵轴是「用户已看到内容的比例」。", "Illustrative: y-axis is the share of output the user has seen."),
  },

  /* ---------- 12. grep vs rag ---------- */
  "grep-vs-rag": {
    type: "compare",
    group: c("检索与记忆", "Retrieval & memory"),
    title: c("为什么 Claude Code 用 grep，而不是向量数据库", "Why Claude Code greps instead of embedding"),
    sub: c("不是技术保守，是算过账：代码库天天变，索引天天过期，而模型已经会搜索了。", "Not conservatism — arithmetic: code changes daily, indexes rot daily, and the model already knows how to search."),
    left: {
      name: c("传统 RAG：先建索引", "Classic RAG: index first"),
      points: [
        c("索引和源码可能不同步，改了代码忘了重建", "Index and source drift apart; edit code, forget to rebuild"),
        c("切片边界经常切断一个函数的上下文", "Chunk boundaries slice a function in half"),
        c("需要额外基础设施：向量库、嵌入模型、同步管道", "Extra infrastructure: vector store, embedding model, sync pipeline"),
        c("召回率是概率性的，错了很难解释", "Recall is probabilistic and hard to explain when wrong"),
      ],
    },
    right: {
      name: c("Agentic grep：现场导航", "Agentic grep: navigate live"),
      points: [
        c("永远从最新代码出发，没有过期问题", "Always reads the current tree — nothing to expire"),
        c("模型自己决定搜什么、看多少、下一步去哪", "The model picks what to search, how much to read, where to go next"),
        c("零额外基础设施，一个 ripgrep 就够", "Zero extra infrastructure; ripgrep is enough"),
        c("过程可解释：每一步都有命令和结果", "Explainable: every step has a command and a result"),
      ],
    },
    source: [doc(c("Anthropic · Claude Code best practices", "Anthropic · Claude Code best practices"), "https://www.anthropic.com/engineering/claude-code-best-practices")],
  },

  /* ---------- 13. search matrix ---------- */
  "search-matrix": {
    type: "matrix",
    group: c("检索与记忆", "Retrieval & memory"),
    title: c("什么时候该上索引，什么时候 grep 就够", "When to index, when to just grep"),
    sub: c("两个变量：代码库多大，改得多快。大多数团队落在左上角，却买了右下角的方案。", "Two variables: repo size and change rate. Most teams sit top-left while buying the bottom-right answer."),
    xLabel: c("代码库规模 →", "Repo size →"),
    yLabel: c("变更频率 ↑", "Change rate ↑"),
    quadrants: [
      { name: c("小库 + 高频：直接 grep", "Small + fast: just grep"), text: c("别搭基础设施，把工具描述写清楚，让模型自己找。", "Skip the infra. Write better tool descriptions and let the model navigate."), color: "accent" },
      { name: c("大库 + 高频：grep 优先，索引辅助", "Large + fast: grep first, index as aid"), text: c("先用 grep，局部热点再补结构化索引，索引必须能增量更新。", "Grep first; add a structural index for hot zones, with incremental updates."), color: "lime" },
      { name: c("小库 + 低频：grep", "Small + slow: grep"), text: c("索引维护成本比收益高，别折腾。", "Index maintenance costs more than it saves."), color: "blue" },
      { name: c("大库 + 低频：可以上索引", "Large + slow: index is fine"), text: c("变更少，索引不容易过期，RAG 终于算得过账。", "Rare changes mean the index stays fresh — RAG finally pencils out."), color: "amber" },
    ],
    source: [doc(c("Anthropic · Context engineering", "Anthropic · Context engineering"), "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents")],
  },

  /* ---------- 14. memory heat ---------- */
  "memory-heat": {
    type: "heat",
    group: c("检索与记忆", "Retrieval & memory"),
    title: c("四种记忆，在四个阶段该记多少", "Four memory types across four project stages"),
    sub: c("记忆不是仓库。项目初期多记约束，重构期多记教训，交接期多记事实。", "Memory is not a warehouse. Early on, record constraints; during refactors, lessons; at handover, facts."),
    cols: c(["冷启动", "日常开发", "重构期", "交接期"], ["Cold start", "Daily dev", "Refactor", "Handover"]),
    rows: [
      { name: c("用户偏好", "Preferences") },
      { name: c("项目事实", "Project facts") },
      { name: c("反馈教训", "Feedback lessons") },
      { name: c("参考链接", "References") },
    ],
    cells: [
      [3, 2, 1, 1],
      [2, 4, 2, 2],
      [1, 3, 5, 3],
      [2, 2, 4, 5],
    ],
    color: "accent",
    legendText: c("1 = 少记，5 = 重点记。示意图，不是评分标准。", "1 = record lightly, 5 = record heavily. Illustrative, not a scorecard."),
    source: [doc(c("Claude Code docs · Memory", "Claude Code docs · Memory"), "https://code.claude.com/docs")],
  },

  /* ---------- 15. agent isolation ---------- */
  "agent-isolation": {
    type: "hbar",
    group: c("多 Agent", "Multi-agent"),
    title: c("拆子 Agent，省的是主上下文的命", "Splitting agents saves the main context's life"),
    sub: c("子 Agent 的中间过程留在自己的窗口里，主 Agent 只收一份结论。省的不是 token 总量，是主上下文的寿命。", "A sub-agent's mess stays in its own window; the parent receives a conclusion. What you save is not total tokens but the main context's lifespan."),
    rows: [
      { label: c("单 Agent：主上下文峰值", "Single agent: peak context"), value: 96, suffix: "K" },
      { label: c("双 Agent：主上下文峰值", "Two agents: parent peak"), value: 34, suffix: "K", tone: "blue" },
      { label: c("子 Agent A：独立窗口", "Sub-agent A: own window"), value: 42, suffix: "K", tone: "coral" },
      { label: c("子 Agent B：独立窗口", "Sub-agent B: own window"), value: 38, suffix: "K", tone: "coral" },
    ],
    max: 100,
    unit: "K",
    source: [doc(c("Anthropic · Multi-agent research", "Anthropic · Multi-agent research"), "https://www.anthropic.com/engineering/building-effective-agents")],
    note: c("示意：同一任务在单 Agent 与父子 Agent 两种结构下的峰值占用。", "Illustrative: peak usage for the same task, flat vs parent/child."),
  },

  /* ---------- 16. eval gate ---------- */
  "eval-gate": {
    type: "hbar",
    group: c("方法与成长", "Method & growth"),
    title: c("上线前的六道闸门，通过率长这样", "Six gates before shipping, and how they usually score"),
    sub: c("编译通过不等于任务完成。越靠后的闸门越接近「真的有用」，也越容易被跳过。", "Compiling is not finishing. The later the gate, the closer to real usefulness — and the easier to skip."),
    rows: [
      { label: c("能编译", "Compiles"), value: 98 },
      { label: c("单测通过", "Unit tests"), value: 94 },
      { label: c("类型检查", "Type checks"), value: 96, tone: "blue" },
      { label: c("Lint 干净", "Lint clean"), value: 92 },
      { label: c("安全扫描", "Security scan"), value: 88, tone: "coral" },
      { label: c("人工评审", "Human review"), value: 71, tone: "coral" },
    ],
    max: 100,
    unit: "%",
    source: [doc(c("Anthropic · Agent evaluation", "Anthropic · Agent evaluation"), "https://www.anthropic.com/engineering/building-effective-agents")],
    note: c("社区经验值：不同团队差异很大，重点看「闸门顺序」而不是具体数字。", "Community experience: variance is huge; the ordering matters more than the digits."),
  },

  /* ---------- 17. maturity radar ---------- */
  "maturity-radar": {
    type: "radar",
    group: c("方法与成长", "Method & growth"),
    title: c("Agent 工程师的六项能力，现在 vs 12 周后", "Six skills for agent engineers, now vs twelve weeks later"),
    sub: c("不是考试分数，是自评模板：先诚实打一次分，再决定这周读哪一章。", "Not exam scores but a self-review: score honestly once, then pick this week's chapter."),
    axes: [
      { name: c("上下文工程", "Context") },
      { name: c("工具设计", "Tools") },
      { name: c("权限安全", "Safety") },
      { name: c("成本控制", "Cost") },
      { name: c("评估", "Evals") },
      { name: c("多 Agent", "Multi-agent") },
    ],
    series: [
      { name: c("现在", "Now"), values: [2, 2, 1, 2, 1, 1], color: "coral" },
      { name: c("12 周后", "After 12 weeks"), values: [4, 4, 3.5, 4, 3.5, 3], color: "accent" },
    ],
    max: 5,
    source: [doc(c("Yuxin · better-agent", "Yuxin · better-agent"), "https://yuxinrun.github.io/better-agent/")],
  },

  /* ---------- 18. leak timeline ---------- */
  "leak-timeline": {
    type: "timeline",
    group: c("循环与上下文", "Loops & context"),
    title: c("一份 51 万行代码是怎么走到公众面前的", "How 510,000 lines reached the public"),
    sub: c("技术史上最贵的「少写一行」。", "The most expensive missing line in recent engineering history."),
    items: [
      {
        date: c("2025-02", "Feb 2025"),
        title: c("第一次：发布即带 source map", "Round one: source maps on day one"),
        text: c("Claude Code 刚发布时，包里就出现过 .map 文件。当时没人当回事。", "Early packages shipped .map files. Nobody thought much of it."),
      },
      {
        date: c("2026-03-11", "11 Mar 2026"),
        title: c("伏笔：Bun 的一个已知 issue", "The setup: a known Bun issue"),
        text: c("社区报告 Bun 在生产模式下仍可能服务 source map，issue 至今开放。", "A report that Bun could still serve source maps in production. The issue stayed open."),
      },
      {
        date: c("2026-03-31", "31 Mar 2026"),
        title: c("59.8 MB 的 npm 包", "A 59.8 MB npm package"),
        text: c("v2.1.88 的包体积异常，安全研究员发现完整 TypeScript 源码被一起打包。", "v2.1.88 shipped abnormally large; a researcher found the full TypeScript source inside."),
      },
      {
        date: c("2026-04-01", "1 Apr 2026"),
        title: c("镜像与拆解，几小时内铺开", "Mirrors and teardowns within hours"),
        text: c("约 1,900 个文件、51 万行、59 个工具定义、44 个 feature flags 全部可见。", "~1,900 files, 510K lines, 59 tool definitions and 44 feature flags, all visible."),
      },
      {
        date: c("2026-04-02", "2 Apr 2026"),
        title: c("DMCA 误伤 8,100 个仓库", "DMCA hits 8,100 repos by mistake"),
        text: c("fork 链式效应导致大量无关仓库被下架，后来范围缩回到 1 个仓库与 96 个 fork。", "Fork chains got unrelated repos taken down; the scope was later cut to one repo and 96 forks."),
      },
      {
        date: c("2026-04-03", "3 Apr 2026"),
        title: c("Boris Cherny：「这是人的错误」", "Boris Cherny: “This was human error”"),
        text: c("不怪个人，怪流程：这是工程文化最诚实的一次公开示范。", "Blame the process, not a person: the most honest public demo of engineering culture."),
      },
    ],
    source: [doc(c("花生 · Claude Code 源码解析", "Huasheng · source teardown"), "https://www.huasheng.ai/orange-books/source-code/read/")],
  },
};