// 工具：查询提交记录
// - description 中文：告诉 AI 何时调用（红线 6）
// - parameters Zod：AI SDK 用它生成 JSON schema 给 LLM
// - execute 内部 try/catch：失败也返回结构化中文错误，不向外抛（红线 4）
// - 返回 { ok, data | message }：AI 拿到 ok=false 时会用中文告知用户

import { tool } from "ai";
import { z } from "zod";
import { getCommits, type ToolCommit, type CommitType } from "@/lib/data";

const COMMIT_TYPES = [
  "feat",
  "fix",
  "docs",
  "chore",
  "refactor",
  "test",
  "perf",
  "build",
] as const;

export const queryCommits = tool({
  description:
    "查询团队的提交记录（commits）。可按作者姓名（中文名，如「李默」）和提交类型（feat / fix / docs / chore / refactor / test / perf / build）筛选。当用户询问「某人提交了什么」「最近的 fix」「feat 有哪些」等问题时调用。",
  inputSchema: z.object({
    author: z
      .string()
      .optional()
      .describe("作者姓名的中文关键字，例如「李默」「王砚秋」，模糊匹配"),
    type: z
      .enum(COMMIT_TYPES)
      .optional()
      .describe("提交类型，如 feat / fix / docs 等"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("返回条数上限，默认 10"),
  }),
  execute: async ({ author, type, limit }) => {
    try {
      const list: ToolCommit[] = getCommits({
        author,
        type: type as CommitType | undefined,
        limit: limit ?? 10,
      });

      return {
        ok: true as const,
        count: list.length,
        filter: { author: author ?? null, type: type ?? null },
        // 精简字段，减少上下文占用
        items: list.map((c) => ({
          sha: c.sha,
          type: c.type,
          scope: c.scope,
          message: c.message,
          author: c.authorName,
        })),
      };
    } catch (e) {
      // 红线 4：不抛异常，返回结构化中文错误
      console.error("[tool:queryCommits] error", e);
      return {
        ok: false as const,
        message: "查询提交记录时出错，请稍后再试",
      };
    }
  },
});