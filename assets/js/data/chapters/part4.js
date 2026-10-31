/* ============================================================
   Part III · Advanced Architecture, first half (ch.09–10)
   ============================================================ */

const c = (zh, en) => ({ zh, en });
const src = (label, url, dom) => ({ label, url, dom });

export const PART4 = [
  {
    id: "09-search",
    num: "09",
    part: 3,
    read: 12,
    tags: { zh: ["检索", "grep"], en: ["Retrieval", "grep"] },
    title: c("搜索：为什么 grep 打败了 RAG", "Search: how grep beat RAG"),
    sub: c("不建索引，让模型像工程师一样现场导航", "No index — let the model navigate like an engineer"),
    lead: c(
      "2024 年的标准答案是「上向量数据库」。Claude Code 的答案是一个 1970 年代的命令行工具。这不是怀旧，是算过账。",
      "The 2024 answer was a vector database. Claude Code's answer is a command-line tool from the 1970s. Not nostalgia — arithmetic."
    ),
    body: {
      zh: `先讲一个你肯定遇到过的场景。

你在一个中型仓库里问 Agent：「登录 token 是在哪里生成的？」

RAG 方案：切片、嵌入、检索 top-k、拼进 prompt。运气好，召回的片段里正好有那个函数；运气不好，召回的是一段注释、一个同名变量、或者三个版本前的实现。

Claude Code 方案：先 \`Grep("generateToken")\`，看命中文件；再 \`Grep("refreshToken")\` 缩小范围；然后 \`Read\` 那个文件的相关行。三步，每步都有明确的依据。

区别在哪？**RAG 是一次性猜测，agentic search 是渐进式调查。**

## 为什么传统 RAG 在代码库上容易翻车

:::chart grep-vs-rag
:::

四个具体问题：

1. **切片切断语义**：一个函数被切成三段，检索到的片段缺上下文。
2. **索引会过期**：代码天天改，索引不可能实时重建，尤其在有几十个分支的团队里。
3. **召回是概率性的**：相似度分数高不等于答案正确，而且错了很难解释。
4. **基础设施成本**：向量库、嵌入模型、同步管道、权限映射——四套东西都要维护。

:::warn 一个常见误区
「代码搜索」和「文档搜索」是两种问题。文档是静态的、语义密集的；代码是动态的、结构密集的、标识符精确的。把文档 RAG 的方案直接搬到代码上，效果通常不如一句 grep。
:::

## Agentic search 的工作方式

核心循环其实很简单：

~~~text
1. 我知道要找什么，但不知道在哪  → Grep(正则)
2. 知道文件名大概长什么样        → Glob(模式)
3. 知道文件了                    → Read(行范围)
4. 需要全局理解                  → 让子 Agent 去读，回一份摘要
~~~

关键不在工具，在**每一步的观察都会改变下一步的计划**。这正是 Agent Loop 擅长的事。

这也是为什么 Claude Code 不需要「一次性召回全部相关代码」——它可以一边看一边找，像人一样。

## 三个工具的分工

| 工具 | 输入 | 什么时候用 | 反例 |
| --- | --- | --- | --- |
| Glob | 文件名模式 | 知道文件名/扩展名，不知道位置 | 用它找内容 |
| Grep | 正则 | 知道要找的字符串/模式 | 用它读整个文件 |
| Read | 路径 + 行范围 | 已经定位到文件 | 用它遍历目录 |

:::tip 让模型自己选工具
不要写「先 Glob 再 Grep 再 Read」这种固定流程。给清楚每个工具的边界，让模型按情况选择。固定流程在简单任务上更快，在真实任务上更脆。
:::

## 什么时候该上索引

:::chart search-matrix
:::

判断标准就两个：**代码库规模**和**变更频率**。

- 小库 + 高频变更：grep，别犹豫。
- 大库 + 高频变更：grep 优先，局部热点补结构化索引（比如符号表、调用图），且索引必须能增量更新。
- 小库 + 低频变更：grep，索引维护成本比收益高。
- 大库 + 低频变更：可以上索引，这时候 RAG 终于算得过账。

注意这里说的是「结构化索引」而不是「向量索引」。代码库上，符号索引（函数名、类名、引用关系）通常比向量索引更有用，因为它精确。

## 一个被低估的技巧：让搜索留下痕迹

grep 的结果不只是「找到了什么」，还包括「找了哪些地方、没找到什么」。这些信息对模型很有价值：

- 搜了三个模式都没命中 → 说明命名习惯和它想的不一样，该换词；
- 某个目录反复命中 → 说明核心逻辑在这里，值得先读 README；
- 命中太多 → 说明模式太宽，该加限定词。

所以好的工具结果应该包含**搜索范围与命中数**，而不只是匹配行。这是「让模型看见自己的调查过程」。

## 本章带走

- [ ] 代码检索优先 grep：精确、实时、可解释
- [ ] 把搜索当成渐进调查，而不是一次性召回
- [ ] 三个工具分工明确：Glob 找文件、Grep 找内容、Read 读细节
- [ ] 只在「大库 + 低频变更」时才考虑索引
- [ ] 工具结果带上范围与命中数，让模型看见调查过程`,
      en: `Start with a scene you have definitely lived through.

You ask an agent in a mid-sized repo: "where is the login token generated?"

The RAG answer: chunk, embed, retrieve top-k, stuff into the prompt. With luck the chunk contains the function; without luck it contains a comment, a same-named variable, or an implementation from three versions ago.

The Claude Code answer: \`Grep("generateToken")\`, see the hits; \`Grep("refreshToken")\` to narrow; \`Read\` the relevant lines. Three steps, each with evidence.

The difference: **RAG guesses once; agentic search investigates.**

## Why classic RAG stumbles on code

:::chart grep-vs-rag
:::

Four concrete problems:

1. **Chunking cuts semantics.** A function split into three pieces loses its context.
2. **Indexes go stale.** Code changes daily; a real-time index across dozens of branches is a fantasy.
3. **Recall is probabilistic.** A high similarity score is not a correct answer, and errors are hard to explain.
4. **Infrastructure cost.** Vector store, embedding model, sync pipeline, permission mapping — four systems to maintain.

:::warn A common confusion
"Searching code" and "searching docs" are different problems. Docs are static and semantically dense; code is dynamic, structurally dense and identifier-exact. Porting a doc-RAG design to code usually loses to a single grep.
:::

## How agentic search works

The core loop is almost trivial:

~~~text
1. I know what to find, not where   → Grep(regex)
2. I know roughly what the file is  → Glob(pattern)
3. I know the file                  → Read(line range)
4. I need global understanding      → delegate to a sub-agent, get a summary
~~~

The tools are not the point. The point is that **each observation changes the next plan**. That is exactly what an agent loop is good at.

It is also why Claude Code never needs "retrieve all relevant code at once" — it looks while walking, like a human.

## Division of labour

| Tool | Input | Use when | Anti-pattern |
| --- | --- | --- | --- |
| Glob | Filename pattern | You know the name, not the place | Using it for content |
| Grep | Regex | You know the string or pattern | Using it to read a whole file |
| Read | Path + range | You have located the file | Using it to walk directories |

:::tip Let the model choose
Do not hard-code "Glob then Grep then Read". Describe each tool's boundary and let the model pick. Fixed pipelines are faster on toy tasks and more brittle on real ones.
:::

## When to index

:::chart search-matrix
:::

Two variables: **repo size** and **change rate**.

- Small + fast: grep, no debate.
- Large + fast: grep first, add structural indexes (symbol tables, call graphs) for hot zones, with incremental updates.
- Small + slow: grep; index maintenance costs more than it saves.
- Large + slow: indexing earns its keep — RAG finally pencils out.

Note "structural index", not "vector index". On code, a symbol index (names, classes, references) is usually more useful than embeddings, because it is exact.

## An underrated trick: let search leave a trail

A grep result is not only "what was found" but "where I looked and what I did not find". That is valuable:

- Three patterns, zero hits → the naming convention differs from the model's guess; change the word.
- One directory keeps hitting → core logic lives there; read its README first.
- Far too many hits → the pattern is too broad; add qualifiers.

Good tool output therefore includes **the search scope and hit count**, not just matching lines. It lets the model see its own investigation.

## Takeaways

- [ ] Prefer grep for code: exact, live, explainable
- [ ] Treat search as progressive investigation, not one-shot recall
- [ ] Clear division: Glob for files, Grep for content, Read for detail
- [ ] Index only for large repos with slow change
- [ ] Return scope and hit counts so the model sees its own trail`,
    },
    sources: [
      src(c("Anthropic 工程博客 · Claude Code 最佳实践", "Anthropic Engineering · Claude Code best practices"), "https://www.anthropic.com/engineering/claude-code-best-practices", "anthropic.com/engineering"),
      src(c("Anthropic 工程博客 · 上下文工程", "Anthropic Engineering · Context engineering"), "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents", "anthropic.com/engineering"),
      src(c("鱼心快跑 · RAG Flow（姊妹站）", "Yuxin Rush · RAG Flow (sister site)"), "https://yuxinrun.github.io/rag-flow/", "yuxinrun.github.io"),
    ],
  },

  {
    id: "10-multi-agent",
    num: "10",
    part: 3,
    read: 13,
    tags: { zh: ["多 Agent", "编排"], en: ["Multi-agent", "Orchestration"] },
    title: c("多 Agent 架构：像公司一样运转", "Multi-agent architecture: run it like a company"),
    sub: c("拆的不是任务，是上下文", "What you split is context, not tasks"),
    lead: c(
      "「多 Agent」听起来像更高级的架构。实际上它更贵、更难调、更容易翻车。它值得用的场景比你想的少，但一旦用对，效果非常明显。",
      "Multi-agent sounds like a more advanced architecture. It is more expensive, harder to debug and easier to derail. Fewer situations need it than you think — but where it fits, it is dramatic."
    ),
    body: {
      zh: `先破一个误解：多 Agent 不是「多个模型投票」，也不是「让 Agent 互相聊天」。

在 Claude Code 里，多 Agent 的本质是**上下文隔离**：把会产生大量中间输出的子任务，交给一个拥有独立窗口的助手，父 Agent 只收结论。

## 为什么拆：算一笔上下文账

:::chart agent-isolation
:::

假设一个任务要读 12 个文件、跑 6 次测试。单 Agent 做完，主上下文峰值可能到 96K，剩下的空间只够再干半件事。

拆成两个子 Agent 之后：

- 子 Agent A 调研认证模块，独立窗口 42K；
- 子 Agent B 调研数据库层，独立窗口 38K；
- 父 Agent 只收到两份摘要，主上下文峰值 34K。

总 token 消耗其实**更高**（多了两次模型调用的开销），但主上下文的寿命长了三倍。这笔账要算清楚：你买的是「能继续干活」，不是「省钱」。

:::warn 多 Agent 不省钱
如果你看到「多 Agent 能降低 token 成本」的说法，可以直接跳过。子 Agent 的独立窗口意味着重复的 system prompt、重复的工具 schema、重复的探索。它省的是主上下文的注意力，不是账单。
:::

## 三种协作模式

| 模式 | 结构 | 适合 | 缺点 |
| --- | --- | --- | --- |
| 主管-专员 | 父 Agent 派活，子 Agent 执行 | 调研、审查、独立模块 | 父 Agent 容易变成瓶颈 |
| 流水线 | A 产出 → B 加工 → C 验证 | 有明确阶段的流程 | 阶段间传递会丢信息 |
| 对等协作 | 多个 Agent 共享目标 | 少见的开放探索 | 冲突多、难收敛 |

Claude Code 的主力是第一种。原因很实际：**父 Agent 拥有全局上下文，子 Agent 拥有局部深度**，这个分工最符合「上下文隔离」的初衷。

## 给子 Agent 写 brief 的五个要素

子 Agent 最大的失败原因是「brief 写得太随意」。一份好的任务描述包含：

1. **目标**：一句话说清要产出什么（不是「看看这个模块」，而是「列出这个模块对外暴露的 5 个 API 及其调用方」）。
2. **边界**：哪些目录可以读，哪些不能碰，要不要改文件。
3. **已知信息**：父 Agent 已经确认的事实，避免子 Agent 重复探索。
4. **产出格式**：要清单、要表格、还是要 diff。
5. **失败处理**：找不到怎么办，是返回「未找到」还是扩大范围。

~~~text
# 差的 brief
帮我看看认证模块。

# 好的 brief
目标：找出 src/auth/ 下所有会写 Cookie 的位置。
边界：只读，不要修改文件；不要读 node_modules。
已知：入口在 src/auth/index.ts，session 逻辑在 session.ts。
产出：文件路径 + 行号 + 一句说明的表格，最多 10 行。
失败：如果没找到写 Cookie 的代码，明确说「未找到」并列出你搜过的关键词。
~~~

:::aha 一个细节
「失败时明确说未找到」这句话非常重要。没有它，子 Agent 倾向于编一个看起来合理的答案，而父 Agent 无法分辨。**给失败定义一个合法的出口**，比要求它「一定要找到」有用得多。
:::

## 汇总：父 Agent 该做什么

子 Agent 返回后，父 Agent 的活儿才刚开始：

- **去重**：两个子 Agent 可能报告同一处代码。
- **交叉验证**：A 说「没有写 Cookie」，B 说「session.ts:88 有」。以证据为准。
- **决定下一步**：是直接动手，还是再派一个子 Agent 深挖。

这一步最容易被忽略。很多实现把子 Agent 的结果直接拼进上下文就完事，结果主 Agent 收到一堆互相矛盾的信息，反而更糊涂。

## 反模式清单

- **为拆而拆**：任务只有 3 个文件，拆两个子 Agent，纯亏。
- **子 Agent 再拆子 Agent**：层级一深，信息损耗指数级上升。
- **没有产出格式**：子 Agent 返回一大段散文，父 Agent 还得自己总结。
- **共享可变状态**：两个子 Agent 同时改文件，冲突几乎必然。
- **用多 Agent 做「投票」**：同一个模型跑三次，得到的往往是一致错误。

## 本章带走

- [ ] 多 Agent 的本质是上下文隔离，不是能力叠加
- [ ] 只在子任务会产生大量中间输出时才拆
- [ ] brief 必须包含目标、边界、已知信息、产出格式、失败处理
- [ ] 父 Agent 负责去重、交叉验证、决定下一步
- [ ] 别让子 Agent 再拆子 Agent，层级越深信息越少`,
      en: `First, kill a misconception: multi-agent is not "several models voting", nor "agents chatting with each other".

In Claude Code, multi-agent is fundamentally **context isolation**: subtasks that generate heavy intermediate output go to an assistant with its own window, and the parent receives conclusions.

## Why split: do the context arithmetic

:::chart agent-isolation
:::

Say a task reads twelve files and runs six test suites. Done by one agent, peak context may hit 96K, leaving room for half a job more.

Split into two sub-agents:

- Sub-agent A investigates auth in its own 42K window;
- Sub-agent B investigates the data layer in 38K;
- The parent receives two summaries; its peak is 34K.

Total token spend is actually **higher** (two extra model conversations). The main context's lifespan triples. Be clear about what you are buying: continued work, not savings.

:::warn Multi-agent does not save money
If someone claims multi-agent reduces token cost, skip the slide. Independent windows mean duplicated system prompts, duplicated tool schemas, duplicated exploration. What it saves is the main context's attention, not the bill.
:::

## Three collaboration patterns

| Pattern | Shape | Fits | Weakness |
| --- | --- | --- | --- |
| Supervisor–specialist | Parent delegates, children execute | Research, review, isolated modules | Parent becomes the bottleneck |
| Pipeline | A produces, B transforms, C verifies | Clearly staged flows | Information lost between stages |
| Peer collaboration | Agents share a goal | Rare, open-ended exploration | Many conflicts, slow convergence |

Claude Code leans on the first. The reason is practical: **the parent holds global context, the child holds local depth** — the split that matches context isolation.

## Five elements of a sub-agent brief

The biggest cause of sub-agent failure is a sloppy brief. A good one contains:

1. **Goal**: one sentence on the deliverable ("list the five public APIs and their callers", not "look at this module").
2. **Boundaries**: what may be read, what must not be touched, whether edits are allowed.
3. **Known facts**: what the parent already established, to avoid duplicate exploration.
4. **Output format**: list, table, or diff.
5. **Failure policy**: what to do when nothing is found.

~~~text
# Bad brief
Take a look at the auth module.

# Good brief
Goal: find every place under src/auth/ that writes a cookie.
Boundaries: read-only, no edits; skip node_modules.
Known: entry is src/auth/index.ts; session logic lives in session.ts.
Output: table of path + line + one-line note, max 10 rows.
Failure: if nothing writes a cookie, say "not found" and list the patterns you tried.
~~~

:::aha A small detail
"Say not found" is essential. Without it, a sub-agent tends to invent a plausible answer the parent cannot distinguish from a real one. **Define a legal exit for failure**; demanding success invites fiction.
:::

## Aggregation: the parent's real job

When children return, the parent's work begins:

- **Deduplicate**: two children may report the same code.
- **Cross-check**: A says "no cookie writes", B says "session.ts:88". Evidence wins.
- **Decide**: act now, or send one more child deeper.

This step is routinely skipped. Many implementations dump child results into context and move on, leaving the parent with contradictions and more confusion than before.

## Anti-patterns

- **Splitting for its own sake**: three files and two sub-agents is pure loss.
- **Recursive splitting**: each level of depth multiplies information loss.
- **No output format**: the child returns prose; the parent summarises again.
- **Shared mutable state**: two children editing files will conflict, almost surely.
- **Voting**: the same model three times usually produces the same wrong answer three times.

## Takeaways

- [ ] Multi-agent is context isolation, not capability stacking
- [ ] Split only when a subtask generates heavy intermediate output
- [ ] Briefs need goal, boundaries, knowns, format, failure policy
- [ ] The parent deduplicates, cross-checks and decides
- [ ] No recursive splitting — depth costs information`,
    },
    sources: [
      src(c("Anthropic 工程博客 · 构建高效 Agent", "Anthropic Engineering · Building effective agents"), "https://www.anthropic.com/engineering/building-effective-agents", "anthropic.com/engineering"),
      src(c("Claude Code 文档 · 子 Agent", "Claude Code docs · Sub-agents"), "https://code.claude.com/docs", "code.claude.com"),
      src(c("鱼心快跑 · Agent 可观测性（姊妹站）", "Yuxin Rush · Agent observability (sister site)"), "https://yuxinrun.github.io/agent-observability-patterns/", "yuxinrun.github.io"),
    ],
  },
];