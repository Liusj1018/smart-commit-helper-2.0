"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  GitPullRequest,
  Plus,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  User,
} from "lucide-react";

interface Review {
  id: string;
  reviewer: string;
  reviewerGroup: number;
  action: "approved" | "changes_requested" | "comment";
  comment: string;
  createdAt: string;
}

interface PR {
  id: string;
  title: string;
  description: string;
  author: string;
  authorGroup: number;
  status: "pending" | "approved" | "changes_requested";
  createdAt: string;
  reviews: Review[];
}

const GROUPS = [
  { id: 1, name: "第一小组", description: "前端开发组", color: "border-blue-200 bg-blue-50/30", accent: "bg-blue-500", textColor: "text-blue-600" },
  { id: 2, name: "第二小组", description: "后端开发组", color: "border-green-200 bg-green-50/30", accent: "bg-green-500", textColor: "text-green-600" },
  { id: 3, name: "第三小组", description: "测试与运维组", color: "border-purple-200 bg-purple-50/30", accent: "bg-purple-500", textColor: "text-purple-600" },
];

const INITIAL_PRS: PR[] = [
  { id: "pr-1", title: "feat: 添加成员热力图组件", description: "实现了成员提交热力图，支持按周查看提交活跃度。", author: "Alice Chen", authorGroup: 1, status: "pending", createdAt: "2026-08-07 10:30", reviews: [{ id: "r1", reviewer: "Bob Wang", reviewerGroup: 2, action: "comment", comment: "组件性能不错，建议加个 loading 状态。", createdAt: "2026-08-07 14:20" }] },
  { id: "pr-2", title: "fix: 修复登录重定向循环", description: "Token 刷新逻辑存在竞态条件，导致无限重定向。", author: "Bob Wang", authorGroup: 2, status: "approved", createdAt: "2026-08-06 09:15", reviews: [{ id: "r2", reviewer: "Alice Chen", reviewerGroup: 1, action: "approved", comment: "修复方案合理，已验证通过。", createdAt: "2026-08-07 11:00" }] },
  { id: "pr-3", title: "refactor: 提取共享卡片组件", description: "将重复的卡片样式抽取为通用组件。", author: "Carol Li", authorGroup: 3, status: "changes_requested", createdAt: "2026-08-05 16:00", reviews: [{ id: "r3", reviewer: "David Zhang", reviewerGroup: 2, action: "changes_requested", comment: "Props 类型定义需要补充文档。", createdAt: "2026-08-06 10:30" }] },
  { id: "pr-4", title: "feat: 添加计划模式追踪", description: "支持任务计划的创建、更新和完成状态追踪。", author: "Alice Chen", authorGroup: 1, status: "pending", createdAt: "2026-08-07 15:45", reviews: [] },
  { id: "pr-5", title: "chore: 配置 CI 流水线", description: "添加 GitHub Actions 用于自动测试和部署。", author: "David Zhang", authorGroup: 2, status: "pending", createdAt: "2026-08-04 11:20", reviews: [{ id: "r4", reviewer: "Carol Li", reviewerGroup: 3, action: "comment", comment: "建议增加缓存步骤加快构建。", createdAt: "2026-08-05 09:00" }] },
];

const STATUS_MAP = {
  pending: { label: "待审核", icon: Clock, color: "text-yellow-600 bg-yellow-50" },
  approved: { label: "已批准", icon: CheckCircle2, color: "text-green-600 bg-green-50" },
  changes_requested: { label: "需修改", icon: XCircle, color: "text-red-600 bg-red-50" },
};

const ACTION_MAP = {
  approved: { label: "批准", icon: CheckCircle2, color: "text-green-600" },
  changes_requested: { label: "请求修改", icon: XCircle, color: "text-red-600" },
  comment: { label: "评论", icon: MessageSquare, color: "text-blue-600" },
};

