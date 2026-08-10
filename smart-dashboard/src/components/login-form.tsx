"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react";

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          登录中...
        </>
      ) : (
        "登录"
      )}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Smart Dashboard</CardTitle>
        <CardDescription className="text-center">
          输入您的凭据以访问团队仪表盘
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4" noValidate>
          {state.error && (
            <div
              className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{state.error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                autoFocus
                maxLength={254}
                className="pl-10"
                aria-describedby="email-hint"
              />
            </div>
            <p id="email-hint" className="text-xs text-muted-foreground">
              演示账号: demo@smartdashboard.dev
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                maxLength={128}
                minLength={8}
                className="pl-10"
                aria-describedby="password-hint"
              />
            </div>
            <p id="password-hint" className="text-xs text-muted-foreground">
              演示密码: demo-password-123
            </p>
          </div>

          <SubmitButton />
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          登录即表示您同意我们的服务条款和隐私政策
        </p>
      </CardContent>
    </Card>
  );
}