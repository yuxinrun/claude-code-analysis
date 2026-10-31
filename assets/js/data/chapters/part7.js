/* ============================================================
   Part V · Method & Career (ch.16–17)
   ============================================================ */

const c = (zh, en) => ({ zh, en });
const src = (label, url, dom) => ({ label, url, dom });

export const PART7 = [
  {
    id: "16-method",
    num: "16",
    part: 5,
    read: 13,
    tags: { zh: ["方法论", "评估"], en: ["Method", "Evaluation"] },
    title: c("Harness Engineering：把别人的决策变成你的能力", "Harness engineering: turn their decisions into your craft"),
    sub: c("六条原则，一个循环，一套评估", "Six principles, one loop, one eval habit"),
    lead: c(
      "前面 15 章讲的是「他们怎么做的」。这一章讲「你怎么用」——把散落的案例，压缩成可以反复执行的方法。",
      "The previous fifteen chapters covered what they did. This one covers how you use it — compressing scattered cases into a repeatable method."
    ),
    body: {
      zh: `## 六条原则

从前面所有案例里，能提炼出六条反复出现的规律：

| 原则 | 一句话 | 出处 |
| --- | --- | --- |
| 模型只做判断 | 决定下一步交给模型，代码负责边界 | 第 3 章 |
| 工具要正交 | 少而正交，描述即 UI | 第 5 章 |
| 上下文是预算 | 分层、按需、可压缩 | 第 7 章 |
| 确定性优先 | 能写进代码的，别写进提示词 | 第 6 章 |
| 检索靠导航 | 渐进调查优于一次性召回 | 第 9 章 |
| 隔离换寿命 | 拆上下文，不是拆任务 | 第 10 章 |

这六条不是教条，是「默认选项」。每次你偏离它们，都应该能说出理由。

## 一个可以每天跑的循环

Harness 的改进不是靠灵感，是靠循环：

~~~text
观察 → 假设 → 最小改动 → 评估 → 记录
  ↑                                  ↓
  └──────────────────────────────────┘
~~~

具体到一个 Agent 项目：

1. **观察**：收集失败样本。不是「感觉它不太行」，而是「这个任务它做了 7 圈，第 5 圈读错了文件」。
2. **假设**：把失败归因到一个具体机制。是工具描述不清？是上下文被污染？是权限打断了流程？
3. **最小改动**：一次只改一个变量。同时改 prompt、工具和权限，你永远不知道哪个生效。
4. **评估**：跑同一组用例，对比通过率和成本。
5. **记录**：写下「改了什么、为什么、结果如何」。这条记录比代码更值钱。

:::tip 失败样本比成功样本值钱
成功只能告诉你「这条路能走」，失败能告诉你「哪里有坑」。一个健康的 Agent 项目，评估集里应该有 30% 以上是失败样本，而且定期更新。
:::

## 评估：怎么知道它真的变好了

新手评估常见的三个坑：

- **只看最终答案**：Agent 可能绕了 20 圈才答对，成本和延迟都不可接受。
- **用例太少**：3 个用例的通过率没有意义，至少 20 个，覆盖不同难度。
- **没有基线**：不知道上一版什么样，就无法判断这次改动是改进还是退步。

一个最小可用的评估集应该包含：

| 维度 | 说明 | 例子 |
| --- | --- | --- |
| 任务类型 | 覆盖读、写、跑、查 | 修 bug、加功能、重构、问答 |
| 难度 | 简单 / 中等 / 困难 | 单文件 / 跨模块 / 跨仓库 |
| 失败模式 | 已知的坑 | 工具选错、上下文溢出、权限卡住 |
| 指标 | 通过率、圈数、成本、延迟 | 每项都要有基线 |

:::chart eval-gate
:::

:::warn 不要用「感觉」当评估
「我觉得它变聪明了」是最危险的信号。模型每次调用都有随机性，你的感觉很可能只是这一次运气好。要么跑用例，要么承认自己在猜。
:::

## 决策记录：给未来的自己留一封信

每个重要的 harness 决策，都值得写一条记录：

~~~markdown
# ADR-007：工具结果默认截断到 200 行

日期：2026-10-12
背景：一个 cat 命令把 18 万 token 塞进上下文，导致会话提前压缩。
决策：所有文件读取类工具默认最多返回 200 行，超出部分提示用 offset 续读。
替代方案：不截断，靠模型自己克制（被否：模型无法感知 token 成本）。
结果：平均上下文峰值下降 22%，压缩频率下降 40%。
风险：某些需要全文的任务会多一次读取。
~~~

这种记录有三个好处：新同事能快速理解现状；改动有据可查；半年后你还能想起「为什么当初这么定」。

## 团队协作：三条规矩

1. **prompt 和工具定义走 code review**：它们和代码一样会影响行为，不能随手改。
2. **评估集共享**：一个人发现的失败样本，应该变成所有人的回归用例。
3. **成本预算公开**：让每个人知道一次任务的成本量级，优化才有共同目标。

## 一个 30 天的实践计划

如果你想把这套方法跑一遍：

- **第 1 周**：选一个你熟悉的重复任务，写 20 条评估用例（含 6 条失败样本）。
- **第 2 周**：搭最小循环 + 4 个工具，跑基线，记录通过率、圈数、成本。
- **第 3 周**：只改一个变量（比如工具描述），再跑，对比。
- **第 4 周**：加权限与 hook，再跑，写一份复盘。

一个月后，你拥有的不是「一个 demo」，而是「一套能持续变好的系统」。

## 本章带走

- [ ] 六条原则当默认选项，偏离要能说出理由
- [ ] 每天跑「观察 → 假设 → 最小改动 → 评估 → 记录」
- [ ] 评估集至少 20 条，30% 是失败样本，必须有基线
- [ ] 重要决策写 ADR，给未来的自己留信
- [ ] prompt 和工具定义走 code review`,
      en: `## Six principles

Six patterns keep recurring across every case above:

| Principle | In one line | From |
| --- | --- | --- |
| The model judges | It picks the next step; code owns the boundaries | ch.3 |
| Tools stay orthogonal | Few, composable, description is UI | ch.5 |
| Context is a budget | Layered, on-demand, compressible | ch.7 |
| Determinism first | What can be code must not be a prompt | ch.6 |
| Retrieval is navigation | Progressive investigation beats one-shot recall | ch.9 |
| Isolation buys lifespan | Split context, not tasks | ch.10 |

These are defaults, not dogma. Every deviation should come with a reason you can say out loud.

## A loop you can run daily

Harness improvement is not inspiration, it is a loop:

~~~text
observe → hypothesise → smallest change → evaluate → record
   ↑                                                ↓
   └────────────────────────────────────────────────┘
~~~

For a real agent project:

1. **Observe**: collect failure cases. Not "it feels weak", but "it took seven turns and read the wrong file on turn five".
2. **Hypothesise**: attribute the failure to a mechanism. Unclear tool description? Polluted context? A permission interrupt?
3. **Smallest change**: one variable at a time. Change prompt, tools and permissions together and you learn nothing.
4. **Evaluate**: rerun the same suite; compare pass rate and cost.
5. **Record**: what changed, why, what happened. This note outlives the code.

:::tip Failures are worth more than successes
Success tells you a path works; failure tells you where the holes are. A healthy agent project keeps at least 30% failure cases in its eval set, refreshed regularly.
:::

## Evaluation: how do you know it improved

Three beginner traps:

- **Only checking the final answer**: the agent may get there in twenty turns, at unacceptable cost and latency.
- **Too few cases**: three cases mean nothing. Twenty minimum, spanning difficulty.
- **No baseline**: without last week's numbers you cannot call this an improvement.

A minimal eval set:

| Dimension | What | Example |
| --- | --- | --- |
| Task type | Read, write, run, query | Fix, feature, refactor, Q&A |
| Difficulty | Easy / medium / hard | One file / cross-module / cross-repo |
| Failure mode | Known traps | Wrong tool, context overflow, blocked by permission |
| Metrics | Pass rate, turns, cost, latency | All with baselines |

:::chart eval-gate
:::

:::warn Never evaluate by feel
"I think it got smarter" is the most dangerous signal in the room. Every model call is stochastic; your feeling is probably this run's luck. Either run the suite or admit you are guessing.
:::

## Decision records: a letter to future you

Every important harness decision deserves a record:

~~~markdown
# ADR-007: truncate tool output at 200 lines

Date: 2026-10-12
Context: one cat dumped 180K tokens into context and forced early compaction.
Decision: file-reading tools return at most 200 lines; suggest offset for more.
Alternatives: rely on model restraint (rejected: it cannot see token cost).
Outcome: peak context down 22%, compaction frequency down 40%.
Risk: whole-file tasks now need one extra read.
~~~

Three benefits: newcomers understand the present quickly, changes have provenance, and six months later you remember why.

## Team rules

1. **Prompts and tool schemas go through code review**: they change behaviour as much as code.
2. **Share the eval set**: one person's failure becomes everyone's regression test.
3. **Publish cost budgets**: everyone should know the order of magnitude per task.

## A 30-day practice plan

- **Week 1**: pick a repetitive task you know well; write 20 eval cases, 6 of them failures.
- **Week 2**: build the minimal loop with four tools, run the baseline, record pass rate, turns, cost.
- **Week 3**: change one variable (a tool description), rerun, compare.
- **Week 4**: add permissions and a hook, rerun, write the retrospective.

A month later you own not a demo but a system that keeps improving.

## Takeaways

- [ ] Treat the six principles as defaults; justify deviations
- [ ] Run observe → hypothesise → smallest change → evaluate → record
- [ ] Twenty-plus cases, 30% failures, always a baseline
- [ ] Write ADRs for important decisions
- [ ] Review prompts and tool schemas like code`,
    },
    sources: [
      src(c("Anthropic 工程博客 · 构建高效 Agent", "Anthropic Engineering · Building effective agents"), "https://www.anthropic.com/engineering/building-effective-agents", "anthropic.com/engineering"),
      src(c("Anthropic 工程博客 · 上下文工程", "Anthropic Engineering · Context engineering"), "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents", "anthropic.com/engineering"),
      src(c("鱼心快跑 · 如何构建更好的 Agent", "Yuxin Rush · Building a better agent"), "https://yuxinrun.github.io/better-agent/", "yuxinrun.github.io"),
      src(c("鱼心快跑 · Agent 评估模式（姊妹站）", "Yuxin Rush · Agent evaluation patterns (sister site)"), "https://yuxinrun.github.io/agent-evaluation-patterns/", "yuxinrun.github.io"),
    ],
  },

  {
    id: "17-roadmap-career",
    num: "17",
    part: 5,
    read: 12,
    tags: { zh: ["职业", "路线图"], en: ["Career", "Roadmap"] },
    title: c("转型路线图与 Agent 工程师的职业地图", "The roadmap and the agent engineer's career map"),
    sub: c("从「会用」到「能设计」，中间是 12 周和一件作品", "From user to designer: twelve weeks and one artefact"),
    lead: c(
      "「Agent 工程师」不是一个新职业，而是后端工程师、前端工程师、数据工程师的一次能力重排。好消息是：你已有的工程能力，大部分都用得上。",
      "Agent engineer is not a new profession so much as a reshuffle of existing ones. The good news: most of your engineering skill transfers."
    ),
    body: {
      zh: `## Agent 工程师到底在做什么

剥掉 buzzword，这份工作每天在做四件事：

1. **设计上下文**：决定模型看到什么、以什么顺序看到。
2. **设计工具**：把业务能力包装成模型能用的动作。
3. **设计边界**：什么能自动做，什么必须问人。
4. **设计评估**：怎么证明它变好了，而不是变贵了。

注意：四件事里没有「训练模型」。绝大多数 Agent 工程师不训练模型，他们设计的是模型周围那套系统——也就是这本书反复讲的 harness。

## 能力地图

:::chart maturity-radar
:::

六个维度，每个都能单独练：

| 维度 | 练法 | 检验标准 |
| --- | --- | --- |
| 上下文工程 | 给自己项目写 CLAUDE.md，观察行为变化 | 能说清每段 token 的用途 |
| 工具设计 | 把 5 个常用脚本包成工具 | 模型一次选对工具的概率 > 80% |
| 权限与安全 | 加一个 PreToolUse 硬拦截 | 危险命令 100% 被拦 |
| 成本控制 | 记录每个任务的 token 与费用 | 能画出成本曲线 |
| 评估 | 建 20 条用例，跑 A/B | 改动前后有可对比的数字 |
| 多 Agent | 拆一个子 Agent 做调研 | 主上下文峰值明显下降 |

## 12 周计划

| 阶段 | 周 | 目标 | 交付物 |
| --- | --- | --- | --- |
| Lv.1 使用者 | 1-2 | 用熟工具，理解每个按键背后发生什么 | 一份被同事复用的 CLAUDE.md |
| Lv.2 组装工 | 3-5 | 用 API 搭一个带工具的最小 Agent | 一个 200 行以内、能自动修 lint 的 Agent |
| Lv.3 工程化 | 6-9 | 长跑不崩、不烧钱、不闯祸 | 成本/延迟报表 + 一次事故复盘 |
| Lv.4 编排者 | 10-12 | 从单 Agent 到系统 | 可复现的评估报告（含失败样本） |

完整的每周任务和交付物，在「转型路线」页面有更细的拆解。

:::tip 一条最重要的建议
不要从「学框架」开始，从「修一个真实的 bug」开始。真实任务会逼你遇到上下文溢出、工具选错、权限卡住这些真问题，而这些问题才是面试和工作的核心。
:::

## 面试会问什么

根据公开的岗位描述和社区讨论，Agent 相关面试通常围绕四类问题：

1. **设计题**：「设计一个能自动修 CI 失败的 Agent。」考的是循环、工具、权限、评估的完整度。
2. **排障题**：「Agent 在第 8 圈开始胡言乱语，怎么查？」考的是上下文腐化、压缩策略、工具结果治理。
3. **成本题**：「1000 次/天的 Agent，怎么把成本降一半？」考的是缓存、圈数、模型路由。
4. **安全题**：「网页里藏了恶意指令怎么办？」考的是纵深防御、权限、沙箱。

注意这四类问题，正好对应本书的四个部分。这不是巧合——它们就是这份工作的日常。

## 作品集：一件能讲 30 分钟的作品

比简历更有说服力的，是一个你能讲 30 分钟的项目：

- **背景**：解决什么问题，为什么原来做得不好。
- **架构**：循环、工具、权限、上下文怎么设计，为什么这么选。
- **数据**：通过率、成本、延迟，改动前后的对比。
- **失败**：踩过哪些坑，怎么修的，哪些还没修好。

最后一条最重要。能坦诚讲失败的人，通常是真的做过。

:::aha 一个反直觉的建议
面试时不要只展示「它能做什么」，要展示「它不能做什么，以及你怎么知道的」。后者证明你有评估能力，而评估能力是 Agent 工程师最稀缺的技能。
:::

## 三个常见误区

1. **只学框架**：框架半年换一代，harness 原则五年不变。
2. **只调 prompt**：prompt 是重要，但它只是六层里的一层。
3. **只看成功案例**：失败样本才是你的护城河。

## 本章带走

- [ ] Agent 工程师的四件事：上下文、工具、边界、评估
- [ ] 六个能力维度，每个都能用具体项目练
- [ ] 12 周计划，每周一个交付物
- [ ] 面试四类题：设计、排障、成本、安全
- [ ] 作品集要能讲失败，不只是成功`,
      en: `## What an agent engineer actually does

Strip the buzzwords and the job is four things, daily:

1. **Design context**: what the model sees, in what order.
2. **Design tools**: wrap business capability into actions the model can take.
3. **Design boundaries**: what is automatic, what must ask a human.
4. **Design evaluation**: prove it got better, not just more expensive.

Notice what is missing: training models. Most agent engineers do not train anything; they design the system around the model — the harness this book keeps discussing.

## The skill map

:::chart maturity-radar
:::

Six dimensions, each trainable on its own:

| Dimension | How to practise | How you know |
| --- | --- | --- |
| Context | Write a CLAUDE.md, watch behaviour change | You can justify every token block |
| Tools | Wrap five scripts as tools | First-try tool choice above 80% |
| Safety | Add one PreToolUse hard block | Risky commands blocked 100% |
| Cost | Log tokens and spend per task | You can draw the cost curve |
| Evaluation | 20 cases, run A/B | Comparable numbers before and after |
| Multi-agent | Delegate one research task | Main context peak drops clearly |

## The twelve weeks

| Stage | Weeks | Goal | Deliverable |
| --- | --- | --- | --- |
| Lv.1 Operator | 1–2 | Fluency, and knowing what happens per keystroke | A CLAUDE.md a teammate reuses |
| Lv.2 Assembler | 3–5 | A minimal tool-using agent on the API | A sub-200-line agent that fixes lint |
| Lv.3 Industrialise | 6–9 | Survive long runs without cost or damage | Cost/latency report plus one incident review |
| Lv.4 Orchestrator | 10–12 | From one agent to a system | A reproducible eval report with failures |

The roadmap page has the week-by-week breakdown.

:::tip The single most useful advice
Do not start with a framework. Start with a real bug. Real tasks force you into context overflow, wrong tool choices and permission walls — which are exactly what interviews and jobs are made of.
:::

## What interviews ask

Based on public job descriptions and community discussion, agent interviews cluster into four kinds:

1. **Design**: "Design an agent that fixes failing CI." Tests loop, tools, permissions, evaluation.
2. **Debugging**: "The agent goes incoherent at turn eight. How do you investigate?" Tests context rot, compaction, tool-result hygiene.
3. **Cost**: "1,000 runs a day — halve the bill." Tests caching, turns, model routing.
4. **Safety**: "A web page hides a malicious instruction." Tests defence in depth, permissions, sandboxing.

Those four map onto the four parts of this book. Not a coincidence — that is the job.

## Portfolio: one artefact you can discuss for 30 minutes

More convincing than a CV is a project you can talk about for half an hour:

- **Context**: what problem, why the old way failed.
- **Architecture**: loop, tools, permissions, context, and why those choices.
- **Numbers**: pass rate, cost, latency, before and after.
- **Failures**: what broke, how you fixed it, what is still broken.

The last one matters most. People who discuss failures honestly have usually done the work.

:::aha A counter-intuitive tip
Do not only show what it can do. Show what it cannot do, and how you know. That demonstrates evaluation skill, the scarcest thing in agent engineering.
:::

## Three common mistakes

1. **Only learning frameworks**: frameworks rotate every six months; harness principles last years.
2. **Only tuning prompts**: prompts matter, but they are one layer of six.
3. **Only showing successes**: failure cases are your moat.

## Takeaways

- [ ] Four jobs: context, tools, boundaries, evaluation
- [ ] Six dimensions, each with a concrete practice project
- [ ] Twelve weeks, one deliverable per week
- [ ] Four interview themes: design, debugging, cost, safety
- [ ] A portfolio that discusses failure, not just success`,
    },
    sources: [
      src(c("鱼心快跑 · 如何构建更好的 Agent", "Yuxin Rush · Building a better agent"), "https://yuxinrun.github.io/better-agent/", "yuxinrun.github.io"),
      src(c("Anthropic 工程博客 · 构建高效 Agent", "Anthropic Engineering · Building effective agents"), "https://www.anthropic.com/engineering/building-effective-agents", "anthropic.com/engineering"),
      src(c("Claude Code 官方文档", "Claude Code documentation"), "https://code.claude.com/docs", "code.claude.com"),
    ],
  },
];