function nowStr() {
  return new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function PullRequestsPage() {
  const [prs, setPrs] = useState<PR[]>(INITIAL_PRS);
  const [expandedPr, setExpandedPr] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState<Record<number, string>>({ 1: "", 2: "", 3: "" });
  const [newDesc, setNewDesc] = useState<Record<number, string>>({ 1: "", 2: "", 3: "" });
  const [newAuthor, setNewAuthor] = useState<Record<number, string>>({ 1: "", 2: "", 3: "" });
  const [comments, setComments] = useState<Record<string, string>>({});
  const [reviewerGroup, setReviewerGroup] = useState(1);

  function createPr(gid: number) {
    const title = newTitle[gid]?.trim();
    const author = newAuthor[gid]?.trim();
    if (!title || !author) return;
    const pr: PR = {
      id: `pr-${Date.now()}`, title, description: newDesc[gid]?.trim() || "无描述",
      author, authorGroup: gid, status: "pending", createdAt: nowStr(), reviews: [],
    };
    setPrs((p) => [pr, ...p]);
    setNewTitle((p) => ({ ...p, [gid]: "" }));
    setNewDesc((p) => ({ ...p, [gid]: "" }));
    setNewAuthor((p) => ({ ...p, [gid]: "" }));
  }

  function review(prId: string, action: Review["action"]) {
    const text = comments[prId]?.trim();
    const r: Review = {
      id: `r-${Date.now()}`, reviewer: `${GROUPS[reviewerGroup - 1].name}成员`, reviewerGroup,
      action, comment: text || (action === "approved" ? "LGTM" : action === "changes_requested" ? "需要修改" : ""),
      createdAt: nowStr(),
    };
    setPrs((prev) => prev.map((pr) => {
      if (pr.id !== prId) return pr;
      const status = action === "approved" ? "approved" : action === "changes_requested" ? "changes_requested" : pr.status;
      return { ...pr, reviews: [...pr.reviews, r], status };
    }));
    setComments((p) => ({ ...p, [prId]: "" }));
  }

  const pendingCount = prs.filter((p) => p.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard" aria-label="返回仪表盘"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">PR 审查</h1>
          <p className="text-muted-foreground">共 {prs.length} 个 PR · {pendingCount} 个待审核 · 三个小组可互相审查</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">当前身份：</label>
          <select className="rounded-md border border-input bg-background px-2 py-1 text-sm" value={reviewerGroup} onChange={(e) => setReviewerGroup(Number(e.target.value))}>
            {GROUPS.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
          </select>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">小组 PR 提交区</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {GROUPS.map((g) => (
            <Card key={g.id} className={`${g.color} border-2`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${g.accent}`} />
                  <CardTitle className="text-base font-semibold">{g.name}</CardTitle>
                </div>
                <CardDescription>{g.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input placeholder="提交人姓名" value={newAuthor[g.id] ?? ""} onChange={(e) => setNewAuthor((p) => ({ ...p, [g.id]: e.target.value }))} />
                <Input placeholder="PR 标题" value={newTitle[g.id] ?? ""} onChange={(e) => setNewTitle((p) => ({ ...p, [g.id]: e.target.value }))} />
                <textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="PR 描述（可选）" value={newDesc[g.id] ?? ""} onChange={(e) => setNewDesc((p) => ({ ...p, [g.id]: e.target.value }))} />
                <Button className="w-full" size="sm" onClick={() => createPr(g.id)} disabled={!newTitle[g.id]?.trim() || !newAuthor[g.id]?.trim()}>
                  <Plus className="mr-2 h-4 w-4" />提交 PR
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold">PR 列表（跨组审查）</h2>
        {GROUPS.map((g) => {
          const list = prs.filter((p) => p.authorGroup === g.id);
          return (
            <div key={g.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${g.accent}`} />
                <h3 className="font-semibold">{g.name}</h3>
                <Badge variant="secondary">{list.length} 个 PR</Badge>
              </div>
              {list.length === 0 ? (
                <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">暂无 PR</CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {list.map((pr) => {
                    const si = STATUS_MAP[pr.status];
                    const SI = si.icon;
                    const open = expandedPr === pr.id;
                    const canReview = pr.authorGroup !== reviewerGroup;
                    return (
                      <Card key={pr.id} className="overflow-hidden">
                        <div className="cursor-pointer p-4 transition-colors hover:bg-muted/50" onClick={() => setExpandedPr(open ? null : pr.id)}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <GitPullRequest className={`h-4 w-4 shrink-0 ${g.textColor}`} />
                                <span className="font-medium">{pr.title}</span>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                <User className="mr-1 inline h-3 w-3" />{pr.author} · {pr.createdAt}
                                {pr.reviews.length > 0 && (<> · <MessageSquare className="mr-1 inline h-3 w-3" />{pr.reviews.length} 条审查</>)}
                              </p>
                            </div>
                            <Badge className={`${si.color} border-0`}><SI className="mr-1 h-3 w-3" />{si.label}</Badge>
                          </div>
                        </div>
                        {open && (
                          <CardContent className="border-t bg-muted/30 pt-4">
                            <p className="mb-4 text-sm">{pr.description}</p>
                            {pr.reviews.length > 0 && (
                              <div className="mb-4 space-y-2">
                                <h4 className="text-sm font-medium">审查记录</h4>
                                {pr.reviews.map((rv) => {
                                  const ai = ACTION_MAP[rv.action];
                                  const AI = ai.icon;
                                  const rg = GROUPS.find((x) => x.id === rv.reviewerGroup);
                                  return (
                                    <div key={rv.id} className="rounded-md border bg-background p-3">
                                      <div className="flex items-center gap-2 text-sm">
                                        <div className={`h-2 w-2 rounded-full ${rg?.accent}`} />
                                        <span className="font-medium">{rv.reviewer}</span>
                                        <span className="text-xs text-muted-foreground">({rg?.name})</span>
                                        <Badge variant="outline" className="ml-auto"><AI className={`mr-1 h-3 w-3 ${ai.color}`} />{ai.label}</Badge>
                                      </div>
                                      <p className="mt-1.5 text-sm text-muted-foreground">{rv.comment}</p>
                                      <p className="mt-1 text-xs text-muted-foreground">{rv.createdAt}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {canReview ? (
                              <div className="space-y-2">
                                <textarea className="flex min-h-[50px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="写审查意见..." value={comments[pr.id] ?? ""} onChange={(e) => setComments((p) => ({ ...p, [pr.id]: e.target.value }))} />
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" className="text-green-600" onClick={() => review(pr.id, "approved")}><CheckCircle2 className="mr-1 h-3.5 w-3.5" />批准</Button>
                                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => review(pr.id, "changes_requested")}><XCircle className="mr-1 h-3.5 w-3.5" />请求修改</Button>
                                  <Button size="sm" variant="outline" className="text-blue-600" onClick={() => review(pr.id, "comment")}><MessageSquare className="mr-1 h-3.5 w-3.5" />评论</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">这是你们小组的 PR，不能审查自己小组的 PR</div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}