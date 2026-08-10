// 统一导出 AI Copilot 可调用的工具集合
// 用法：streamText({ tools: allTools })
import { queryCommits } from "./query-commits";
import { queryStats } from "./query-stats";

export const allTools = {
  queryCommits,
  queryStats,
} as const;

export { queryCommits, queryStats };