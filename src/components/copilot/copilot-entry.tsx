"use client";

import { useState } from "react";
import { FloatingBubble } from "./floating-bubble";
import { ChatDrawer } from "./chat-drawer";

/**
 * Copilot 入口：右下角悬浮气泡 + 侧边聊天 Drawer。
 * S1 阶段仅完成 UI 挂载与开合逻辑；对话能力在 S2 接入。
 */
export function CopilotEntry() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <FloatingBubble onClick={() => setOpen(true)} hidden={open} />
      <ChatDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}