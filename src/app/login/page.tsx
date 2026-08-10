import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "登录 - Smart Dashboard",
  description: "登录到 Smart Dashboard 团队协作平台",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const authed = await isAuthenticated();
  if (authed) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}