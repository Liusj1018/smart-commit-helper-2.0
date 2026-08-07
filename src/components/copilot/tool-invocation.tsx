"use client";

// 工具调用可视化：把 AI 调用 queryCommits / queryStats 的过程
// 以"折叠卡片"的形式展示在消息里。
// - state = "input-streaming" | "input-available"：显示"正在调用XX工具…" + spinner
// - state = "output-available"：显示"已完成"，可折叠查看 input/output 详情
// - state = "output-error"：显示中文错误
//
// AI SDK v5 里工具调用是通过 part.type = `tool-${toolName}` 传过来的。

import { useState } from "react";
import { ChevronRight, Loader2, CheckCircle2, XCircle, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { AutoChart, extractChartSpec } from "./auto-chart";

// 工具名 → 中文展示名
const TOOL_LABELS: Record<string, string> = {
  queryCommits: "提交查询工具",
  queryStats: "团队统计工具",
};

interface ToolPart {
  type: string; // "tool-queryCommits" | "tool-queryStats"
  toolCallId?: string;
  state?:
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  input?: unknown;
  output?: unknown;
  errorText?: string;
}

export function ToolInvocation({ part }: { part: ToolPart }) {
  const [open, setOpen] = useState(false);

  // 从 part.type 里取出 toolName："tool-queryCommits" → "queryCommits"
  const toolName = part.type.replace(/^tool-/, "");
  const label = TOOL_LABELS[toolName] ?? toolName;

  const state = part.state ?? "input-streaming";
  const isRunning = state === "input-streaming" || state === "input-available";
  const isDone = state === "output-available";
  const isError = state === "output-error";

  // S4：如果工具输出里带 chart，就在卡片外面直接画一张图
  // —— 这样用户不用点开就能看到可视化结果
  const chartSpec = isDone ? extractChartSpec(part.output) : null;

  const statusText = isRunning
    ? `正在调用${label}…`
    : isDone
      ? `${label} 已完成`
      : isError
        ? `${label} 调用失败`
        : label;

  return (
    <div
      className={cn(
        "my-2 rounded-md border text-xs",
        isRunning &&
          "border-blue-200 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/30",
        isDone &&
          "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/30",
        isError &&
          "border-rose-200 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/30"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left"
        aria-expanded={open}
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform",
            open && "rotate-90"
          )}
        />
        {isRunning ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-600 dark:text-blue-400" />
        ) : isDone ? (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        ) : isError ? (
          <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
        ) : (
          <Wrench className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="font-medium">{statusText}</span>
      </button>

      {/* S4：结构化图表始终展示（不折叠） */}
      {chartSpec && <AutoChart spec={chartSpec} />}

      {open && (
        <div className="space-y-2 border-t border-current/10 px-2.5 py-2 text-[11px]">
          {part.input !== undefined && (
            <div>
              <div className="mb-1 font-semibold text-[color:var(--muted-foreground)]">
                入参
              </div>
              <pre className="max-h-32 overflow-auto rounded bg-black/5 p-2 dark:bg-white/5">
                {safeStringify(part.input)}
              </pre>
            </div>
          )}
          {isDone && part.output !== undefined && (
            <div>
              <div className="mb-1 font-semibold text-[color:var(--muted-foreground)]">
                返回
              </div>
              <pre className="max-h-40 overflow-auto rounded bg-black/5 p-2 dark:bg-white/5">
                {safeStringify(part.output)}
              </pre>
            </div>
          )}
          {isError && part.errorText && (
            <div className="text-rose-700 dark:text-rose-300">
              {part.errorText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

// 判断某个 message part 是否为工具调用
export function isToolPart(
  p: { type: string }
): p is ToolPart & { type: `tool-${string}` } {
  return typeof p.type === "string" && p.type.startsWith("tool-");
}