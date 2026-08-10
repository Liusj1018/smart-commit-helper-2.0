// AI 对话流式接口。
// 红线 1：只在服务端读取 OPENAI_API_KEY。
// 红线 2：maxDuration = 60 秒。
// 红线 3：把 req.signal 透传给 streamText 的 abortSignal，用户点"停止"时前后端同步终止。
// 红线 5：stopWhen = stepCountIs(5)，允许工具调用后 AI 继续回答。
// 红线 6：错误只返回中文文案，绝不外泄英文堆栈。

import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  type UIMessage,
} from "ai";
import { chatModel } from "@/lib/ai/model";
import { SYSTEM_PROMPT } from "@/lib/ai/prompt";
import { toChineseError } from "@/lib/errors";
import { allTools } from "@/lib/tools";
import { getCommits, getStats, type CommitType } from "@/lib/data";

export const maxDuration = 60;
export const runtime = "nodejs";

// 未配置真实 Key 时启用 Mock，方便本地/演示环境走通完整链路
// 也支持通过 MOCK_MODE=1 强制走 Mock（例如 Key 有效但上游返回格式不兼容时）
function isMockMode() {
  if (process.env.MOCK_MODE === "1" || process.env.MOCK_MODE === "true") return true;
  const key = process.env.OPENAI_API_KEY;
  return !key || key === "sk-your-api-key-here" || key.startsWith("sk-your");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages: UIMessage[] };
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    // 红线 3 自测项 1：用户点"停止"时，服务端必须有清晰日志
    // 前端 useChat().stop() 会终止 fetch，req.signal 触发 abort
    req.signal.addEventListener(
      "abort",
      () => {
        console.log("[/api/chat] client aborted, streamText will be cancelled");
      },
      { once: true }
    );

    if (isMockMode()) {
      return mockStreamResponse(messages, req.signal);
    }

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: chatModel,
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      stopWhen: stepCountIs(5), // 红线 5
      tools: allTools,          // S3
      abortSignal: req.signal,  // 红线 3
      maxRetries: 1,
      onError: ({ error }) => {
        console.error("[/api/chat] streamText onError:", error);
      },
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error("[/api/chat] stream onError:", error);
        return toChineseError(error);
      },
    });
  } catch (e) {
    console.error("[/api/chat] error:", e);
    return Response.json(
      { code: "CHAT_ERROR", message: toChineseError(e) },
      { status: 500 }
    );
  }
}

// ============================================================
// Mock 模式：手写 AI SDK v5 UIMessageStream 协议
// ============================================================
type MockPlan =
  | { kind: "text"; text: string }
  | {
      kind: "tool";
      toolName: "queryCommits" | "queryStats";
      input: Record<string, unknown>;
      output: unknown;
      prelude: string;
      summary: string;
      /** S5 自测：模拟 tool 失败路径（红线 4） */
      toolError?: string;
    };

function mockStreamResponse(
  messages: UIMessage[],
  signal: AbortSignal
): Response {
  const last = messages[messages.length - 1];
  const userText =
    last?.parts
      ?.filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
      .map((p) => p.text)
      .join("") ?? "";

  const plan = planMockReply(userText);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (obj: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {}
      };

      const onAbort = () => close(); // 红线 3
      signal.addEventListener("abort", onAbort);

      try {
        send({ type: "start" });

        if (plan.kind === "text") {
          send({ type: "start-step" });
          await streamTextChars(send, plan.text, signal);
          send({ type: "finish-step" });
        } else {
          // 步骤 1：AI 先说一句 → 调用工具
          send({ type: "start-step" });
          await streamTextChars(send, plan.prelude, signal);
          if (signal.aborted) throw new Error("aborted");

          const toolCallId = "call_" + Date.now().toString(36);
          send({
            type: "tool-input-available",
            toolCallId,
            toolName: plan.toolName,
            input: plan.input,
          });
          await sleep(700, signal);
          if (signal.aborted) throw new Error("aborted");

          if (plan.toolError) {
            // 红线 4 演示：工具执行失败 → 结构化错误，不崩流
            send({
              type: "tool-output-error",
              toolCallId,
              errorText: plan.toolError,
            });
          } else {
            send({
              type: "tool-output-available",
              toolCallId,
              output: plan.output,
            });
          }
          send({ type: "finish-step" });

          // 步骤 2：工具结果回灌后继续回答（红线 5：多步）
          send({ type: "start-step" });
          await streamTextChars(send, plan.summary, signal);
          send({ type: "finish-step" });
        }

        if (!signal.aborted) {
          send({ type: "finish" });
          if (!closed) {
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          }
        }
      } catch {
        // 已中止
      } finally {
        signal.removeEventListener("abort", onAbort);
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "x-vercel-ai-ui-message-stream": "v1",
    },
  });
}

async function streamTextChars(
  send: (obj: unknown) => void,
  text: string,
  signal: AbortSignal
) {
  const id =
    "t_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  send({ type: "text-start", id });
  for (const ch of Array.from(text)) {
    if (signal.aborted) break;
    send({ type: "text-delta", id, delta: ch });
    await sleep(30, signal);
  }
  send({ type: "text-end", id });
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      resolve();
    });
  });
}

