import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { backendListCommits, backendListMembers, type BackendCommit, type BackendMember } from "@/lib/api";
import { GroupSubmitForm } from "@/components/group-submit-form";
import { ArrowLeft, GitBranch, Plus, Minus, Bot, Inbox } from "lucide-react";

export const metadata: Metadata = {
  title: "提交记录",
};

function parseCommitType(message: string): string {
  const match = message.match(/^([a-z]+)(?:\([^)]*\))?:/);
  return match ? match[1] : "other";
}

const TYPE_COLORS: Record<string, string> = {
  feat: "bg-green-100 text-green-800",
  fix: "bg-red-100 text-red-800",
  docs: "bg-blue-100 text-blue-800",
  refactor: "bg-purple-100 text-purple-800",
  chore: "bg-gray-100 text-gray-800",
  test: "bg-yellow-100 text-yellow-800",
  style: "bg-pink-100 text-pink-800",
  perf: "bg-orange-100 text-orange-800",
  other: "bg-gray-100 text-gray-800",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-red-500",
  "bg-indigo-500",
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default async function CommitsPage() {
  let members: BackendMember[] = [];
  let commits: BackendCommit[] = [];
  let totalCommits = 0;

  try {
    const [membersRes, commitsRes] = await Promise.all([
      backendListMembers({ page: 1, page_size: 100 }),
      backendListCommits({ page: 1, page_size: 200 }),
    ]);
    members = membersRes.items;
    commits = commitsRes.items;
    totalCommits = commitsRes.total;
  } catch {
    // Will render empty state
  }

  // Group commits by member
  const commitsByMember = new Map<string, BackendCommit[]>();
  for (const c of commits) {
    const list = commitsByMember.get(c.member_id) ?? [];
    list.push(c);
    commitsByMember.set(c.member_id, list);
  }

  // Sort members by commit count descending, then by name
  const memberGroups = members
    .map((m) => ({
      member: m,
      commits: (commitsByMember.get(m.id) ?? []).sort(
        (a, b) => new Date(b.committed_at).getTime() - new Date(a.committed_at).getTime(),
      ),
    }))
    .sort((a, b) => {
      if (b.commits.length !== a.commits.length) {
        return b.commits.length - a.commits.length;
      }
      return a.member.name.localeCompare(b.member.name);
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard" aria-label="返回仪表盘">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">提交记录</h1>
          <p className="text-muted-foreground">
            共 {totalCommits} 条提交 · {members.length} 位成员
          </p>
        </div>
      </div>

      {/* Three group submission areas */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">小组提交区</h2>
        <GroupSubmitForm />
      </section>

      {/* Each member in their own fixed section */}
      <div className="space-y-4">
        {memberGroups.map(({ member, commits: memberCommits }) => {
          const totalAdded = memberCommits.reduce((s, c) => s + c.lines_added, 0);
          const totalDeleted = memberCommits.reduce((s, c) => s + c.lines_deleted, 0);
          const avgAi =
            memberCommits.length > 0
              ? Math.round(
                  memberCommits.reduce((s, c) => s + c.ai_percentage, 0) /
                    memberCommits.length,
                )
              : 0;

          return (
            <Card key={member.id} id={`member-${member.id}`} className="scroll-mt-20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white ${getAvatarColor(member.id)}`}
                  >
                    {getInitials(member.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-semibold">
                        {member.name}
                      </CardTitle>
                      <Badge variant="secondary">{memberCommits.length} 次提交</Badge>
                      <Badge variant="outline" className="capitalize">
                        {member.role}
                      </Badge>
                    </div>
                    <CardDescription className="truncate">{member.email}</CardDescription>
                  </div>
                  <div className="hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
                    <span className="flex items-center gap-1 text-green-600">
                      <Plus className="h-3.5 w-3.5" />
                      {totalAdded}
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <Minus className="h-3.5 w-3.5" />
                      {totalDeleted}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bot className="h-3.5 w-3.5" />
                      {avgAi}%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {memberCommits.length === 0 ? (
                  <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                    <Inbox className="h-4 w-4" />
                    暂无提交记录
                  </div>
                ) : (
                  <div className="divide-y">
                    {memberCommits.map((commit) => {
                      const type = parseCommitType(commit.message);
                      return (
                        <div
                          key={commit.id}
                          className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {commit.message}
                            </p>
                            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-mono">{commit.sha.slice(0, 7)}</span>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <GitBranch className="h-3 w-3" />
                                {commit.branch}
                              </span>
                              <span>·</span>
                              <span>{commit.repository}</span>
                              <span>·</span>
                              <span>{formatDate(commit.committed_at)}</span>
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-xs text-green-600">
                              +{commit.lines_added}
                            </span>
                            <span className="text-xs text-red-600">
                              -{commit.lines_deleted}
                            </span>
                            {commit.ai_percentage > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Bot className="mr-1 h-3 w-3" />
                                {commit.ai_percentage}%
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={TYPE_COLORS[type] ?? ""}
                            >
                              {type}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}