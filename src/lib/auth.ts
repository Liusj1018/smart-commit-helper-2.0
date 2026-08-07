import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";

const SESSION_COOKIE_NAME = "sd_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const DEMO_USER = {
  email: "demo@smartdashboard.dev",
  passwordHash: "demo-password-123",
  name: "Demo User",
};

function constantTimeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function authenticate(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  if (!email || !password) {
    return { success: false, error: "邮箱和密码不能为空" };
  }
  if (email.length > 254 || password.length > 128) {
    return { success: false, error: "输入长度超出限制" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "邮箱格式不正确" };
  }

  const emailMatch = constantTimeEqual(email.toLowerCase().trim(), DEMO_USER.email);
  const passwordMatch = constantTimeEqual(password, DEMO_USER.passwordHash);

  if (!emailMatch || !passwordMatch) {
    return { success: false, error: "邮箱或密码错误" };
  }

  const sessionToken = crypto.randomUUID() + "-" + Date.now().toString(36);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return { success: true };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  return !!session?.value;
}

export async function getCurrentUser(): Promise<{ email: string; name: string } | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  if (!session?.value) return null;
  return { email: DEMO_USER.email, name: DEMO_USER.name };
}