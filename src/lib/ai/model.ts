// AI provider 初始化。
// 红线 1：仅在服务端读取 OPENAI_API_KEY，禁用 NEXT_PUBLIC_ 前缀。
// 允许通过 OPENAI_BASE_URL 指向兼容服务（如阿里百炼 compatible-mode、DeepSeek、自建代理），默认走官方端点。

import { createOpenAI } from "@ai-sdk/openai";

const apiKey = process.env.OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL;

if (!apiKey && process.env.NODE_ENV === "production") {
  // 仅生产环境强校验；开发时缺少 key 也不阻塞编译，让 /api/chat 抛错时走中文错误提示。
  console.warn("[copilot] 未检测到 OPENAI_API_KEY，AI 对话将不可用");
}

// 默认模型：允许通过 OPENAI_MODEL 覆盖。
// - 对接 OpenAI 官方：gpt-4o-mini 即可
// - 对接阿里百炼 compatible-mode：常见值 qwen-plus / qwen-turbo / qwen-max
// - 对接 DeepSeek：deepseek-chat
export const DEFAULT_MODEL_ID = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export const openaiProvider = createOpenAI({
  apiKey: apiKey ?? "",
  ...(baseURL ? { baseURL } : {}),
});

// 显式选择 .chat() → 强制使用 /chat/completions 语义（支持 tools / tool_choice）
// 而不是 OpenAI 官方独有的 /responses 端点。这是接通阿里百炼 compatible-mode / DeepSeek
// 等国内兼容层的关键开关。
export const chatModel = openaiProvider.chat(DEFAULT_MODEL_ID);
