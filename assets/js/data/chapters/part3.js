/* ============================================================
   Part II · Core Systems, second half (ch.06–08)
   ============================================================ */

const c = (zh, en) => ({ zh, en });
const src = (label, url, dom) => ({ label, url, dom });

export const PART3 = [
  {
    id: "06-permissions",
    num: "06",
    part: 2,
    read: 13,
    tags: { zh: ["权限", "安全"], en: ["Permissions", "Safety"] },
    title: c("权限系统：信任是设计出来的", "The permission system: trust, by design"),
    sub: c("能自动放行的绝不来烦你，剩下的才逐层加价", "Anything safely automatic never bothers you; the rest goes up the price ladder"),
    lead: c(
      "权限设计的难点从来不是「拦不拦」，而是「什么时候别拦」。拦得太多，用户三分钟就关掉 Agent；拦得太少，一次 rm -rf 就够上新闻。",
      "The hard part of permissions is never whether to block, but when not to. Block too much and users disable the agent in three minutes; block too little and one rm -rf makes the news."
    ),
    body: {
      zh: `这一章讲的是 Claude Code 最被低估的系统。大多数人只看到「弹窗问我」，其实背后是一条四层漏斗。

## 权限不是开关，是漏斗

:::chart permission-funnel
:::

1000 次工具调用里，真正需要你点头的可能只有十几次。漏斗的每一层都在用不同的成本换取确定性：

| 层级 | 机制 | 成本 | 拦截什么 |
| --- | --- | --- | --- |
| 1 | 只读自动放行 | 0 | 读文件、搜索、看 git 状态 |
| 2 | 命令白名单 | 0 | \`npm test\`、\`git status\` 等已知安全命令 |
| 3 | 64 token 粗筛 | 极低 | 明显危险的命令（删除、推送、改权限） |
| 4 | 4,096 token 细判 | 低 | 语义上有风险、但形式合法的操作 |
| 5 | 人工确认 | 高 | 剩下的真正需要人来决定的 |

:::tip 为什么是 64 token 起步
因为绝大多数工具调用「一眼就能看出安全」。用 64 token 做一次极便宜的粗筛，把 80% 的调用直接放行，剩下的才值得花 4,096 token 去仔细想。这是典型的级联分类器思路：便宜的先上，贵的兜底。
:::

## 五种权限模式

| 模式 | 行为 | 适合谁 |
| --- | --- | --- |
| default | 每个有副作用的操作都问 | 第一次用、陌生仓库 |
| acceptEdits | 自动接受文件编辑，命令仍问 | 日常开发主力模式 |
| plan | 只读，不执行任何修改 | 先看懂再动手、代码评审 |
| bypassPermissions | 全部放行 | 沙箱容器、CI 环境 |
| 自定义规则 | 按工具/命令/路径细粒度授权 | 团队规范、长期项目 |

模式不是越安全越好，而是要和**环境**匹配。在一次性容器里用 default，你会被弹窗烦死；在生产的跳板机上用 bypass，你会被事故烦死。

:::warn 一个真实的事故模式
最危险的不是 bypassPermissions，而是「在重要仓库里习惯性点允许」。人会疲劳，弹窗会变成肌肉记忆。所以好的权限系统不靠人保持警惕，靠规则把常见路径变安全。
:::

## 两阶段分类器

第 3、4 层的核心是一个两阶段判断：

~~~text
阶段一（64 token）
  输入：工具名 + 命令的前若干字符
  输出：safe / suspicious / dangerous
  目标：高召回，宁可误报

阶段二（4,096 token）
  输入：完整命令 + 当前目录 + 最近的对话意图
  输出：allow / ask / deny + 理由
  目标：降低误报，给出人能看懂的解释
~~~

为什么不让一个模型一次判断完？因为成本。每一次工具调用都过一次大模型审查，等于把 Agent 的账单翻倍。级联设计让 80% 的调用花不到一分钱。

## Hooks：把「必须发生」写进代码

提示词是概率性的，hook 是确定性的。Claude Code 提供多个钩子点，最常用的是：

| Hook | 时机 | 典型用途 |
| --- | --- | --- |
| PreToolUse | 工具执行前 | 硬拦截危险命令、校验参数 |
| PostToolUse | 工具执行后 | 自动格式化、跑 lint、记录审计日志 |
| UserPromptSubmit | 用户提交后 | 注入上下文、敏感词检查 |
| Stop | 会话结束时 | 汇总成本、清理临时文件 |

一个真实的 PreToolUse 配置长这样：

~~~json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "node .claude/guard.mjs"
      }]
    }]
  }
}
~~~

\`guard.mjs\` 读到工具参数，如果匹配危险模式就返回 deny 和理由。模型会收到这个理由，并尝试换一种做法——而不是整个任务失败。

:::aha 确定性护栏的覆盖率
提示词是概率性的，hook 是确定性的。把「必须发生」的事写进代码，覆盖率才可度量。
:::

:::chart hook-coverage
:::

## 按「可逆性 × 影响范围」分班

:::chart risk-matrix
:::

这张图比任何规则列表都好用。判断一个操作要不要问人，只问两句：

1. 出事之后能不能撤销？
2. 影响了多少人/系统？

两个都安全 → 自动放行；一个不安全 → 问；两个都不安全 → 必须人工，而且要在执行前把影响面说清楚。

## 沙箱：最后一道物理防线

权限系统是逻辑防线，沙箱是物理防线。Claude Code 的沙箱思路很朴素：把网络和文件系统的访问限制在一个明确的边界内，越界就失败。

- 网络：默认只允许白名单域名，防止把代码或密钥外传；
- 文件：只挂载工作目录，\`~/.ssh\` 这类敏感路径不可见；
- 进程：限制可以调用的系统能力。

逻辑防线会被绕过（提示注入、模型误判），物理防线不会。两层都要有。

## 本章带走

- [ ] 权限设计成漏斗，而不是门：便宜的先筛，贵的兜底
- [ ] 用「可逆性 × 影响范围」决定是否询问，而不是凭命令吓不吓人
- [ ] 把必须发生的事写进 hook，别写进 prompt
- [ ] 给每个 deny 附上理由和替代方案，让模型能换个做法
- [ ] 逻辑防线 + 物理沙箱，缺一不可`,
      en: `This is the most underrated system in Claude Code. Most people only see "it asked me", missing the four-stage funnel behind it.

## Permission is a funnel, not a gate

:::chart permission-funnel
:::

Of 1,000 tool calls, maybe a dozen need your nod. Each stage trades a different cost for certainty:

| Stage | Mechanism | Cost | What it catches |
| --- | --- | --- | --- |
| 1 | Read-only auto-approve | 0 | Reading files, search, git status |
| 2 | Command allowlist | 0 | Known-safe commands like \`npm test\` |
| 3 | 64-token pass | Tiny | Obviously dangerous commands |
| 4 | 4,096-token check | Small | Legal-looking but semantically risky |
| 5 | Human confirmation | High | What genuinely needs a person |

:::tip Why start at 64 tokens
Because most tool calls are obviously safe at a glance. A 64-token pass releases 80% of them for almost nothing, leaving only the remainder for the 4,096-token think. Classic cascaded classifier: cheap first, expensive as backstop.
:::

## Five permission modes

| Mode | Behaviour | Who it suits |
| --- | --- | --- |
| default | Ask for every side effect | First runs, unfamiliar repos |
| acceptEdits | Auto-accept edits, still ask for commands | The daily driver |
| plan | Read-only, no changes at all | Understand first, or review |
| bypassPermissions | Everything allowed | Sandbox containers, CI |
| Custom rules | Fine-grained per tool/command/path | Team conventions |

Safer is not always better; matching the **environment** is better. default inside a disposable container is death by popup. bypass on a production jump host is death by incident.

:::warn A real failure mode
The most dangerous setting is not bypassPermissions; it is "habitually clicking allow in an important repo". Humans fatigue and popups become muscle memory. A good system does not rely on vigilance — it makes the common path safe by rule.
:::

## The two-stage classifier

~~~text
Stage one (64 tokens)
  Input: tool name + the head of the command
  Output: safe / suspicious / dangerous
  Goal: high recall, accept false positives

Stage two (4,096 tokens)
  Input: full command + cwd + recent intent
  Output: allow / ask / deny + reason
  Goal: fewer false positives, human-readable explanation
~~~

Why not one big judgement? Cost. Sending every tool call through a large review doubles the agent's bill. Cascading means 80% of calls cost nearly nothing.

## Hooks: put "must happen" into code

Prompts are probabilistic; hooks are deterministic. Claude Code exposes several hook points:

| Hook | When | Typical use |
| --- | --- | --- |
| PreToolUse | Before a tool runs | Hard-block risky commands, validate args |
| PostToolUse | After a tool runs | Format, lint, audit log |
| UserPromptSubmit | After the user submits | Inject context, check sensitive input |
| Stop | Session ends | Cost summary, cleanup |

A real PreToolUse config:

~~~json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "node .claude/guard.mjs"
      }]
    }]
  }
}
~~~

\`guard.mjs\` reads the tool input and returns deny plus a reason on a dangerous pattern. The model receives the reason and tries another approach — the whole task does not fail.

:::aha Coverage of deterministic guardrails
:::chart hook-coverage
:::

## Sorting by reversibility × blast radius

:::chart risk-matrix
:::

This beats any rule list. Ask two questions of any operation:

1. Can it be undone?
2. How many people or systems does it touch?

Both safe → auto. One unsafe → ask. Both unsafe → human gate, with the blast radius explained before execution.

## Sandboxing: the physical line

Permissions are a logical defence; a sandbox is a physical one. The idea is simple: confine network and filesystem access to an explicit boundary, and fail on crossing.

- Network: allowlisted domains by default, preventing exfiltration;
- Files: mount only the workspace; \`~/.ssh\` is invisible;
- Process: limit the system calls available.

Logical defences can be bypassed (prompt injection, misjudgement). Physical ones cannot. You need both.

## Takeaways

- [ ] Build a funnel, not a gate: cheap filters first, expensive backstop
- [ ] Decide by reversibility × blast radius, not by how scary a command looks
- [ ] Put must-happen behaviour in hooks, not prompts
- [ ] Every deny carries a reason and an alternative
- [ ] Logical defence plus a physical sandbox`,
    },
    sources: [
      src(c("Claude Code 文档 · 权限与 Hooks", "Claude Code docs · Permissions & hooks"), "https://code.claude.com/docs", "code.claude.com"),
      src(c("Anthropic 工程博客 · Claude Code 沙箱", "Anthropic Engineering · Sandboxing Claude Code"), "https://www.anthropic.com/engineering/claude-code-sandboxing", "anthropic.com/engineering"),
      src(c("Anthropic 工程博客 · 构建高效 Agent", "Anthropic Engineering · Building effective agents"), "https://www.anthropic.com/engineering/building-effective-agents", "anthropic.com/engineering"),
    ],
  },

  {
    id: "07-context",
    num: "07",
    part: 2,
    read: 14,
    tags: { zh: ["上下文", "压缩"], en: ["Context", "Compaction"] },
    title: c("上下文管理：长对话的生存术", "Context management: surviving a long conversation"),
    sub: c("上下文是预算，不是仓库", "Context is a budget, not a warehouse"),
    lead: c(
      "所有 Agent 最终都会撞上同一堵墙：窗口只有那么大。Claude Code 的解法不是「更大的窗口」，而是「更聪明的预算」。",
      "Every agent eventually hits the same wall: the window is finite. Claude Code's answer is not a bigger window but a smarter budget."
    ),
    body: {
      zh: `如果说工具系统是 Agent 的手，上下文管理就是它的短期记忆和工作台。工作台乱的人，再聪明也干不好活。

## 上下文是预算，不是仓库

新手的心态是「多给点信息总没坏处」。事实相反：token 越多，模型精确回忆的能力越差——这个现象叫 **context rot（上下文腐化）**。

:::chart context-budget
:::

所以正确的问法不是「还能塞多少」，而是「这一轮真正需要什么」。

## 四类内容，四种策略

| 内容 | 变化频率 | 策略 |
| --- | --- | --- |
| System prompt / 工具定义 | 低 | 静态、可缓存、尽量精简 |
| CLAUDE.md / 项目约定 | 低 | 分层加载，按目录触发 |
| 对话历史 | 高 | 摘要 + 压缩 + 选择性丢弃 |
| 工具结果 | 极高 | 截断、分页、落盘只回路径 |

:::tip 一条可以立刻用的规则
工具结果进上下文之前，先问一句：模型需要的是全文，还是只需要结论和位置？大多数情况下是后者。把 5,000 行日志变成「42 个测试，3 个失败，失败在 session.test.ts:88」，省下的不是 token，是模型的注意力。
:::

## 压缩：怎么压，压掉什么

压缩不是简单截断，而是让模型把历史重写成结构化摘要：

1. 保留：用户的原始目标、已做的关键决定、未解决的问题、改动过的文件清单。
2. 丢弃：中间的工具原始输出、重复的探索过程、已经验证失败的尝试。
3. 格式：结构化（目标 / 进展 / 待办 / 风险），而不是自由文本。

:::chart compaction-effect
:::

压缩的代价是精度：某段原始输出里的细节可能就此消失。所以好的实现会在压缩前把重要产物落盘（文件、测试结果、决策记录），让模型需要时能重新读取。

:::warn 压缩前必须落盘
如果一段信息只存在于上下文里，压缩就等于删除。Claude Code 的做法是：重要产物写到文件里，上下文里只留路径和摘要。这样压缩后还能捞回来。
:::

## 上下文腐化：为什么第 40 轮开始变笨

三个原因：

1. **注意力稀释**：关键指令被埋在几万 token 里，模型注意力被摊薄。
2. **矛盾累积**：早期说过的话和现在的状态冲突，模型不知道该信哪个。
3. **噪声淹没**：大量无关的工具输出挤占了「思考空间」。

对策不是「再提醒一次」，而是从结构上解决：把长期有效的约束放进 CLAUDE.md，把当前任务的状态放进 Todo 列表，把已完成的历史压缩掉。

## 子 Agent：用隔离换寿命

当一个子任务会产生大量中间输出（比如「调研这个库的 API」），把它丢给子 Agent：

- 子 Agent 有自己的上下文窗口，中间过程不回流；
- 父 Agent 只收到一份结论摘要；
- 主上下文省下的不是 token 总量，而是「还能继续工作多少轮」。

第 10 章会详细讲多 Agent 的拆法。这里先记住原则：**拆的是上下文，不是任务**。

## 一个预算分配的实操模板

以 200K 窗口为例，一个健康的分配大概是：

| 用途 | 预算 | 说明 |
| --- | --- | --- |
| 静态前缀（prompt + 工具） | 20K | 尽量稳定，吃满缓存 |
| 项目记忆 | 5K | CLAUDE.md 精简版 |
| 当前任务上下文 | 30K | 相关文件、错误日志 |
| 对话与工具结果 | 100K | 主要工作区 |
| 压缩与输出预留 | 45K | 留给压缩后的续跑和新输出 |

超过 70% 占用时开始警觉，超过 85% 主动压缩，别等撞墙。

## 本章带走

- [ ] 把上下文当预算表管理，每一块都有配额
- [ ] 工具结果先摘要再回填，默认设上限
- [ ] 压缩前把重要产物落盘，上下文只留路径
- [ ] 用 Todo 列表承载「当前状态」，避免靠历史回忆
- [ ] 大任务拆子 Agent，省的是主上下文的寿命`,
      en: `If tools are the agent's hands, context management is its working memory and workbench. A cluttered bench defeats a smart worker.

## Context is a budget, not a warehouse

The beginner instinct is "more information cannot hurt". The opposite is true: more tokens mean worse exact recall — the phenomenon called **context rot**.

:::chart context-budget
:::

So the right question is not "how much more can I fit" but "what does this turn actually need".

## Four kinds of content, four strategies

| Content | Volatility | Strategy |
| --- | --- | --- |
| System prompt / tool schemas | Low | Static, cacheable, as lean as possible |
| CLAUDE.md / conventions | Low | Layered, triggered by directory |
| Conversation history | High | Summarise, compact, selectively drop |
| Tool results | Extreme | Truncate, paginate, spill to disk |

:::tip A rule you can apply today
Before a tool result enters context, ask: does the model need the whole thing, or just the conclusion and the location? Usually the latter. Turning 5,000 log lines into "42 tests, 3 failed at session.test.ts:88" saves attention, not just tokens.
:::

## Compaction: what to keep, what to burn

Compaction is not truncation. It asks the model to rewrite history into a structured summary:

1. Keep: the original goal, key decisions, open questions, files touched.
2. Drop: raw tool output, repeated exploration, attempts already proven wrong.
3. Format: structured (goal / progress / todos / risks), not free prose.

:::chart compaction-effect
:::

The price is fidelity: details inside a raw output may vanish. Good implementations spill important artefacts to disk (files, test results, decision logs) before compacting, so the model can re-read them later.

:::warn Spill before you compact
If information exists only in context, compaction deletes it. Claude Code writes important artefacts to files and keeps only paths and summaries in context, so they survive the squeeze.
:::

## Context rot: why things get dumber at turn 40

Three causes:

1. **Attention dilution**: key instructions buried under tens of thousands of tokens.
2. **Contradiction buildup**: early statements conflict with the current state.
3. **Noise flooding**: unrelated tool output crowds out thinking space.

The fix is structural, not a reminder: durable constraints in CLAUDE.md, current state in a todo list, completed history compacted away.

## Sub-agents: trade isolation for lifespan

When a subtask produces heavy intermediate output (say, surveying a library's API), delegate it:

- The sub-agent has its own window; the mess does not flow back;
- The parent receives one summary;
- What you save is not total tokens but **how many more turns the main context can survive**.

Chapter 10 covers splitting strategy. For now keep the principle: **what you split is context, not tasks**.

## A practical budget template

For a 200K window, a healthy split looks like:

| Purpose | Budget | Notes |
| --- | --- | --- |
| Static prefix (prompt + tools) | 20K | Keep stable, max cache |
| Project memory | 5K | Lean CLAUDE.md |
| Current task context | 30K | Files, error logs |
| Conversation & tool results | 100K | The main workspace |
| Compaction & output reserve | 45K | Room to continue and to answer |

Get nervous past 70%, compact deliberately past 85%. Do not wait for the wall.

## Takeaways

- [ ] Manage context as a budget with quotas per block
- [ ] Summarise tool results before they land; default caps
- [ ] Spill artefacts to disk before compacting
- [ ] Carry current state in todos, not in remembered history
- [ ] Delegate big subtasks to protect the main context's lifespan`,
    },
    sources: [
      src(c("Anthropic 工程博客 · 上下文工程", "Anthropic Engineering · Context engineering"), "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents", "anthropic.com/engineering"),
      src(c("Anthropic 工程博客 · 构建高效 Agent", "Anthropic Engineering · Building effective agents"), "https://www.anthropic.com/engineering/building-effective-agents", "anthropic.com/engineering"),
      src(c("Claude Code 官方文档", "Claude Code documentation"), "https://code.claude.com/docs", "code.claude.com"),
    ],
  },

  {
    id: "08-memory",
    num: "08",
    part: 2,
    read: 11,
    tags: { zh: ["记忆", "CLAUDE.md"], en: ["Memory", "CLAUDE.md"] },
    title: c("记忆系统：只记好的，不记代码", "The memory system: record judgement, not code"),
    sub: c("记忆不是仓库，是入职培训材料", "Memory is not a warehouse; it is onboarding material"),
    lead: c(
      "大多数 Agent 的记忆方案是「把所有对话存进向量库」。Claude Code 的选择相反：少记、精记、分层记，而且坚决不记代码。",
      "Most agent memory designs store every conversation in a vector database. Claude Code goes the other way: record less, record precisely, layer it — and never record code."
    ),
    body: {
      zh: `先问一个问题：你换了一家公司，最想带走的是什么？

不是上个月的会议记录，也不是代码——代码在新公司用不上。你最想带走的是**判断力**：这个团队怎么做事、哪些坑不能踩、上次那个决策为什么那么定。

Claude Code 的记忆系统，就是按这个逻辑设计的。

## 四种记忆，各有各的用途

| 类型 | 记什么 | 谁写 | 寿命 |
| --- | --- | --- | --- |
| 用户偏好 | 沟通风格、技术栈偏好、禁忌 | 用户显式要求 | 长期 |
| 项目事实 | 架构约定、目录含义、构建命令 | Agent 观察 + 用户确认 | 中期 |
| 反馈教训 | 做错了什么、下次怎么避免 | Agent 复盘 | 长期 |
| 参考链接 | 文档、issue、外部资源 | 双方 | 短期 |

:::chart memory-heat
:::

注意「反馈教训」这一栏。它是最容易被忽略、却最值钱的一类：**同一个错误不要犯两次**，靠的就是它。

## 分层加载：CLAUDE.md 的目录魔法

Claude Code 的 CLAUDE.md 不是一个文件，而是一套按目录触发的层级：

| 层级 | 位置 | 典型内容 |
| --- | --- | --- |
| 企业级 | 组织统一配置 | 合规红线、统一构建流程 |
| 项目级 | 仓库根目录 | 架构说明、命令、约定 |
| 子目录级 | 各模块目录下 | 这个模块特有的规则 |
| 用户级 | 个人全局配置 | 个人偏好、常用工具 |

读取时机很关键：**只在涉及对应目录时才加载**。你在改 \`src/auth/\`，就不需要读 \`infra/terraform/\` 的约定。

这带来两个好处：token 省了，噪音也少了。

:::tip 写 CLAUDE.md 的三条规矩
1. 写「怎么做」，不写「是什么」——代码已经说明了是什么。
2. 每条不超过一行，超过一行就说明你还没想清楚。
3. 定期删。失效的约定比没有约定更糟，因为它会误导模型。
:::

## 为什么不记代码

这是最反直觉的一条：Claude Code 几乎不把代码片段写进长期记忆。

理由很硬：

1. **代码天天变**，今天的函数签名明天就改了，记住等于记错。
2. **代码可以现读**，需要的时候 Read 一次就是最新版本，为什么要记旧版本？
3. **代码占空间**，一段 50 行的代码等于 800 token，记十个就是 8,000 token 的常驻开销。

所以要记的是：**为什么这样写、哪里不能动、上次踩过什么坑**。这些是读代码读不出来的。

:::aha 一个类比
记忆应该像老员工的便签，不是像 Git 仓库。便签上写的是「这个接口别在周二发布，财务在跑批」，不是整个接口的实现。
:::

## 什么时候写记忆

记忆的写入时机比内容更重要。四个信号：

- 用户明确说「记住」「以后都这样」；
- Agent 犯了一个错，用户纠正了；
- 发现了一条代码里看不出来的约定；
- 一个决策反复出现（说明它是模式，不是偶然）。

反过来，这些情况不该写：

- 一次性的任务细节；
- 已经写在代码或文档里的东西；
- 不确定是否长期有效的猜测。

## 读取顺序与冲突处理

加载时的优先级大致是：**用户显式指令 > 项目约定 > 组织规范 > Agent 自己的推断**。

冲突时不要「合并」，要显式暴露：如果项目约定和用户要求打架，Agent 应该指出来，而不是悄悄选一个。这一点在多 Agent 场景下尤其重要——两个子 Agent 拿到互相矛盾的记忆，会产生完全不同的行为。

## 本章带走

- [ ] 记忆分四类，每类有自己的写入者和寿命
- [ ] CLAUDE.md 按目录分层，只在相关时加载
- [ ] 记「为什么」和「不能碰什么」，不记代码
- [ ] 只在四个信号出现时写记忆，别把一切存下来
- [ ] 记忆冲突要显式暴露，不要静默合并`,
      en: `Start with a question: when you change companies, what do you most want to take with you?

Not last month's meeting notes, and certainly not the code — the code is useless elsewhere. What you want is **judgement**: how this team works, which traps to avoid, why that decision was made.

Claude Code's memory system is built on exactly that logic.

## Four kinds of memory

| Type | What | Written by | Lifespan |
| --- | --- | --- | --- |
| Preferences | Tone, stack choices, no-gos | Explicit user request | Long |
| Project facts | Architecture, directory meaning, build commands | Observation + confirmation | Medium |
| Feedback lessons | What went wrong, how to avoid it | Agent retro | Long |
| References | Docs, issues, external links | Both | Short |

:::chart memory-heat
:::

Note the "feedback lessons" row. It is the most neglected and the most valuable: **never make the same mistake twice** depends entirely on it.

## Layered loading: the CLAUDE.md trick

CLAUDE.md is not one file but a hierarchy triggered by directory:

| Level | Location | Typical content |
| --- | --- | --- |
| Enterprise | Org-wide config | Compliance red lines, shared build flow |
| Project | Repo root | Architecture, commands, conventions |
| Subdirectory | Inside modules | Rules specific to that module |
| User | Personal global config | Personal preferences and tools |

Timing matters: **load only when the relevant directory is touched**. Editing \`src/auth/\` does not require the conventions of \`infra/terraform/\`.

Two benefits: fewer tokens and less noise.

:::tip Three rules for CLAUDE.md
1. Write how to work, not what things are — the code already says what.
2. One line per rule. If it needs two, you have not decided yet.
3. Delete regularly. A stale convention is worse than none: it misleads.
:::

## Why code is not recorded

The most counter-intuitive rule: Claude Code almost never stores code snippets in long-term memory.

The reasoning is hard:

1. **Code changes daily.** Today's signature is tomorrow's lie; remembering it is remembering wrong.
2. **Code can be read.** Read once for the current version — why keep an old one?
3. **Code costs space.** Fifty lines is ~800 tokens; ten such memories are 8,000 tokens of permanent overhead.

What gets recorded: **why it is written this way, what must not be touched, which trap was hit last time**. None of that can be read out of the code.

:::aha An analogy
Memory should be a senior colleague's sticky note, not a Git repository. The note says "don't ship this endpoint on Tuesdays, finance runs batches", not the endpoint's implementation.
:::

## When to write memory

Timing matters more than content. Four signals:

- The user explicitly says "remember this" or "always do that";
- The agent made a mistake and was corrected;
- A convention was discovered that code does not reveal;
- A decision keeps recurring — it is a pattern, not an accident.

And these should not be written:

- One-off task details;
- Anything already in code or docs;
- Guesses about whether something will stay true.

## Read order and conflict handling

Rough priority: **explicit user instruction > project conventions > org rules > agent inference**.

On conflict, do not merge silently — surface it. If project conventions fight the user's request, the agent should say so. This matters most in multi-agent setups: two sub-agents with contradictory memories will behave like two different engineers.

## Takeaways

- [ ] Four memory types, each with its own author and lifespan
- [ ] CLAUDE.md is layered by directory, loaded only when relevant
- [ ] Record why and what-not-to-touch, never code
- [ ] Write only on four signals; do not hoard everything
- [ ] Surface memory conflicts explicitly`,
    },
    sources: [
      src(c("Claude Code 文档 · 记忆", "Claude Code docs · Memory"), "https://code.claude.com/docs", "code.claude.com"),
      src(c("Anthropic 工程博客 · 上下文工程", "Anthropic Engineering · Context engineering"), "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents", "anthropic.com/engineering"),
      src(c("鱼心快跑 · Agent 记忆模式（姊妹站）", "Yuxin Rush · Agent memory patterns (sister site)"), "https://yuxinrun.github.io/agent-memory-patterns/", "yuxinrun.github.io"),
    ],
  },
];