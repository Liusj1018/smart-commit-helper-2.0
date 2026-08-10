"use server";

import { redirect } from "next/navigation";
import { authenticate } from "@/lib/auth";
import { headers } from "next/headers";

const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headersList.get("x-real-ip") ?? "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };
  if (now - record.firstAttempt > LOCKOUT_MS) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }
  if (record.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((LOCKOUT_MS - (now - record.firstAttempt)) / 1000);
    return { allowed: false, retryAfter };
  }
  return { allowed: true };
}

function recordAttempt(ip: string): void {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (record) {
    record.count += 1;
  } else {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  }
}

export type LoginState = {
  error?: string;
  success?: boolean;
};

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "无效的表单提交" };
  }

  const ip = await getClientIp();
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return { error: `尝试次数过多，请在 ${Math.ceil(rateLimit.retryAfter! / 60)} 分钟后重试` };
  }

  const result = await authenticate(email, password);

  if (!result.success) {
    recordAttempt(ip);
    return { error: result.error };
  }

  loginAttempts.delete(ip);
  redirect("/dashboard");
}