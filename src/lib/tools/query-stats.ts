// 工具：查询团队总体统计 / 按维度聚合
// - 支持 groupBy："all"（默认，团队概况 + 类型分布图）| "type"（按提交类型分布图）| "author"（按成员分布图）
// - 附带 chart 字段：结构化输出，前端 <AutoChart /> 直接渲染
// - 红线 4：内部 try/catch，失败返回结构化中文错误
// - 红线 6：错误文案中文

import { tool } from "ai";
import { z } from "zod";
import { getStats, getCommits } from "@/lib/data";

export const queryStats = tool({
  description:
    "查询团队统计并返回可视化图表数据。三种维度按需选择：\n" +
    "  · groupBy=\"all\"（默认）→ 团队总览：提交总数、PR 总数、平均审核时长、完成率，附「各类型提交分布」柱状图。\n" +
    "  · groupBy=\"type\" → 只按提交类型（feat/fix/docs/chore/...）聚合，返回柱状图。\n" +
    "  · groupBy=\"author\" → 按成员姓名聚合各人提交次数，返回柱状图，用于回答「谁提交最多」「成员活跃度」「按人排名」等问题。\n" +
    "工具返回里的 chart 字段会被前端自动渲染为图表，你在文字回答里只需**解读**结果（趋势/排名/占比），不要复述每个数字。",
  inputSchema: z.object({
    groupBy: z
      .enum(["all", "type", "author"])
      .optional()
      .describe(
        '聚合维度：all=总览（默认）；type=按提交类型；author=按成员姓名。用户问"谁提交最多/活跃度/排名/每个人"时用 author。'
      ),
  }),
  execute: async ({ groupBy }) => {
    try {
      const dim = groupBy ?? "all";

      if (dim === "author") {
        const all = getCommits();
        const map = new Map<string, number>();
        for (const c of all) {
          map.set(c.authorName, (map.get(c.authorName) ?? 0) + 1);
        }
        const arr = Array.from(map.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value);

        return {
          ok: true as const,
          dimension: "author" as const,
          data: arr,
          chart: {
            type: "bar" as const,
            title: "各成员提交次数",
            data: arr,
          },
        };
      }

      if (dim === "type") {
        const s = getStats();
        const arr = s.commitTypeDistribution.map((d) => ({
          label: d.type,
          value: d.count,
        }));
        return {
          ok: true as const,
          dimension: "type" as const,
          data: arr,
          chart: {
            type: "bar" as const,
            title: "各类型提交分布",
            data: arr,
          },
        };
      }

      // dim === "all"
      const s = getStats();
      const arr = s.commitTypeDistribution.map((d) => ({
        label: d.type,
        value: d.count,
      }));
      return {
        ok: true as const,
        dimension: "all" as const,
        summary: {
          totalCommits: s.totalCommits,
          totalPRs: s.totalPRs,
          avgReviewHours: s.avgReviewHours,
          completionRate: s.completionRate, // 0~1
        },
        distribution: s.commitTypeDistribution,
        chart: {
          type: "bar" as const,
          title: "各类型提交分布",
          data: arr,
        },
      };
    } catch (e) {
      console.error("[tool:queryStats] error", e);
      return {
        ok: false as const,
        message: "查询团队统计时出错，请稍后再试",
      };
    }
  },
});