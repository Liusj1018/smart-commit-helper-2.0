import type { Commit, PullRequest, Member, PlanTask, OverviewStats } from "@/types";
export type { CommitType } from "@/types";
import type { CommitType } from "@/types";

const MEMBERS: Member[] = [
  {
    id: "1",
    name: "Alice Chen",
    avatar: "AC",
    role: "Tech Lead",
    commitsThisWeek: 23,
    totalCommits: 342,
    activeDays: 5,
    heatmap: [3, 5, 2, 8, 4, 1, 0, 6, 7, 3, 5, 2, 8, 4, 1, 0, 6, 7, 3, 5, 2, 8, 4, 1, 0, 6, 7, 3],
  },
  {
    id: "2",
    name: "Bob Wang",
    avatar: "BW",
    role: "Frontend Dev",
    commitsThisWeek: 18,
    totalCommits: 256,
    activeDays: 4,
    heatmap: [2, 4, 1, 6, 3, 0, 0, 5, 6, 2, 4, 1, 6, 3, 0, 0, 5, 6, 2, 4, 1, 6, 3, 0, 0, 5, 6, 2],
  },
  {
    id: "3",
    name: "Carol Li",
    avatar: "CL",
    role: "Backend Dev",
    commitsThisWeek: 15,
    totalCommits: 198,
    activeDays: 5,
    heatmap: [4, 3, 5, 2, 1, 0, 0, 4, 3, 4, 3, 5, 2, 1, 0, 0, 4, 3, 4, 3, 5, 2, 1, 0, 0, 4, 3, 4],
  },
  {
    id: "4",
    name: "David Zhang",
    avatar: "DZ",
    role: "DevOps",
    commitsThisWeek: 9,
    totalCommits: 134,
    activeDays: 3,
    heatmap: [1, 2, 0, 3, 2, 1, 0, 1, 2, 1, 2, 0, 3, 2, 1, 0, 1, 2, 1, 2, 0, 3, 2, 1, 0, 1, 2, 1],
  },
];

const COMMITS: Commit[] = [
  { id: "1", hash: "a1b2c3d", message: "feat(dashboard): add overview cards", author: "Alice Chen", authorId: "1", type: "feat", date: "2026-08-07", additions: 142, deletions: 23 },
  { id: "2", hash: "e4f5g6h", message: "fix(auth): resolve token refresh bug", author: "Bob Wang", authorId: "2", type: "fix", date: "2026-08-07", additions: 18, deletions: 45 },
  { id: "3", hash: "i7j8k9l", message: "docs(readme): update setup instructions", author: "Carol Li", authorId: "3", type: "docs", date: "2026-08-06", additions: 34, deletions: 12 },
  { id: "4", hash: "m0n1o2p", message: "refactor(api): simplify data fetching layer", author: "Alice Chen", authorId: "1", type: "refactor", date: "2026-08-06", additions: 89, deletions: 156 },
  { id: "5", hash: "q3r4s5t", message: "feat(commits): add type distribution chart", author: "Bob Wang", authorId: "2", type: "feat", date: "2026-08-05", additions: 201, deletions: 8 },
  { id: "6", hash: "u6v7w8x", message: "chore(deps): upgrade next.js to 16", author: "David Zhang", authorId: "4", type: "chore", date: "2026-08-05", additions: 1245, deletions: 1198 },
  { id: "7", hash: "y9z0a1b", message: "test(utils): add unit tests for cn helper", author: "Carol Li", authorId: "3", type: "test", date: "2026-08-04", additions: 67, deletions: 0 },
  { id: "8", hash: "c2d3e4f", message: "fix(heatmap): correct week boundary calculation", author: "Alice Chen", authorId: "1", type: "fix", date: "2026-08-04", additions: 23, deletions: 19 },
  { id: "9", hash: "g5h6i7j", message: "style(global): adjust dark mode contrast", author: "Bob Wang", authorId: "2", type: "style", date: "2026-08-03", additions: 15, deletions: 15 },
  { id: "10", hash: "k8l9m0n", message: "perf(charts): memoize chart data computation", author: "Carol Li", authorId: "3", type: "perf", date: "2026-08-03", additions: 34, deletions: 28 },
];

