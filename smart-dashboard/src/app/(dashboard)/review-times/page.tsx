import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPullRequests } from "@/lib/data";
import { ArrowLeft, Clock, GitPullRequest, Timer, Inbox } from "lucide-react";

export const metadata: Metadata = {
  title: "审核时间",
};

function formatDuration(hours: number): string {
  if (hours <= 0) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} 分钟`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h} 小时`;
  return `${h} 小时 ${m} 分钟`;
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

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getBarColor(hours: number, avg: number): string {
  if (hours <= 0) return "bg-gray-300";
  if (hours <= avg * 0.7) return "bg-green-500";
  if (hours <= avg * 1.3) return "bg-yellow-500";
  return "bg-red-500";
}

interface MemberReviewStats {
  name: string;
  reviewCount: number;
  totalHours: number;
  avgHours: number;
  minHours: number;
  maxHours: number;
  prs: { title: string; hours: number; createdAt: string }[];
}

export default async function ReviewTimesPage() {
  const prs = await getPullRequests();

  // Only consider reviewed PRs
  const reviewed = prs.filter((pr) => (pr.reviewTimeHours ?? 0) > 0);

  // Overall average
  const avgHours = reviewed.length > 0
    ? reviewed.reduce((sum, pr) => sum + (pr.reviewTimeHours ?? 0), 0) / reviewed.length
    : 0;

  // Aggregate by reviewer
  const memberMap = new Map<string, { hours: number; prs: { title: string; hours: number; createdAt: string }[] }>();
  for (const pr of reviewed) {
    const hours = pr.reviewTimeHours ?? 0;
    for (const reviewer of pr.reviewers) {
      const entry = memberMap.get(reviewer) ?? { hours: 0, prs: [] };
      entry.hours += hours;
      entry.prs.push({ title: pr.title, hours, createdAt: pr.createdAt });
      memberMap.set(reviewer, entry);
    }
  }

  const memberStats: MemberReviewStats[] = Array.from(memberMap.entries())
    .map(([name, data]) => {
      const hoursList = data.prs.map((p) => p.hours);
      return {
        name,
        reviewCount: data.prs.length,
        totalHours: data.hours,
        avgHours: data.hours / data.prs.length,
        minHours: Math.min(...hoursList),
        maxHours: Math.max(...hoursList),
        prs: data.prs.sort((a, b) => b.hours - a.hours),
      };
    })
    .sort((a, b) => b.reviewCount - a.reviewCount || a.name.localeCompare(b.name));

  const maxMemberAvg = Math.max(...memberStats.map((m) => m.avgHours), 1);

  return (
    <div className="space-y-6">
      {/* Header with back button, title, and overall average in top right */}
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard" aria-label="返回仪表盘">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">审核时间</h1>
          <p className="text-muted-foreground">每位成员的审核耗时详情</p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-card px-5 py-3 shadow-sm">
          <Timer className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs text-muted-foreground">总平均审核时间</p>
            <p className="text-2xl font-bold leading-tight">{formatDuration(avgHours)}</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">已审核 PR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewed.length}</div>
            <p className="text-xs text-muted-foreground">共 {prs.length} 个 PR</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">最快审核</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reviewed.length > 0 ? formatDuration(Math.min(...reviewed.map((p) => p.reviewTimeHours ?? 0))) : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">最慢审核</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {reviewed.length > 0 ? formatDuration(Math.max(...reviewed.map((p) => p.reviewTimeHours ?? 0))) : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-member review time sections */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">成员审核统计</h2>
        {memberStats.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <Inbox className="h-4 w-4" />
              暂无审核记录
            </CardContent>
          </Card>
        ) : (
          memberStats.map((member) => {
            const barWidth = (member.avgHours / maxMemberAvg) * 100;
            const barColor = getBarColor(member.avgHours, avgHours);

            return (
              <Card key={member.name} id={`member-${member.name}`} className="scroll-mt-20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white ${getAvatarColor(member.name)}`}
                    >
                      {getInitials(member.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-semibold">{member.name}</CardTitle>
                        <Badge variant="secondary">{member.reviewCount} 次审核</Badge>
                      </div>
                      <CardDescription>
                        平均 {formatDuration(member.avgHours)} · 最快 {formatDuration(member.minHours)} · 最慢 {formatDuration(member.maxHours)}
                      </CardDescription>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-2xl font-bold">{formatDuration(member.avgHours)}</p>
                      <p className="text-xs text-muted-foreground">平均审核耗时</p>
                    </div>
                  </div>
                  {/* Average time bar */}
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {member.prs.map((pr, idx) => (
                      <div
                        key={`${member.name}-${idx}`}
                        className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <GitPullRequest className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <span className="truncate text-sm font-medium">{pr.title}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            创建于 {pr.createdAt}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="flex items-center gap-1 text-sm font-semibold">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                            {formatDuration(pr.hours)}
                          </p>
                          <p className="text-xs text-muted-foreground">{pr.hours.toFixed(1)}h</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}