"use server";

import { revalidatePath } from "next/cache";
import {
  backendCreateMember,
  backendDeleteMember,
  type MemberRole,
} from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export interface MemberFormState {
  error?: string;
  success?: string;
}

export async function createMemberAction(
  _prev: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "需要管理员权限" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "member") as MemberRole;
  const githubUsername = String(formData.get("github_username") ?? "").trim();

  if (!name || !email) {
    return { error: "姓名和邮箱为必填项" };
  }
  if (password.length < 6) {
    return { error: "密码至少需要 6 个字符" };
  }

  try {
    await backendCreateMember({
      name,
      email,
      password,
      role,
      github_username: githubUsername || null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "创建成员失败";
    return { error: message };
  }

  revalidatePath("/members");
  return { success: `成员 ${name} 已添加` };
}

export async function deleteMember(
  memberId: string,
): Promise<MemberFormState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "需要管理员权限" };
  }

  try {
    await backendDeleteMember(memberId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "删除成员失败";
    return { error: message };
  }

  revalidatePath("/members");
  return { success: "成员已删除" };
}
