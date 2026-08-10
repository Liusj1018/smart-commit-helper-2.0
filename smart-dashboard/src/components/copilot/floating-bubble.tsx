"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingBubbleProps {
  onClick: () => void;
  hidden?: boolean;
}

/**
 * 右下角悬浮气泡按钮。
 * 点击后由父组件负责打开 Drawer。
 */
export function FloatingBubble({ onClick, hidden }: FloatingBubbleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="打开 AI 助手"
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "flex h-14 w-14 items-center justify-center rounded-full",
        "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]",
        "shadow-lg shadow-black/10 hover:scale-105 active:scale-95",
        "transition-all duration-200",
        hidden && "pointer-events-none opacity-0"
      )}
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}