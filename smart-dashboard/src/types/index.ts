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

export type MemberRole = "member" | "admin" | "developer" | "viewer";

export interface Member {
  id: string;
  team_id: string;
  name: string;
  email: string;
  role: MemberRole;
  github_username: string | null;
  created_at: string;
  updated_at: string;
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