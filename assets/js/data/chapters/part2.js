/* ============================================================
   Part II · Core Systems, first half (ch.03–05)
   ============================================================ */

const c = (zh, en) => ({ zh, en });
const src = (label, url, dom) => ({ label, url, dom });

export const PART2 = [
  {
    id: "03-request-journey",
    num: "03",
    part: 2,
    read: 13,
    tags: { zh: ["Agent Loop", "TAOR"], en: ["Agent loop", "TAOR"] },
    title: c("一次请求的旅程：Agent Loop 的心跳", "Anatomy of a request: the agent loop"),
    sub: c("模型只做一件事——决定下一步", "The model does exactly one thing: choose the next step"),
    lead: c(
      "你按下回车。接下来几百毫秒里，Claude Code 完成了一次接力：拼上下文、调模型、解析工具请求、审查、执行、回填，然后——再转一圈。",
      "You press Enter. In the next few hundred milliseconds Claude Code runs a relay: assemble context, call the model, parse tool requests, review, execute, feed back — then spin again."
    ),
    body: {
      zh: `如果整个产品只能保留一段代码，那一定是这个循环。

## 循环长什么样

剥掉所有工程细节，它的骨架简单到可以在白板上画完：

~~~ts
// 伪代码：真实的循环有几百行，但形状就是这样
while (true) {
  const response = await model.create({
    system: systemPrompt,
    tools: toolSchemas,
    messages: history,
  });

  history.push({ role: "assistant", content: response.content });

  if (response.stop_reason !== "tool_use") break; // 模型说：我完事了

  const results = [];
  for (const block of response.content) {
    if (block.type !== "tool_use") continue;
    const verdict = await permissions.check(block);
    if (!verdict.allowed) {
      results.push(toolError(block.id, verdict.reason));
      continue;
    }
    results.push(await tools.run(block));
  }
  history.push({ role: "user", content: results }); // 观察结果回填
}
~~~

就这么点东西。没有 DAG，没有状态机，没有路由表。整个 Claude Code 的能力，都长在这个 while 上。

:::tip 为什么这个「简陋」的循环能赢
因为**下一步做什么，本来就是模型最擅长判断的事**。你在外部用代码编排得越细，越是在替模型做它比你更懂的决策。真正需要代码介入的地方只有三处：组装上下文、审查权限、执行副作用。
:::

## 四个阶段：TAOR

<div class="flow">
  <div class="flow-step"><b>Think</b><p>模型读完上下文，产出文本（思考）或 tool_use（行动请求）。</p></div>
  <div class="flow-step"><b>Act</b><p>权限层放行后，工具真正执行。这是世界唯一被改变的时刻。</p></div>
  <div class="flow-step"><b>Observe</b><p>工具输出被结构化回填，成功和失败都算观察。</p></div>
  <div class="flow-step"><b>Repeat</b><p>带着新信息回到 Think。直到模型不再请求工具。</p></div>
</div>

## 停止条件：谁说了算

| 停止方式 | 触发者 | 说明 |
| --- | --- | --- |
| 自然结束 | 模型 | \`stop_reason\` 不是 tool_use，最常见的退出 |
| 达到 token 上限 | 模型 API | 输出被截断，通常需要续写 |
| 用户中断 | 人 | Ctrl+C，必须能干净地取消正在跑的工具 |
| 预算耗尽 | 代码 | 成本 / 时间 / 圈数上限，兜底用 |
| 不可恢复错误 | 代码 | 网络、鉴权、磁盘满，重试无意义时直接退出 |

注意一个设计取向：**圈数上限是兜底，不是主策略**。很多教程教人写 \`for (let i = 0; i < 5; i++)\`，这会让模型在第 6 步被迫中断，留下半成品。Claude Code 更相信模型的完成判断，代码只负责防止无限循环烧钱。

:::warn 别把「保险丝」当「油门」
max_iterations 是保险丝，不是油门。把它设得太小，你会得到一个「总是差一步」的 Agent；设得太大，你会得到一个「半夜烧掉 $200」的 Agent。正确做法是给它配一个成本预算，而不是一个固定圈数。
:::

## 为什么工具大多串行

直觉上，并行工具调用更快。但文件编辑类工具天然有依赖：先读再改，改完再跑测试。并行执行会制造「读到旧版本」的竞态。

Claude Code 的策略是：**只读工具可以并发，写入工具串行**。这个区分在工具定义里就要标出来（readOnlyHint），让调度器知道哪些能一起跑。

## 错误不是异常，是输入

新手最常见的写法是：工具失败 → 抛异常 → 循环终止。

Claude Code 反过来：工具失败 → 包装成 \`tool_result\` 且 \`is_error: true\` → 回填给模型 → 模型自己决定重试、换路径还是放弃。

这一招的效果非常夸张。模型看到一个结构化的错误信息，往往能自己修好：「文件不存在」→ 它去 Glob 找真实路径；「测试失败，第 42 行期望 3 得到 4」→ 它去改实现。

~~~ts
// 差：把错误变成循环的终点
if (!fs.existsSync(path)) throw new Error("ENOENT");

// 好：把错误变成下一圈的输入
if (!fs.existsSync(path)) {
  return { is_error: true, content: "File not found: " + path + ". Use Glob to locate it first." };
}
~~~

:::aha 一个小细节
错误信息里带上「下一步建议」（Use Glob to locate it first），比单纯报错的自愈率高得多。这不是玄学：你是在用提示词教模型怎么修，而它正好擅长执行明确指令。
:::

## 成本随圈数线性上涨

这是循环架构最大的代价。每一圈都要重发全部上下文，所以成本 ≈ 圈数 × 上下文大小。缓存能把这个系数打到很低，但打不到零。

:::chart loop-tokens
:::

第 12 章会专门算这笔账。这里先记住结论：**优化 Agent 成本，第一优先级永远是减少圈数，第二是提高缓存命中，第三才是换更便宜的模型**。

## 最小可跑实现

如果你想今晚就写出一个能用的循环，记住这 60 行的形状：

~~~ts
const tools = [readFile, writeFile, runBash, grep];
let messages = [{ role: "user", content: task }];

for (let turn = 0; turn < 40; turn++) {
  const res = await client.messages.create({ model, system, tools, messages, max_tokens: 4096 });
  messages.push({ role: "assistant", content: res.content });
  const uses = res.content.filter((b) => b.type === "tool_use");
  if (!uses.length) break;

  const results = [];
  for (const use of uses) {
    try {
      const out = await run(use.name, use.input);
      results.push({ type: "tool_result", tool_use_id: use.id, content: out });
    } catch (err) {
      results.push({ type: "tool_result", tool_use_id: use.id, is_error: true, content: String(err) });
    }
  }
  messages.push({ role: "user", content: results });
}
~~~

就这。剩下的 50 万行，都是在这 60 行上面加「让它更可靠」的工程。

## 本章带走

- [ ] 主循环保持朴素：一次模型调用 + 工具执行 + 结果回填
- [ ] 停止条件交给模型，代码只保留成本/圈数兜底
- [ ] 工具错误包装成 \`is_error\` 回填，而不是抛出终止
- [ ] 只读工具并发，写入工具串行
- [ ] 优化成本先看圈数，再看缓存，最后才看模型价格`,
      en: `If the whole product could keep only one piece of code, it would be this loop.

## The shape of the loop

Strip every engineering detail and the skeleton fits on a whiteboard:

~~~ts
// Pseudocode: the real loop is hundreds of lines, but the shape is this
while (true) {
  const response = await model.create({
    system: systemPrompt,
    tools: toolSchemas,
    messages: history,
  });

  history.push({ role: "assistant", content: response.content });

  if (response.stop_reason !== "tool_use") break; // the model says: done

  const results = [];
  for (const block of response.content) {
    if (block.type !== "tool_use") continue;
    const verdict = await permissions.check(block);
    if (!verdict.allowed) {
      results.push(toolError(block.id, verdict.reason));
      continue;
    }
    results.push(await tools.run(block));
  }
  history.push({ role: "user", content: results }); // observation goes back
}
~~~

That is it. No DAG, no state machine, no router table. The entire capability of Claude Code grows on this while.

:::tip Why the "crude" loop wins
Because **deciding the next step is exactly what the model is best at**. The more you choreograph outside, the more you guess decisions the model understands better than you. Code only needs to intervene in three places: assembling context, checking permissions, executing side effects.
:::

## Four stages: TAOR

<div class="flow">
  <div class="flow-step"><b>Think</b><p>The model reads context and emits text (thought) or tool_use (a request to act).</p></div>
  <div class="flow-step"><b>Act</b><p>After permission, the tool runs. This is the only moment the world changes.</p></div>
  <div class="flow-step"><b>Observe</b><p>Output is structured back into context. Success and failure both count.</p></div>
  <div class="flow-step"><b>Repeat</b><p>Back to Think with new information, until no tool is requested.</p></div>
</div>

## Who decides to stop

| Stop condition | Decided by | Notes |
| --- | --- | --- |
| Natural finish | Model | \`stop_reason\` is not tool_use — the common exit |
| Token limit | Model API | Output truncated; usually needs continuation |
| User interrupt | Human | Ctrl+C must cleanly cancel a running tool |
| Budget exhausted | Code | Cost / time / turn caps as a backstop |
| Unrecoverable error | Code | Network, auth, disk full — retrying is pointless |

Note the bias: **turn caps are a fuse, not the throttle**. Many tutorials teach \`for (let i = 0; i < 5; i++)\`, which forces the model to stop mid-task at step six. Claude Code trusts the model's completion judgement; code only prevents infinite spending.

:::warn A fuse is not an accelerator
max_iterations is a fuse, not a throttle. Too small and you get an agent that is always one step short; too large and you get one that burns $200 overnight. Pair it with a cost budget instead of a fixed count.
:::

## Why most tools run serially

Parallel tool calls look faster. But file edits depend on order: read, then write, then test. Running them in parallel creates "read the stale version" races.

Claude Code's rule: **read-only tools may run concurrently, write tools are serialised**. That distinction is declared in the tool definition (readOnlyHint) so the scheduler knows what can fly together.

## Errors are input, not exceptions

The beginner pattern: tool fails → throw → loop dies.

Claude Code inverts it: tool fails → wrap as \`tool_result\` with \`is_error: true\` → return to the model → the model decides to retry, reroute, or give up.

The effect is dramatic. Given a structured error, the model often repairs itself: "file not found" → it globs for the real path; "test failed, expected 3 got 4 at line 42" → it edits the implementation.

~~~ts
// Bad: turn an error into the end of the loop
if (!fs.existsSync(path)) throw new Error("ENOENT");

// Good: turn an error into the next input
if (!fs.existsSync(path)) {
  return { is_error: true, content: "File not found: " + path + ". Use Glob to locate it first." };
}
~~~

:::aha A small detail
Including "Use Glob to locate it first" raises the self-repair rate far more than a bare error. Not magic: you are teaching the model how to fix it, and clear instructions are what it executes best.
:::

## Cost grows with every spin

This is the price of the architecture. Each loop re-sends the entire context, so cost ≈ turns × context size. Caching slashes the coefficient, never to zero.

:::chart loop-tokens
:::

Chapter 12 does the arithmetic. For now keep the ranking: **cut turns first, raise cache hits second, pick a cheaper model third**.

## The minimal working loop

If you want a usable loop tonight, the shape is about sixty lines:

~~~ts
const tools = [readFile, writeFile, runBash, grep];
let messages = [{ role: "user", content: task }];

for (let turn = 0; turn < 40; turn++) {
  const res = await client.messages.create({ model, system, tools, messages, max_tokens: 4096 });
  messages.push({ role: "assistant", content: res.content });
  const uses = res.content.filter((b) => b.type === "tool_use");
  if (!uses.length) break;

  const results = [];
  for (const use of uses) {
    try {
      const out = await run(use.name, use.input);
      results.push({ type: "tool_result", tool_use_id: use.id, content: out });
    } catch (err) {
      results.push({ type: "tool_result", tool_use_id: use.id, is_error: true, content: String(err) });
    }
  }
  messages.push({ role: "user", content: results });
}
~~~

That is all. The other 510,000 lines are engineering that makes these sixty reliable.

## Takeaways

- [ ] Keep the loop boring: one model call, tool execution, result feedback
- [ ] Let the model stop; keep cost and turn caps only as backstops
- [ ] Wrap tool failures as \`is_error\` results instead of throwing
- [ ] Concurrent reads, serial writes
- [ ] Cost work order: turns, cache, model price`,
    },
    sources: [
      src(c("Anthropic 工程博客 · 构建高效 Agent", "Anthropic Engineering · Building effective agents"), "https://www.anthropic.com/engineering/building-effective-agents", "anthropic.com/engineering"),
      src(c("Anthropic 文档 · Tool use", "Anthropic docs · Tool use"), "https://docs.anthropic.com/en/docs/build-with-claude/tool-use", "docs.anthropic.com"),
      src(c("Claude Code 官方文档", "Claude Code documentation"), "https://code.claude.com/docs", "code.claude.com"),
    ],
  },

  {
    id: "04-system-prompt",
    num: "04",
    part: 2,
    read: 12,
    tags: { zh: ["System Prompt", "缓存"], en: ["System prompt", "Caching"] },
    title: c("System Prompt 工程：一份会呼吸的说明书", "System prompt engineering: a living manual"),
    sub: c("它不是一段文字，是一套按条件拼装的模块", "Not a block of text — a set of modules assembled per condition"),
    lead: c(
      "大多数人写 system prompt 像写简历：一次写完，再也别动。Claude Code 把它当代码库维护：分层、条件拼装、还要为缓存让路。",
      "Most people write a system prompt like a CV: once, then never again. Claude Code maintains it like a codebase — layered, conditionally assembled, and designed to protect the cache."
    ),
    body: {
      zh: `如果 Agent 是一个人，system prompt 就是他的岗位说明书、公司制度和工位便签的合集。

## 它到底装了些什么

把 Claude Code 的 system prompt 拆开，大致能分成七块：

| 区块 | 内容 | 变化频率 |
| --- | --- | --- |
| 身份 | 你是谁、为谁工作、说话风格 | 几乎不变 |
| 环境 | 操作系统、工作目录、git 状态、平台 | 每个会话变 |
| 工具规范 | 每个工具何时用、何时别用、参数怎么填 | 跟版本变 |
| 行为准则 | 先读后写、不要臆测、保持简洁 | 几乎不变 |
| 安全边界 | 哪些操作必须确认、哪些内容不能输出 | 偶尔变 |
| 任务风格 | 何时该用 Todo、何时该拆子 Agent | 跟功能开关变 |
| 输出格式 | Markdown、代码块、文件引用写法 | 几乎不变 |

注意一个规律：**越稳定的内容越靠前，越多变的内容越靠后**。这不是排版美学，是缓存策略。

:::tip 缓存的第一性原理
Prompt caching 按前缀匹配。前缀里任何一处变化，其后所有 token 都要重新计算。所以 system prompt 的结构本质上是：把「所有人共享的」放前面，把「这个会话独有的」放后面。
:::

## 动态分界线

Claude Code 的 prompt 里有一条隐形的分界线：

- **分界线之前**：身份、准则、工具规范——所有用户、所有会话都一样，缓存命中率最高。
- **分界线之后**：当前目录、git 分支、今天的日期、项目特有的 CLAUDE.md——每个会话都不同，注定无法共享。

这条线如果画错，代价非常具体：把「当前时间」写进开头，你就让整个缓存前缀每小时失效一次。

:::warn 一个真实的反模式
有人在 system prompt 第一行写「现在是 2026 年 10 月 31 日 14:32:07」。听起来很贴心，实际上让缓存每秒都可能失效。正确做法是把时间放在最后，或者干脆写进第一条 user 消息。
:::

## 为什么要分层拼装，而不是一份大文本

三个原因：

1. **按需加载**：不是每个会话都需要「如何写 commit message」这一节。用不到就不拼进去，省 token。
2. **可测试**：每一块可以单独跑评估，改动的影响范围可控。
3. **可缓存**：稳定块在前，动态块在后，前缀命中率最大化。

这三点合起来，就是「会呼吸」的意思：prompt 不是静态文档，而是运行时根据上下文拼出来的对象。

## 语气也是设计出来的

Claude Code 说话像一个靠谱的同事：短句、先结论、少客套、不谄媚。

这不是文风偏好，是产品决策。原因有三：

- 客套话占 token，而且每一圈都要重发。
- 过度道歉会让用户误以为它不确定，从而反复确认，拖慢任务。
- 「我先看看代码」比「好的，我非常乐意帮您解决这个问题」更能建立信任——因为它展示了行动，而不是态度。

:::aha 一个可以立刻用的规则
在 system prompt 里写清楚「不要说什么」，比写「要说什么」更有效。例如：不要以「好问题」开头，不要在结尾问「还需要我做什么吗」，不要用感叹号。负面清单比正面形容词更容易执行。
:::

## 为什么不用向量检索来「找 prompt」

有人会想：prompt 这么长，为什么不做成 RAG，按需检索相关段落？

因为 prompt 是**骨架**，不是知识库。知识可以检索，骨架必须完整。你少给它一段「先读后写」的准则，它不是变笨，是变形——会在没读文件的情况下直接改代码。

真正的知识（项目约定、历史决策）应该放在 CLAUDE.md 和记忆系统里，按需加载。prompt 负责「怎么做事」，记忆负责「这个项目的事」。

## 结构化写作的三个模板

可以直接抄走的句式：

1. **触发条件式**：「当 X 发生时，先做 Y，再考虑 Z。」比「你应该注意 Y」可执行得多。
2. **反例式**：「不要用 A 做 B；如果需要 B，用 C。」模型对「不要」的遵循度，取决于你给没给它替代方案。
3. **输出契约式**：「最终回答包含三部分：结论、改动文件清单、验证方式。」格式一旦明确，模型的输出稳定性会显著提升。

## 本章带走

- [ ] 把 system prompt 当成「分层拼装的对象」，而不是一段文本
- [ ] 稳定内容在前，动态内容在后，保护缓存前缀
- [ ] 负面清单（不要做什么）比正面形容词更有效
- [ ] 知识放 CLAUDE.md，骨架放 prompt，两者别混
- [ ] 每一块 prompt 都应该能单独被评估`,
      en: `If an agent were a new hire, the system prompt would be the job description, the employee handbook and the sticky notes on the desk, combined.

## What is actually inside

Take Claude Code's system prompt apart and roughly seven blocks fall out:

| Block | Content | How often it changes |
| --- | --- | --- |
| Identity | Who you are, who you work for, tone | Almost never |
| Environment | OS, working directory, git state, platform | Every session |
| Tool rules | When to use each tool, when not to, how to fill args | Every release |
| Conduct | Read before write, no guessing, be concise | Almost never |
| Safety | What needs confirmation, what must never be printed | Occasionally |
| Task style | When to use todos, when to spawn sub-agents | With feature flags |
| Output | Markdown, code blocks, file reference style | Almost never |

Notice the pattern: **the stabler the content, the earlier it sits; the more volatile, the later**. That is not typography, it is cache strategy.

:::tip First principles of caching
Prompt caching matches prefixes. One changed byte invalidates every token after it. The structure of a system prompt is therefore: shared material first, session-specific material last.
:::

## The dynamic boundary

There is an invisible line in the prompt:

- **Before the line**: identity, conduct, tool rules — identical for every user and session, maximum cache hits.
- **After the line**: current directory, git branch, today's date, project CLAUDE.md — different every session, unshareable by definition.

Draw that line wrong and the cost is concrete: put "current time" at the top and you invalidate the entire prefix every hour.

:::warn A real anti-pattern
Someone puts "It is now 2026-10-31 14:32:07" on line one. Charming, and it makes the cache expire every second. Put time at the end, or in the first user message instead.
:::

## Why assemble in layers

Three reasons:

1. **Load on demand**: not every session needs the "how to write a commit message" section. If unused, do not include it.
2. **Testability**: each block can be evaluated alone, so the blast radius of an edit is bounded.
3. **Cacheability**: stable blocks first, volatile blocks last, maximum prefix hits.

Together these are what "living" means: the prompt is not a document but an object built at runtime from the current context.

## Tone is a design decision

Claude Code talks like a reliable colleague: short sentences, conclusion first, no flattery, no ceremony.

That is not taste, it is product logic:

- Ceremony costs tokens, re-sent every loop.
- Over-apologising reads as uncertainty and triggers redundant confirmation.
- "Let me look at the code first" builds more trust than "I would be delighted to help" — because it shows action, not attitude.

:::aha A rule you can use today
Saying what not to do beats saying what to do. Examples: don't open with "Great question", don't end with "anything else?", don't use exclamation marks. Negative lists are easier to follow than positive adjectives.
:::

## Why not retrieve prompts with a vector store

Why not RAG the prompt itself, pulling in relevant sections on demand?

Because the prompt is a **skeleton**, not a knowledge base. Knowledge can be retrieved; a skeleton must be whole. Drop the "read before write" rule and the agent does not get dumber — it deforms, editing files it never read.

Real knowledge (project conventions, past decisions) belongs in CLAUDE.md and the memory system, loaded on demand. The prompt governs how to work; memory governs what this project is.

## Three reusable sentence patterns

1. **Trigger style**: "When X happens, do Y first, then consider Z." Far more executable than "be careful with Y."
2. **Counter-example style**: "Do not use A for B; if you need B, use C." Compliance with "don't" depends on whether you offer an alternative.
3. **Output contract style**: "Final answer has three parts: conclusion, files changed, how it was verified." Explicit formats stabilise output dramatically.

## Takeaways

- [ ] Treat the system prompt as an assembled object, not a text blob
- [ ] Stable first, volatile last — protect the cache prefix
- [ ] Negative lists beat positive adjectives
- [ ] Knowledge in CLAUDE.md, skeleton in the prompt; never mix
- [ ] Every block should be independently evaluable`,
    },
    sources: [
      src(c("Anthropic 工程博客 · 上下文工程", "Anthropic Engineering · Context engineering"), "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents", "anthropic.com/engineering"),
      src(c("Prompt Caching 文档", "Prompt caching docs"), "https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching", "docs.anthropic.com"),
      src(c("Claude Code 官方文档", "Claude Code documentation"), "https://code.claude.com/docs", "code.claude.com"),
    ],
  },

  {
    id: "05-tools",
    num: "05",
    part: 2,
    read: 14,
    tags: { zh: ["工具系统", "Schema"], en: ["Tools", "Schema"] },
    title: c("工具系统：4 个原语，59 个工具", "The tool system: 4 primitives, 59 tools"),
    sub: c("工具是模型唯一的手，手型决定它能干什么", "Tools are the model's only hands — their shape decides what it can do"),
    lead: c(
      "59 个工具听起来像一个大工程。拆开看，它们只是「读、写、跑、连」四个动作的不同包装，加上一层非常讲究的描述工程。",
      "Fifty-nine tools sound like a large surface. Unpacked, they are four moves — read, write, run, connect — in different wrappers, plus a very deliberate layer of description engineering."
    ),
    body: {
      zh: `这一章讲三件事：工具怎么分类、schema 怎么写、错误怎么设计。三件事都做对，工具的可用性会有质变。

## 工具地图

:::chart tools-by-family
:::

四类原语对应四种副作用：

| 原语 | 代表工具 | 副作用 | 权限策略 |
| --- | --- | --- | --- |
| 读 | Read、Grep、Glob | 无 | 自动放行 |
| 写 | Edit、Write、NotebookEdit | 改文件 | 显示 diff，可要求确认 |
| 跑 | Bash、Task | 任意 | 按命令白名单 + 审查 |
| 连 | WebFetch、MCP 工具 | 外部世界 | 按 server 授权 |

:::tip 一个设计检查
如果你发现自己要加第 60 个工具，先问：能不能用现有四个原语组合出来？能组合就不要新增。工具每多一个，schema 就多占一份上下文，模型的选择空间也多一分噪音。
:::

## 好 schema 的五个字段

一个工具定义，真正决定模型用得好不好的，是这五项：

~~~ts
{
  name: "Edit",
  description: "Replaces an exact string in a file. Use when you have read the file and know the exact text to change. Do NOT use for creating new files — use Write instead.",
  input_schema: {
    type: "object",
    properties: {
      file_path: { type: "string", description: "Absolute path to the file" },
      old_string: { type: "string", description: "Exact text to replace, must be unique in the file" },
      new_string: { type: "string", description: "Replacement text" }
    },
    required: ["file_path", "old_string", "new_string"]
  },
  annotations: { readOnlyHint: false, destructiveHint: false }
}
~~~

逐项看：

1. **name**：动词开头，短，别用缩写。\`Edit\` 比 \`StrReplace\` 好读，\`Grep\` 比 \`SearchTextInFiles\` 好记。
2. **description**：写「何时用」+「何时别用」+「用错会怎样」。这是模型的 UI，不是给人看的注释。
3. **input_schema**：字段少而必要。每个字段都要有 description，尤其是路径类字段要说清是绝对路径还是相对路径。
4. **annotations**：只读、破坏性、并发安全。调度器和权限层靠它做决策。
5. **required**：宁可让模型多填一个字段，也不要让它猜默认值。

## 描述是给模型的 UI

同一个工具，两种描述，效果差一个数量级：

~~~text
# 差
搜索文件内容。

# 好
在文件内容中搜索正则表达式。当你不知道文件在哪、但知道要找什么时使用。
优先用它定位，再用 Read 读取完整文件。不要用它读取整个文件——
用 Read。正则语法遵循 ripgrep，默认忽略 .gitignore 中的文件。
~~~

第二种描述做了四件事：说明用途、给使用顺序、给反例、交代实现细节（ripgrep 语法）。模型读完就知道什么时候该伸手。

:::aha 一个反直觉的发现
工具描述里最有价值的一句话，往往是「不要用它做什么」。模型很擅长在几个相似工具之间选错：Grep 和 Read 都会返回文件内容，Glob 和 Bash find 都能找文件。明确划界，比详细解释功能更能减少误用。
:::

## 错误信息是第二次机会

工具失败时，你写什么，决定了模型能不能自愈。

| 差的错误 | 好的错误 |
| --- | --- |
| \`Error: ENOENT\` | \`File not found: src/auth.ts. Use Glob("**/auth*.ts") to locate it.\` |
| \`Invalid input\` | \`old_string not found in file. Read the file again; it may have changed since your last read.\` |
| \`Command failed\` | \`Tests failed (exit 1). 3 failures in session.test.ts. Run "npm test -- session" to see details.\` |

好的错误信息包含三部分：**发生了什么、为什么、下一步怎么做**。这三样加起来，就是一条给模型的工单。

## 结果大小要控制

工具返回的内容会直接进入上下文，而且每一圈都会重发。所以「返回多少」是一个成本决策：

- 读文件默认限制行数，超长文件分页；
- 搜索结果限制条数，按相关性排序；
- Bash 输出截断长日志，保留头尾；
- 大输出写入临时文件，只把路径回填给模型。

:::warn 一个常见的成本黑洞
一个不加限制的 \`cat\` 就能把 20 万 token 塞进上下文，让整个会话提前进入压缩。工具设计里，返回值的默认上限比功能本身更重要。
:::

## 本章带走

- [ ] 新增工具前先问：能否用四个原语组合出来
- [ ] description 必须写清「何时用、何时别用、用错怎么办」
- [ ] 每个字段都配 description，路径类字段说明绝对/相对
- [ ] 用 annotations 标注只读与破坏性，供调度器和权限层使用
- [ ] 错误信息带「下一步建议」，返回值设默认上限`,
      en: `Three things here: how tools are classified, how schemas are written, and how errors are designed. Get all three right and usability changes by an order of magnitude.

## The tool map

:::chart tools-by-family
:::

Four primitives map to four kinds of side effects:

| Primitive | Examples | Side effect | Permission policy |
| --- | --- | --- | --- |
| Read | Read, Grep, Glob | None | Auto-approve |
| Write | Edit, Write, NotebookEdit | File changes | Show diff, may ask |
| Run | Bash, Task | Anything | Command allowlist + review |
| Connect | WebFetch, MCP tools | Outside world | Per-server authorisation |

:::tip A design check
If you are about to add tool number sixty, ask first: can the existing four primitives compose it? If yes, do not add. Every extra tool costs schema context and adds noise to the model's choice space.
:::

## Five fields that decide everything

~~~ts
{
  name: "Edit",
  description: "Replaces an exact string in a file. Use when you have read the file and know the exact text to change. Do NOT use for creating new files — use Write instead.",
  input_schema: {
    type: "object",
    properties: {
      file_path: { type: "string", description: "Absolute path to the file" },
      old_string: { type: "string", description: "Exact text to replace, must be unique in the file" },
      new_string: { type: "string", description: "Replacement text" }
    },
    required: ["file_path", "old_string", "new_string"]
  },
  annotations: { readOnlyHint: false, destructiveHint: false }
}
~~~

Field by field:

1. **name**: start with a verb, keep it short, avoid abbreviations. \`Edit\` reads better than \`StrReplace\`.
2. **description**: when to use, when not to, what happens if misused. This is the model's UI, not a code comment.
3. **input_schema**: few essential fields, each with a description — especially whether paths are absolute.
4. **annotations**: read-only, destructive, concurrency-safe. The scheduler and permission layer read these.
5. **required**: better to make the model fill one more field than guess a default.

## Descriptions are the model's UI

Same tool, two descriptions, an order of magnitude apart:

~~~text
# Bad
Search file contents.

# Good
Search file contents with a regular expression. Use when you know WHAT to find
but not WHERE. Locate first, then Read the file. Do not use it to read whole
files — use Read. Regex follows ripgrep syntax; .gitignore'd files are skipped.
~~~

The second does four jobs: purpose, order of use, counter-example, implementation detail. After reading it, the model knows when to reach.

:::aha A counter-intuitive finding
The most valuable sentence in a tool description is often "do not use this for X". Models confuse similar tools constantly: Grep and Read both return content; Glob and bash find both locate files. Clear boundaries cut misuse more than detailed feature lists.
:::

## Error messages are a second chance

What you write on failure decides whether the model can self-repair.

| Weak error | Strong error |
| --- | --- |
| \`Error: ENOENT\` | \`File not found: src/auth.ts. Use Glob("**/auth*.ts") to locate it.\` |
| \`Invalid input\` | \`old_string not found in file. Read it again; it may have changed since your last read.\` |
| \`Command failed\` | \`Tests failed (exit 1). 3 failures in session.test.ts. Run "npm test -- session" for details.\` |

A strong error has three parts: what happened, why, what to do next. Together they form a work order for the model.

## Cap the size of results

Tool output enters the context and is re-sent every loop. "How much to return" is a cost decision:

- Reads are line-limited and paginated;
- Searches are capped and ranked;
- Bash logs are truncated, head and tail kept;
- Huge outputs go to a temp file, only the path returns.

:::warn A common cost sink
One unbounded \`cat\` can push 200K tokens into context and force compaction early. In tool design, the default output cap matters more than the feature list.
:::

## Takeaways

- [ ] Before adding a tool, ask whether the four primitives compose it
- [ ] Descriptions must cover when to use, when not to, and what breaks
- [ ] Describe every field; state absolute vs relative paths
- [ ] Use annotations for read-only and destructive hints
- [ ] Errors include the next step; results have default caps`,
    },
    sources: [
      src(c("Anthropic 工程博客 · 给 Agent 写工具", "Anthropic Engineering · Writing tools for agents"), "https://www.anthropic.com/engineering/writing-tools-for-agents", "anthropic.com/engineering"),
      src(c("Anthropic 文档 · Tool use", "Anthropic docs · Tool use"), "https://docs.anthropic.com/en/docs/build-with-claude/tool-use", "docs.anthropic.com"),
      src(c("Model Context Protocol 规范", "Model Context Protocol specification"), "https://modelcontextprotocol.io", "modelcontextprotocol.io"),
    ],
  },
];