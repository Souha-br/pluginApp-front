import { Component, type OnInit, type OnDestroy } from "@angular/core"
import { Router } from "@angular/router"
import { Subject } from "rxjs"
import { takeUntil } from "rxjs/operators"
import { ProjectStats } from "../../models/project.model"
import { Issue, IssueStats } from "../../models/issue.model"
import { JiraService } from "src/app/service/jira.service"

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit, OnDestroy {

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
  issues: Issue[] = []
  currentUser = "Jean Dupont" // Remplacez par la logique de récupération de l'utilisateur réel si disponible
  // Gestion des subscriptions
  private destroy$ = new Subject<void>()

  constructor(
    private jiraService: JiraService,
    private router: Router,
  ) {}
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

  ngOnInit(): void {
    this.debugApiCalls() // Ajoutez cette ligne
    this.initializeDashboard()
  }

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
            this.issues = response.issues || []
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
  private loadProjectStats(): void {
    this.jiraService
      .getProjectStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe((stats) => {
        this.projectStats = stats
      })
  }

  private loadIssueStats(): void {
    const total = this.issues.length
    const open = this.issues.filter(
      (issue) =>
        issue.status &&
        (issue.status.toLowerCase() === "to do" ||
          issue.status.toLowerCase() === "open" ||
          issue.status.toLowerCase() === "new"),
    ).length
    const inProgress = this.issues.filter(
      (issue) =>
        issue.status &&
        (issue.status.toLowerCase() === "in progress" ||
          issue.status.toLowerCase() === "en cours" ||
          issue.status.toLowerCase() === "in review" ||
          issue.status.toLowerCase() === "testing" ||
          issue.status.toLowerCase() === "progress"),
    ).length
    const resolved = this.issues.filter(
      (issue) =>
        issue.status &&
        (issue.status.toLowerCase() === "done" ||
          issue.status.toLowerCase() === "terminé" ||
          issue.status.toLowerCase() === "closed" ||
          issue.status.toLowerCase() === "resolved"),
    ).length
    // MODIFICATION ICI : Calcul de myIssues basé sur le rapporteur
    const my = this.issues.filter((issue) => issue.reporter === this.currentUser).length

    this.issueStats = {
      totalIssues: total,
      openIssues: open,
      inProgressIssues: inProgress,
      resolvedIssues: resolved,
      myIssues: my,
      recentIssues: this.issues.slice(0, 4), // Affiche les 4 premiers tickets comme récents
    }
  }

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
    // MODIFICATION ICI : Envoi du paramètre 'reporter' au lieu de 'assignee'
    this.router.navigate(["/issues"], {
      queryParams: { reporter: "currentUser" },
      state: { fromDashboard: true },
    })
  }

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

  onAddWidgetClick(): void {
    console.log("Ajouter des widgets cliqué !")
    alert("Fonctionnalité d'ajout de widgets en cours de développement !")
  }

  // Obtenir la classe CSS pour le type de ticket
  getIssueTypeClass(issueType?: string): string {
    if (!issueType) return "task"
    switch (issueType.toLowerCase()) {
      case "bug":
        return "bug"
      case "story":
      case "user story":
        return "story"
      case "epic":
        return "epic"
      case "task":
      default:
        return "task"
    }
  }

  // Obtenir l'icône pour le type de ticket
  getIssueTypeIcon(issueType?: string): string {
    if (!issueType) return "T"
    switch (issueType.toLowerCase()) {
      case "bug":
        return "B"
      case "story":
      case "user story":
        return "S"
      case "epic":
        return "E"
      case "task":
      default:
        return "T"
    }
  }

  // Obtenir la classe CSS pour la priorité
  getPriorityClass(priority?: string): string {
    if (!priority) return "medium"
    switch (priority.toLowerCase()) {
      case "highest":
      case "critical":
        return "highest"
      case "high":
        return "high"
      case "medium":
        return "medium"
      case "low":
      case "lowest":
        return "lowest"
      default:
        return "medium"
    }
  }

  // Obtenir la classe CSS pour le statut
  getStatusClass(status?: string): string {
    if (!status) return "open"
    switch (status.toLowerCase()) {
      case "done":
      case "closed":
      case "resolved":
      case "terminé":
        return "done"
      case "in progress":
      case "in review":
      case "testing":
      case "en cours":
      case "progress":
        return "in-progress"
      case "to do":
      case "open":
      case "new":
      case "ouvert":
      case "nouveau":
        return "open"
      case "blocked":
      case "bloqué":
      case "bloquer":
        return "blocked"
      case "review":
      case "révision":
      case "en attente du support":
        return "review"
      default:
        return "to-do"
    }
  }
  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
