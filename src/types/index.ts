export type CommitType = "feat" | "fix" | "chore" | "docs" | "refactor" | "test" | "style" | "perf";

export interface Commit {
  id: string;
  hash: string;
  message: string;
  author: string;
  authorId: string;
  type: CommitType;
  date: string;
  additions: number;
  deletions: number;
}

export type PRStatus = "pending" | "approved" | "merged" | "changes_requested";

export interface PullRequest {
  id: string;
  title: string;
  author: string;
  status: PRStatus;
  createdAt: string;
  updatedAt: string;
  reviewers: string[];
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  role: string;
  commitsThisWeek: number;
  totalCommits: number;
  activeDays: number;
  heatmap: number[];
}

export interface PlanTask {
  id: string;
  title: string;
  completed: boolean;
  assignee: string;
  dueDate: string;
}

export interface OverviewStats {
  totalCommits: number;
  openPRs: number;
  avgReviewTime: string;
  planCompletion: number;
}