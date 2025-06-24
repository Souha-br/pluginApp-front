// Modèle pour les projets Jira
export interface Project {
  id: string;
  key: string;
  name: string;
  description?: string;
  url?: string;
  avatarUrl?: string;
  categoryName?: string;
  leadName?: string;
}

// Réponse API pour les projets
export interface ProjectsResponse {
  success: boolean;
  message: string;
  count: number;
  projects: Project[];
}

// Statistiques des projets
export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  recentProjects: Project[];
}
