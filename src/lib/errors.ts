// 中文错误映射（红线 6）：所有面向用户的错误提示统一走这里。
// 禁止在 UI 层直接显示 error.message / stack。
//
// 覆盖 Spec §5-6 的 4 类错误：
//   1) 网络 —— 断网、DNS、连接重置、无法连接
//   2) 超时 —— 上游 60s 内没响应，或本地代理挂了
//   3) 模型 —— 401 / 429 / 额度 / 上下文超限 / 模型不存在
//   4) 工具 —— 工具执行失败（结构化 { ok:false, message } 已在 tool 层处理，
//              这里兜底 "tool ... failed" 之类的兜底文案）

/** 用户主动停止是否算"错误"。业务上不算，UI 静默即可。 */
export function isUserAbort(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const msg = e.message ?? "";
  return (
    e.name === "AbortError" ||
    /aborted|abort|request was aborted|The user aborted/i.test(msg)
  );
}

export function toChineseError(e: unknown): string {
  if (e instanceof Error) {
    const msg = e.message ?? "";

    // 用户主动停止（红线 3）—— 保留文案以便某些场景显示
    if (isUserAbort(e)) {
      return "已停止生成";
    }

    // ---------- 类别 1：网络 ----------
    if (
      /Cannot connect to API|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|UND_ERR_CONNECT_TIMEOUT|Connect Timeout/i.test(
        msg
      )
    ) {
      return "无法连接 AI 服务，请检查网络或在 .env.local 中配置 OPENAI_BASE_URL 使用中转代理";
    }
    if (/failed to fetch|fetch failed|ECONNRESET|socket hang up|network/i.test(msg)) {
      return "网络断了，请检查连接后重试";
    }

    // ---------- 类别 2：超时 ----------
    if (/timeout|timed out|ETIMEDOUT/i.test(msg)) {
      return "响应超时，请稍后再试";
    }

    // ---------- 类别 3：模型 ----------
    if (/api key|apikey|401|unauthorized|invalid_api_key/i.test(msg)) {
      return "AI 服务未授权，请检查 OPENAI_API_KEY 配置";
    }
    if (/rate limit|429|too many requests/i.test(msg)) {
      return "请求太频繁，请稍后再试";
    }
    if (/quota|insufficient|billing/i.test(msg)) {
      return "AI 服务额度不足，请联系管理员";
    }
    if (/context length|too many tokens|token limit|maximum context/i.test(msg)) {
      return "对话内容过长，请开启新会话再试";
    }
    if (/model.+(not found|does not exist|unsupported)/i.test(msg)) {
      return "当前模型不可用，请检查 OPENAI_MODEL 配置";
    }
    if (/5\d\d|internal server error|bad gateway|service unavailable/i.test(msg)) {
      return "AI 服务开小差了，请稍后再试";
    }

    // ---------- 类别 4：工具 ----------
    if (/tool.*(failed|error)|invalid.*arguments|schema.*fail/i.test(msg)) {
      return "工具调用失败，请换个说法再试";
    }
  }
  // 兜底
  return "出了点小问题，请稍后重试";
}
