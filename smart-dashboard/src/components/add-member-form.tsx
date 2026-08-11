"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createMemberAction, type MemberFormState } from "@/app/(dashboard)/members/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";

const initialState: MemberFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          添加中...
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          添加成员
        </>
      )}
    </Button>
  );
}

export function AddMemberForm() {
  const [state, formAction] = useActionState(createMemberAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      {state.error && (
        <div
          className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}
      {state.success && (
        <div
          className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700 border border-green-200"
          role="status"
        >
          <span>{state.success}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">姓名 *</Label>
          <Input id="name" name="name" required maxLength={100} placeholder="张三" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">邮箱 *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            maxLength={254}
            placeholder="zhangsan@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">角色</Label>
          <select
            id="role"
            name="role"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue="developer"
          >
            <option value="admin">管理员</option>
            <option value="developer">开发者</option>
            <option value="member">成员</option>
            <option value="viewer">观察者</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="github_username">GitHub 用户名</Label>
          <Input
            id="github_username"
            name="github_username"
            maxLength={100}
            placeholder="zhangsan"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="password">密码 *</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            maxLength={128}
            placeholder="至少 6 个字符，成员首次登录使用"
          />
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}