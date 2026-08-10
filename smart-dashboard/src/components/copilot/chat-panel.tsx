"use client";

// 聊天面板：useChat（AI SDK v5）+ 消息流渲染 + Markdown。
// 红线 3：status === "streaming" 时显示"停止"按钮，调用 stop() 前后端同步中止。
// 红线 6：错误（onError）走中文提示，不显示英文堆栈。

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { ArrowUp, Square, RotateCcw, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toChineseError, isUserAbort } from "@/lib/errors";
import { ToolInvocation, isToolPart } from "./tool-invocation";

interface ChatPanelProps {
  className?: string;
}

export function ChatPanel({ className }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [uiError, setUiError] = useState<string | null>(null);
  const [stopped, setStopped] = useState(false);

  const { messages, sendMessage, stop, regenerate, status } = useChat({
    // 与 /api/chat 对接
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    // 红线 6：错误转中文；用户主动停止不算错，UI 静默
    onError: (err) => {
      if (isUserAbort(err)) {
        return;
      }
      setUiError(toChineseError(err));
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";
  const listRef = useRef<HTMLDivElement>(null);

  // 自动滚到底部
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isStreaming]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setUiError(null);
    setStopped(false);
    void sendMessage({ text });
    setInput("");
  }

  function handleStop() {
    // 红线 3：前端立刻置状态；stop() 会 abort fetch → 服务端 req.signal 触发 abort
    stop();
    setStopped(true);
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* 消息列表 */}
      <div
        ref={listRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 && (
          <EmptyHint
            onPick={(q) => {
              setUiError(null);
              void sendMessage({ text: q });
            }}
          />
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {stopped && !isStreaming && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            <span>已停止生成</span>
            <button
              type="button"
              onClick={() => {
                setStopped(false);
                void regenerate();
              }}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-amber-100 dark:hover:bg-amber-900/40"
            >
              <RotateCcw className="h-3 w-3" />
              继续
            </button>
          </div>
        )}

        {uiError && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            <span>{uiError}</span>
            <button
              type="button"
              onClick={() => {
                setUiError(null);
                void regenerate();
              }}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-rose-100 dark:hover:bg-rose-900/40"
            >
              <RotateCcw className="h-3 w-3" />
              重试
            </button>
          </div>
        )}
      </div>

      {/* 输入区 */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-[color:var(--border)] bg-[color:var(--background)] px-3 py-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            placeholder="问点什么，比如：本周李默提交了多少次？"
            rows={1}
            className="max-h-32 min-h-[38px] flex-1 resize-none rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={handleStop}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-rose-600 text-white transition-colors hover:bg-rose-700"
              aria-label="停止生成"
              title="停止生成"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[color:var(--primary)] text-[color:var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
              aria-label="发送"
              title="发送 (Enter)"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-2 text-[11px] text-[color:var(--muted-foreground)]">
          Enter 发送，Shift + Enter 换行
        </p>
      </form>
    </div>
  );
}

// ---------------- 子组件 ----------------

function EmptyHint({ onPick }: { onPick: (q: string) => void }) {
  const suggestions = [
    "查李默的提交",
    "最近的 fix 有哪些？",
    "团队概况怎么样？",
    "谁提交得最多？",
  ];
  return (
    <div className="mx-auto max-w-sm space-y-3 py-8 text-center">
      <Bot className="mx-auto h-8 w-8 text-[color:var(--muted-foreground)]" />
      <div>
        <p className="text-sm font-medium">我是 Smart Copilot</p>
        <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
          问我关于团队提交、PR 和成员活跃度的问题
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-md border border-[color:var(--border)] bg-[color:var(--muted)]/40 px-3 py-2 text-left text-xs transition-colors hover:bg-[color:var(--muted)]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const parts = message.parts ?? [];

  // 用户消息：只拼文本
  if (isUser) {
    const text = parts
      .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
      .map((p) => p.text)
      .join("");
    return (
      <div className="flex flex-row-reverse gap-2">
        <Avatar isUser />
        <div className="max-w-[85%] rounded-lg bg-[color:var(--primary)] px-3 py-2 text-sm leading-relaxed text-[color:var(--primary-foreground)]">
          <p className="whitespace-pre-wrap break-words">{text}</p>
        </div>
      </div>
    );
  }

  // AI 消息：按 parts 顺序渲染 —— 文本块用 Markdown、工具调用用 <ToolInvocation />
  // 这样"AI 说一句 → 调工具 → 再总结"能按时间轴还原
  return (
    <div className="flex flex-row gap-2">
      <Avatar />
      <div className="max-w-[85%] rounded-lg bg-[color:var(--muted)] px-3 py-2 text-sm leading-relaxed text-[color:var(--foreground)]">
        {parts.length === 0 && <span className="opacity-60">…</span>}
        {parts.map((p, idx) => {
          if (p.type === "text") {
            return (
              <div
                key={idx}
                className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-pre:my-2"
              >
                <ReactMarkdown>{p.text || "…"}</ReactMarkdown>
              </div>
            );
          }
          if (isToolPart(p)) {
            return <ToolInvocation key={idx} part={p} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}

function Avatar({ isUser = false }: { isUser?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs",
        isUser
          ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
          : "bg-[color:var(--muted)] text-[color:var(--foreground)]"
      )}
    >
      {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
    </div>
  );
}
