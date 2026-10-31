/* ============================================================
   Primary sources surfaced on the /sources page.
   Links point at official docs and first-hand write-ups.
   ============================================================ */

const c = (zh, en) => ({ zh, en });

export const EXTRA_SOURCES = [
  {
    label: c("Claude Code 官方文档", "Claude Code documentation"),
    url: "https://code.claude.com/docs",
    dom: "code.claude.com",
  },
  {
    label: c("Claude Code 官方仓库与变更记录", "Official repo & changelog"),
    url: "https://github.com/anthropics/claude-code",
    dom: "github.com/anthropics",
  },
  {
    label: c("Anthropic 工程博客 · Claude Code 最佳实践", "Anthropic Engineering · Claude Code best practices"),
    url: "https://www.anthropic.com/engineering/claude-code-best-practices",
    dom: "anthropic.com/engineering",
  },
  {
    label: c("Anthropic 工程博客 · 构建高效 Agent", "Anthropic Engineering · Building effective agents"),
    url: "https://www.anthropic.com/engineering/building-effective-agents",
    dom: "anthropic.com/engineering",
  },
  {
    label: c("Anthropic 工程博客 · 给 Agent 写工具", "Anthropic Engineering · Writing tools for agents"),
    url: "https://www.anthropic.com/engineering/writing-tools-for-agents",
    dom: "anthropic.com/engineering",
  },
  {
    label: c("Anthropic 工程博客 · 上下文工程", "Anthropic Engineering · Effective context engineering"),
    url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents",
    dom: "anthropic.com/engineering",
  },
  {
    label: c("Anthropic 工程博客 · Claude Code 沙箱与安全", "Anthropic Engineering · Sandboxing Claude Code"),
    url: "https://www.anthropic.com/engineering/claude-code-sandboxing",
    dom: "anthropic.com/engineering",
  },
  {
    label: c("Prompt Caching 文档（价格与 TTL）", "Prompt caching docs (pricing & TTL)"),
    url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching",
    dom: "docs.anthropic.com",
  },
  {
    label: c("Model Context Protocol 规范", "Model Context Protocol specification"),
    url: "https://modelcontextprotocol.io",
    dom: "modelcontextprotocol.io",
  },
  {
    label: c("花生 · Claude Code 源码解析（参考读物）", "Huasheng · Claude Code source teardown (reference)"),
    url: "https://www.huasheng.ai/orange-books/source-code/read/",
    dom: "huasheng.ai",
  },
  {
    label: c("鱼心快跑 · 如何构建更好的 Agent", "Yuxin Rush · Building a better agent"),
    url: "https://yuxinrun.github.io/better-agent/",
    dom: "yuxinrun.github.io",
  },
  {
    label: c("Simon Willison 的 Agent 观察笔记", "Simon Willison's notes on agents"),
    url: "https://simonwillison.net/",
    dom: "simonwillison.net",
  },
];