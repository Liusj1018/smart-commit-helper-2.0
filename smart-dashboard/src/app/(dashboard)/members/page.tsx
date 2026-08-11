import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { backendListMembers, type BackendMember } from "@/lib/api";
import { AddMemberForm } from "@/components/add-member-form";
import { DeleteMemberButton } from "@/components/delete-member-button";
import { ShieldAlert, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "成员管理",
};

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  admin: "管理员",
  developer: "开发者",
  member: "成员",
  viewer: "观察者",
};

const ROLE_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  admin: "destructive",
  developer: "default",
  member: "secondary",
  viewer: "outline",
};

export default async function MembersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const isAdmin = user.role === "admin";

  let members: { items: BackendMember[]; total: number } = { items: [], total: 0 };
  if (isAdmin) {
    try {
      members = await backendListMembers({ page: 1, page_size: 100 });
    } catch {
      // Non-admins or API error — list stays empty
    }
  }

  const adminCount = members.items.filter((m) => m.role === "admin").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">成员管理</h1>
        <p className="text-muted-foreground">管理团队成员，添加或移除成员</p>
      </div>

      {!isAdmin && (
        <Card className="border-destructive/50">
          <CardContent className="flex items-center gap-3 pt-6">
            <ShieldAlert className="h-5 w-5 text-destructive" aria-hidden="true" />
            <p className="text-sm text-destructive">
              您当前的角色是「{ROLE_LABELS[user.role] ?? user.role}」，只有管理员可以管理成员。
            </p>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" aria-hidden="true" />
                添加新成员
              </CardTitle>
              <CardDescription>填写成员信息以添加到团队</CardDescription>
            </CardHeader>
            <CardContent>
              <AddMemberForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>团队成员列表</CardTitle>
              <CardDescription>共 {members.total} 名成员</CardDescription>
            </CardHeader>
            <CardContent>
              {members.items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">暂无成员</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">姓名</th>
                        <th className="pb-2 pr-4 font-medium">邮箱</th>
                        <th className="pb-2 pr-4 font-medium">角色</th>
                        <th className="pb-2 pr-4 font-medium">GitHub</th>
                        <th className="pb-2 font-medium text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.items.map((m) => (
                        <tr key={m.id} className="border-b last:border-0">
                          <td className="py-3 pr-4 font-medium">{m.name}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{m.email}</td>
                          <td className="py-3 pr-4">
                            <Badge variant={ROLE_VARIANTS[m.role] ?? "secondary"}>
                              {ROLE_LABELS[m.role] ?? m.role}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {m.github_username ?? "—"}
                          </td>
                          <td className="py-3 text-right">
                            <DeleteMemberButton
                              memberId={m.id}
                              memberName={m.name}
                              isSelf={m.email === user.email}
                              isLastAdmin={m.role === "admin" && adminCount <= 1}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}