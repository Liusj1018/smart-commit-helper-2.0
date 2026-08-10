"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatPanel } from "./chat-panel";

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 侧边聊天窗口（Drawer）。
 * S1 阶段：只做壳，验证入口 → 面板打开/关闭 → SDK 初始化无报错。
 * S2 阶段：将在 `<ChatPanel />` 位置接入 useChat + 消息流渲染。
 */
export function ChatDrawer({ open, onOpenChange }: ChatDrawerProps) {
  // 按 Esc 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return (
    <>
      {/* 遮罩 */}
      <div
        aria-hidden={!open}
        onClick={() => onOpenChange(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* 面板 */}
      <aside
        role="dialog"
        aria-label="AI 助手"
        aria-hidden={!open}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col",
          "border-l border-[color:var(--border)] bg-[color:var(--background)]",
          "shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* 头部 */}
        <header className="flex items-center justify-between border-b border-[color:var(--border)] px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">AI 助手</h2>
            <p className="text-xs text-[color:var(--muted-foreground)]">
              问我关于提交记录和统计的问题
            </p>
          </div>
          <button
            type="button"
            aria-label="关闭"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-2 hover:bg-[color:var(--muted)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* 聊天面板（S2 接入） */}
        <div className="flex-1 min-h-0">
          <ChatPanel />
        </div>
      </aside>
    </>
  );
}