// ============================================================
// 根据用户输入决定 Mock 剧本
// ============================================================
function planMockReply(userText: string): MockPlan {
  const q = userText.trim();

  if (!q) {
    return {
      kind: "text",
      text: "你好，我是 **Smart Copilot（演示模式）**。可以问我：谁提交了什么、团队概况、各类型分布……",
    };
  }

  // ---- S5 自测触发器：输入"报错测试"/"工具报错" → 模拟工具失败路径 ----
  if (/(报错测试|工具报错|tool.?error|模拟错误)/i.test(q)) {
    return {
      kind: "tool",
      toolName: "queryCommits",
      input: { limit: 3 },
      output: null,
      prelude: "我来试着查一下……",
      toolError: "查询提交记录时出错（模拟错误），请稍后再试",
      summary:
        "刚才的工具调用失败了，我这边先中止本次查询。你可以稍后重试，或者换个说法（例如「查李默的提交」）。",
    };
  }

  // ---- 优先级最高："谁提交最多 / 排名 / 活跃度" → queryStats(按作者) + 柱状图
  //  必须放在 queryCommits 之前，否则会被"提交"关键字先命中 ----
  if (/(谁|最多|活跃|每个人|按人|按作者|排名)/i.test(q)) {
    const all = getCommits();
    const map = new Map<string, number>();
    for (const c of all) {
      map.set(c.authorName, (map.get(c.authorName) ?? 0) + 1);
    }
    const arr = Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const output = {
      ok: true,
      dimension: "author",
      data: arr,
      chart: {
        type: "bar" as const,
        title: "各成员提交次数",
        data: arr,
      },
    };

    const top = arr[0];
    const total = arr.reduce((s, x) => s + x.value, 0);
    const summary = [
      `按作者聚合了 **${arr.length}** 位成员共 **${total}** 条提交：`,
      "",
      ...arr.map((x, i) => `${i + 1}. **${x.label}** — ${x.value} 次`),
      "",
      `> 目前 **${top.label}** 提交次数最多（${top.value} 次），是本周期最活跃的成员。`,
    ].join("\n");

    return {
      kind: "tool",
      toolName: "queryStats",
      input: { groupBy: "author" },
      output,
      prelude: "好的，我来看看各成员的提交活跃度……",
      summary,
    };
  }

  // ---- queryCommits：包含中文名 / commit 类型 / "提交" 关键字 ----
  const nameMatch = q.match(/(李默|陈星野|王砚秋|苏映月)/);
  const typeMatch = q.match(/\b(feat|fix|docs|chore|refactor|test|perf|build)\b/i);
  if (nameMatch || typeMatch || /(提交|commit)/i.test(q)) {
    const author = nameMatch?.[1];
    const type = typeMatch?.[1]?.toLowerCase() as CommitType | undefined;
    const items = getCommits({ author, type, limit: 5 });

    const output = {
      ok: true,
      count: items.length,
      filter: { author: author ?? null, type: type ?? null },
      items: items.map((c) => ({
        sha: c.sha,
        type: c.type,
        scope: c.scope,
        message: c.message,
        author: c.authorName,
      })),
    };

    const filterLabel =
      [
        author ? `作者 = **${author}**` : null,
        type ? `类型 = **${type}**` : null,
      ]
        .filter(Boolean)
        .join("，") || "全部";

    const summary = [
      `已查询到 **${items.length}** 条提交记录（筛选：${filterLabel}）：`,
      "",
      ...items.map(
        (c, i) =>
          `${i + 1}. \`${c.sha}\` **${c.type}(${c.scope})** ${c.message} — _${c.authorName}_`
      ),
      "",
      "> 如果需要换个人或换类型继续筛，直接告诉我。",
    ].join("\n");

    return {
      kind: "tool",
      toolName: "queryCommits",
      input: {
        ...(author ? { author } : {}),
        ...(type ? { type } : {}),
        limit: 5,
      },
      output,
      prelude: `好的，我来查一下${author ? `**${author}** 的` : ""}${
        type ? `**${type}** 类型的` : ""
      }提交记录……`,
      summary,
    };
  }

  // ---- queryStats：概况 / 分布 / 完成率 / PR / 图 ----
  if (/(概况|统计|分布|完成率|平均|审核|pr|图|柱状|多少|团队)/i.test(q)) {
    const s = getStats();
    const output = {
      ok: true,
      summary: {
        totalCommits: s.totalCommits,
        totalPRs: s.totalPRs,
        avgReviewHours: s.avgReviewHours,
        completionRate: s.completionRate,
      },
      distribution: s.commitTypeDistribution,
      chart: {
        type: "bar" as const,
        title: "各类型提交分布",
        data: s.commitTypeDistribution.map((d) => ({
          label: d.type,
          value: d.count,
        })),
      },
    };

    const pct = (n: number) => `${(n * 100).toFixed(0)}%`;
    const summary = [
      "**团队总体概况：**",
      "",
      `- 提交总数：**${s.totalCommits}**`,
      `- PR 总数：**${s.totalPRs}**`,
      `- 平均审核时长：**${s.avgReviewHours} 小时**`,
      `- PR 完成率：**${pct(s.completionRate)}**`,
      "",
      "**各类型提交分布：**",
      "",
      ...s.commitTypeDistribution.map(
        (d) => `- \`${d.type}\` × **${d.count}**`
      ),
      "",
      "> 上方柱状图直观展示了各类型的比例：**feat** 类提交占比最高，说明团队正处于快速迭代阶段。",
    ].join("\n");

    return {
      kind: "tool",
      toolName: "queryStats",
      input: { scope: "all" },
      output,
      prelude: "好的，我来汇总一下团队整体情况……",
      summary,
    };
  }

  // ---- 兜底：纯文本回复 ----
  return {
    kind: "text",
    text: [
      "我目前处于 **演示模式**（未配置真实 API Key）。可以试试问：",
      "",
      "- 「查李默的提交」",
      "- 「最近的 fix 有哪些？」",
      "- 「团队概况怎么样？」",
      "- 「各类型提交的分布」",
      "",
      "配置真实 `OPENAI_API_KEY` 后我就能自由回答任何问题啦。",
    ].join("\n"),
  };
}