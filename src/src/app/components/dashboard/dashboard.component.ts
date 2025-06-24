import { Component, type OnInit, type OnDestroy } from "@angular/core"
import { Router } from "@angular/router"
import { Subject } from "rxjs"
import { takeUntil } from "rxjs/operators"
import type { ProjectStats } from "../../models/project.model"
import type { IssueStats } from "../../models/issue.model"
import { JiraService } from "src/app/service/jira.service"

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit, OnDestroy {
  // ========== ÉTAPE 2.1: PROPRIÉTÉS DE DONNÉES ==========

  // Statistiques
  projectStats: ProjectStats = {
    totalProjects: 0,
    activeProjects: 0,
    recentProjects: [],
  }

  issueStats: IssueStats = {
    totalIssues: 0,
    openIssues: 0,
    inProgressIssues: 0,
    resolvedIssues: 0,
    myIssues: 0,
    recentIssues: [],
  }

  // États de l'interface
  loading = {
    projects: true,
    issues: true,
    overall: true,
  }

  error = {
    projects: false,
    issues: false,
    message: "",
  }

  // Gestion des subscriptions
  private destroy$ = new Subject<void>()

  constructor(
    private jiraService: JiraService,
    private router: Router,
  ) {}

  /**
   * Méthode de debug pour diagnostiquer les problèmes API
   */
  private debugApiCalls(): void {
    console.log("🔍 Debug: Vérification du token")
    const token = localStorage.getItem("jwt")
    console.log("Token présent:", !!token)

    if (token) {
      console.log("Token (premiers caractères):", token.substring(0, 20) + "...")
    }

    console.log("🔍 Debug: Test de connectivité API")
    this.jiraService.testApiConnection().subscribe((isConnected) => {
      console.log("API accessible:", isConnected)
    })
  }

  /**
   * ÉTAPE 2.2: INITIALISATION DU COMPOSANT
   * Charge toutes les données nécessaires au dashboard
   */
  ngOnInit(): void {
    this.debugApiCalls() // Ajoutez cette ligne
    this.initializeDashboard()
  }

  /**
   * ÉTAPE 2.3: CHARGEMENT INITIAL DES DONNÉES
   * Utilise combineLatest pour charger projets et tickets en parallèle
   */
  private initializeDashboard(): void {
    this.loading.overall = true

    // Chargement des projets
    this.jiraService
      .getAllProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.projects = false
          if (response.success) {
            this.loadProjectStats()
          } else {
            this.error.projects = true
            this.error.message = response.message
          }
        },
        error: (error) => {
          this.loading.projects = false
          this.error.projects = true
          this.error.message = "Erreur lors du chargement des projets"
          console.error("Erreur projets:", error)
        },
      })

    // Chargement des tickets
    this.jiraService
      .getAllIssues(0, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.issues = false
          if (response.success) {
            this.loadIssueStats()
          } else {
            this.error.issues = true
            this.error.message = response.message
          }
        },
        error: (error) => {
          this.loading.issues = false
          this.error.issues = true
          this.error.message = "Erreur lors du chargement des tickets"
          console.error("Erreur tickets:", error)
        },
        complete: () => {
          this.loading.overall = false
        },
      })
  }

  /**
   * ÉTAPE 2.4: CHARGEMENT DES STATISTIQUES PROJETS
   * Utilise les observables réactifs du service
   */
  private loadProjectStats(): void {
    this.jiraService
      .getProjectStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe((stats) => {
        this.projectStats = stats
      })
  }

  /**
   * ÉTAPE 2.5: CHARGEMENT DES STATISTIQUES TICKETS
   * Calcule les métriques en temps réel
   */
  private loadIssueStats(): void {
    this.jiraService
      .getIssueStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe((stats) => {
        this.issueStats = stats
      })
  }

  /**
   * ÉTAPE 2.6: MÉTHODES DE NAVIGATION
   * Navigation vers les différentes sections avec état
   */
  navigateToProjects(): void {
    this.router.navigate(["/projects"], {
      state: { fromDashboard: true },
    })
  }

  navigateToIssues(): void {
    this.router.navigate(["/issues"], {
      state: { fromDashboard: true },
    })
  }

  navigateToMyIssues(): void {
    this.router.navigate(["/issues"], {
      queryParams: { assignee: "currentUser" },
      state: { fromDashboard: true },
    })
  }

  /**
   * ÉTAPE 2.7: MÉTHODES UTILITAIRES POUR L'AFFICHAGE
   */

  // Calcul du pourcentage de progression
  getProgressPercentage(): number {
    if (this.issueStats.totalIssues === 0) return 0
    return Math.round((this.issueStats.resolvedIssues / this.issueStats.totalIssues) * 100)
  }

  // Couleur du statut
  getStatusColor(status?: string): string {
    if (!status) return "#6b7280"

    const statusColors: { [key: string]: string } = {
      done: "#10b981",
      closed: "#10b981",
      resolved: "#10b981",
      "in progress": "#f59e0b",
      "in review": "#f59e0b",
      testing: "#f59e0b",
      "to do": "#ef4444",
      open: "#ef4444",
      new: "#ef4444",
    }

    return statusColors[status.toLowerCase()] || "#6b7280"
  }

  // Couleur de la priorité
  getPriorityColor(priority?: string): string {
    if (!priority) return "#6b7280"

    const priorityColors: { [key: string]: string } = {
      highest: "#dc2626",
      critical: "#dc2626",
      high: "#ea580c",
      medium: "#d97706",
      low: "#65a30d",
      lowest: "#059669",
    }

    return priorityColors[priority.toLowerCase()] || "#6b7280"
  }

  // Formatage des dates
  formatDate(dateString?: string): string {
    if (!dateString) return "N/A"

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return "Date invalide"
    }
  }

  // Formatage relatif des dates
  getRelativeTime(dateString?: string): string {
    if (!dateString) return "N/A"

    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

      if (diffInHours < 1) return "Il y a moins d'une heure"
      if (diffInHours < 24) return `Il y a ${diffInHours} heure(s)`

      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays < 7) return `Il y a ${diffInDays} jour(s)`

      return this.formatDate(dateString)
    } catch {
      return "Date invalide"
    }
  }

  /**
   * ÉTAPE 2.8: ACTIONS UTILISATEUR
   */

  // Rafraîchissement des données
  refreshData(): void {
    this.loading.overall = true
    this.error.projects = false
    this.error.issues = false
    this.initializeDashboard()
  }

  // Déconnexion
  logout(): void {
    // ✅ Utiliser la même clé que JwtService
    localStorage.removeItem("jwt")
    localStorage.removeItem("currentUser")
    this.router.navigate(["/login"])
  }

  /**
   * ÉTAPE 2.9: NETTOYAGE DES RESSOURCES
   */
  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
