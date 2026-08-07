import { cookies } from "next/headers";
import { timingSafeEqual, createHmac, randomBytes } from "crypto";

const SESSION_COOKIE_NAME = "sd_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Secret management: SESSION_SECRET must be set in production via environment variable
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-only-secret-change-me";
const isProduction = process.env.NODE_ENV === "production";

/** Runtime guard: throws if SESSION_SECRET is not configured in production */
function assertSecretConfigured(): void {
  if (isProduction && SESSION_SECRET === "dev-only-secret-change-me") {
    throw new Error("SESSION_SECRET environment variable must be set in production");
  }
}

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

/** Sign session token with HMAC-SHA256 to prevent tampering */
function signToken(token: string): string {
  return createHmac("sha256", SESSION_SECRET).update(token).digest("hex");
}

/** Verify session token signature using constant-time comparison */
function verifyToken(token: string, signature: string): boolean {
  const expected = signToken(token);
  return constantTimeEqual(signature, expected);
}

export async function authenticate(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  assertSecretConfigured();

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

  // Generate cryptographically secure session token with HMAC signature
  const rawToken = randomBytes(32).toString("hex");
  const signature = signToken(rawToken);
  const sessionToken = `${rawToken}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: isProduction,
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
  if (!session?.value) return false;

  const [token, signature] = session.value.split(".");
  if (!token || !signature) return false;

  return verifyToken(token, signature);
}

export async function getCurrentUser(): Promise<{ email: string; name: string } | null> {
  const authenticated = await isAuthenticated();
  if (!authenticated) return null;
  return { email: DEMO_USER.email, name: DEMO_USER.name };
}