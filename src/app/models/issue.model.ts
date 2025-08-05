export interface Issue {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status?: string;
  priority?: string;
  issueType?: string;
  assignee?: string;
  reporter?: string;
  projectKey?: string;
  projectName?: string;
  created?: string;
  updated?: string;
  resolution?: string;
  labels?: string[]
  votes?: number
  watchers?: number

}

export interface IssuesResponse {
  success: boolean;
  message: string;
  count: number;
  startAt?: number;
  maxResults?: number;
  issues: Issue[];
}

export interface IssueStats {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  myIssues: number;
  recentIssues: Issue[];
}

export interface IssueFilters {
  projectKey?: string;
  status?: string;
  assignee?: string;
  priority?: string;
  searchTerm?: string;
  startAt?: number;
  maxResults?: number;
}
export interface JiraApiResponse<T> {
  success: boolean
  message?: string
  issues?: T[]
  issue?: T
}
