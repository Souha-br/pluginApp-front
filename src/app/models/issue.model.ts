// Modèle pour les tickets Jira
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
}

// Réponse API pour les tickets
export interface IssuesResponse {
  success: boolean;
  message: string;
  count: number;
  startAt?: number;
  maxResults?: number;
  issues: Issue[];
}

// Statistiques des tickets
export interface IssueStats {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  myIssues: number;
  recentIssues: Issue[];
}

// Filtres pour les tickets
export interface IssueFilters {
  projectKey?: string;
  status?: string;
  assignee?: string;
  priority?: string;
  searchTerm?: string;
  startAt?: number;
  maxResults?: number;
}
