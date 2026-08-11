import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOverviewStats, getAllCommits, getPullRequests, getPlanTasks } from "@/lib/data";
import { GitCommit, GitPullRequest, Clock, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "仪表盘",
};

const TYPE_COLORS: Record<string, string> = {
  feat: "bg-green-100 text-green-800",
  fix: "bg-red-100 text-red-800",
  docs: "bg-blue-100 text-blue-800",
  refactor: "bg-purple-100 text-purple-800",
  chore: "bg-gray-100 text-gray-800",
  test: "bg-yellow-100 text-yellow-800",
  style: "bg-pink-100 text-pink-800",
  perf: "bg-orange-100 text-orange-800",
};

const PR_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  pending: { label: "待审核", variant: "warning" },
  approved: { label: "已批准", variant: "success" },
  merged: { label: "已合并", variant: "default" },
  changes_requested: { label: "需修改", variant: "destructive" },
};

export default async function DashboardPage() {
  const [stats, commits, prs, tasks] = await Promise.all([
    getOverviewStats(),
    getAllCommits(),
    getPullRequests(),
    getPlanTasks(),
  ]);

  const completedTasks = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
        <p className="text-muted-foreground">团队活动总览</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <Link href="/commits">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总提交数</CardTitle>
              <GitCommit className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCommits}</div>
              <p className="mt-1 text-xs text-muted-foreground">点击查看每人提交详情 →</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <Link href="/pull-requests">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待审 PR</CardTitle>
              <GitPullRequest className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openPRs}</div>
              <p className="mt-1 text-xs text-muted-foreground">点击进入 PR 审查 →</p>
            </CardContent>
          </Link>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均审核时间</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgReviewTime}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">计划完成率</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.planCompletion}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>最近提交</CardTitle>
            <CardDescription>团队最新代码提交记录</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {commits.slice(0, 6).map((commit) => (
              <div key={commit.id} className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{commit.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {commit.author} · {commit.date}
                  </p>
                </div>
                <Badge variant="outline" className={TYPE_COLORS[commit.type] ?? ""}>
                  {commit.type}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pull Requests</CardTitle>
            <CardDescription>代码审核状态</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {prs.map((pr) => {
              const status = PR_STATUS[pr.status] ?? { label: pr.status, variant: "secondary" as const };
              return (
                <div key={pr.id} className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{pr.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {pr.author} · {pr.updatedAt}
                    </p>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>计划任务</CardTitle>
          <CardDescription>
            {completedTasks} / {tasks.length} 已完成
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 text-sm">
              <CheckCircle2
                className={`h-4 w-4 shrink-0 ${task.completed ? "text-green-600" : "text-muted-foreground"}`}
                aria-hidden="true"
              />
              <span className={task.completed ? "text-muted-foreground line-through" : ""}>{task.title}</span>
              <span className="ml-auto text-xs text-muted-foreground">{task.dueDate}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}