const PULL_REQUESTS: PullRequest[] = [
  { id: "1", title: "feat: add member heatmap component", author: "Alice Chen", status: "pending", createdAt: "2026-08-07", updatedAt: "2026-08-07", reviewers: ["Bob Wang", "Carol Li"] },
  { id: "2", title: "fix: resolve login redirect loop", author: "Bob Wang", status: "approved", createdAt: "2026-08-06", updatedAt: "2026-08-07", reviewers: ["Alice Chen"] },
  { id: "3", title: "refactor: extract shared card component", author: "Carol Li", status: "merged", createdAt: "2026-08-05", updatedAt: "2026-08-06", reviewers: ["Alice Chen", "David Zhang"] },
  { id: "4", title: "chore: configure ci pipeline", author: "David Zhang", status: "changes_requested", createdAt: "2026-08-04", updatedAt: "2026-08-05", reviewers: ["Alice Chen"] },
  { id: "5", title: "feat: add plan mode tracking", author: "Alice Chen", status: "pending", createdAt: "2026-08-07", updatedAt: "2026-08-07", reviewers: ["Carol Li"] },
];

const PLAN_TASKS: PlanTask[] = [
  { id: "1", title: "Design dashboard layout", completed: true, assignee: "Alice Chen", dueDate: "2026-08-01" },
  { id: "2", title: "Implement commit type chart", completed: true, assignee: "Bob Wang", dueDate: "2026-08-03" },
  { id: "3", title: "Build member heatmap", completed: true, assignee: "Carol Li", dueDate: "2026-08-05" },
  { id: "4", title: "Add PR status tracking", completed: false, assignee: "David Zhang", dueDate: "2026-08-08" },
  { id: "5", title: "Implement login page", completed: false, assignee: "Bob Wang", dueDate: "2026-08-09" },
  { id: "6", title: "Security audit", completed: false, assignee: "Alice Chen", dueDate: "2026-08-10" },
  { id: "7", title: "Deploy to Vercel", completed: false, assignee: "David Zhang", dueDate: "2026-08-10" },
  { id: "8", title: "Performance optimization", completed: false, assignee: "Carol Li", dueDate: "2026-08-11" },
];

export async function getOverviewStats(): Promise<OverviewStats> {
  return {
    totalCommits: COMMITS.length,
    openPRs: PULL_REQUESTS.filter((pr) => pr.status === "pending").length,
    avgReviewTime: "4.2h",
    planCompletion: Math.round((PLAN_TASKS.filter((t) => t.completed).length / PLAN_TASKS.length) * 100),
  };
}

export async function getAllCommits(): Promise<Commit[]> {
  return COMMITS;
}

export async function getPullRequests(): Promise<PullRequest[]> {
  return PULL_REQUESTS;
}

export async function getMembers(): Promise<Member[]> {
  return MEMBERS;
}

export async function getMemberById(id: string): Promise<Member | undefined> {
  return MEMBERS.find((m) => m.id === id);
}

export async function getPlanTasks(): Promise<PlanTask[]> {
  return PLAN_TASKS;
}

export async function getCommitTypeDistribution(): Promise<{ type: string; count: number }[]> {
  const typeMap = new Map<string, number>();
  for (const commit of COMMITS) {
    typeMap.set(commit.type, (typeMap.get(commit.type) ?? 0) + 1);
  }
  return Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }));
}

// ─── AI 工具用同步数据接口 ───────────────────────────────────────────

export interface ToolCommit {
  sha: string;
  type: CommitType;
  scope: string | null;
  message: string;
  authorName: string;
  date: string;
}

export interface ToolStats {
  totalCommits: number;
  totalPRs: number;
  avgReviewHours: number;
  completionRate: number;
  commitTypeDistribution: { type: string; count: number }[];
}

function parseScope(message: string): string | null {
  const match = message.match(/^[a-z]+(?:\(([^)]+)\))?:/);
  return match ? match[1] : null;
}

const TOOL_COMMITS: ToolCommit[] = COMMITS.map((c) => ({
  sha: c.hash,
  type: c.type,
  scope: parseScope(c.message),
  message: c.message,
  authorName: c.author,
  date: c.date,
}));

export function getCommits(filter?: {
  author?: string;
  type?: CommitType;
  limit?: number;
}): ToolCommit[] {
  let list = TOOL_COMMITS;
  if (filter?.author) {
    const kw = filter.author.toLowerCase();
    list = list.filter((c) => c.authorName.toLowerCase().includes(kw));
  }
  if (filter?.type) {
    list = list.filter((c) => c.type === filter.type);
  }
  const limit = filter?.limit ?? 10;
  return list.slice(0, limit);
}

export function getStats(): ToolStats {
  const typeMap = new Map<string, number>();
  for (const c of TOOL_COMMITS) {
    typeMap.set(c.type, (typeMap.get(c.type) ?? 0) + 1);
  }
  const completedTasks = PLAN_TASKS.filter((t) => t.completed).length;
  return {
    totalCommits: TOOL_COMMITS.length,
    totalPRs: PULL_REQUESTS.length,
    avgReviewHours: 4.2,
    completionRate: completedTasks / PLAN_TASKS.length,
    commitTypeDistribution: Array.from(typeMap.entries()).map(([type, count]) => ({ type, count })),
  };
}
