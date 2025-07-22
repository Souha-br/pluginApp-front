import { Component, type OnInit, type OnDestroy } from "@angular/core"
import { Router } from "@angular/router"
import { Subject, debounceTime, distinctUntilChanged } from "rxjs"
import { takeUntil } from "rxjs/operators"
import { Project } from "src/app/models/project.model"
import { Issue } from "src/app/models/issue.model"
import { JiraService } from "src/app/service/jira.service"

@Component({
  selector: "app-projects",
  templateUrl: "./projects.component.html",
  styleUrls: ["./projects.component.scss"],
})
export class ProjectsComponent implements OnInit, OnDestroy {
  projects: Project[] = []
  filteredProjects: Project[] = []
  loading = true
  error = false
  errorMessage = ""
  searchTerm = ""
  selectedCategory = ""
  selectedLead = ""
  sortBy = "name"
  sortDirection: "asc" | "desc" = "asc"

  // Options de filtrage
  categories: string[] = []
  leads: string[] = []

  // Pagination
  currentPage = 1
  itemsPerPage = 12
  totalPages = 1

  // Recherche avec debounce
  private searchSubject = new Subject<string>()
  private destroy$ = new Subject<void>()

  // Vues
  viewMode: "grid" | "list" = "grid"

  // Gestion des tickets du projet sélectionné
  selectedProject: Project | null = null
  projectIssues: Issue[] = []
  loadingIssues = false

  constructor(
    private jiraService: JiraService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.setupSearchDebounce()
    this.loadProjects()
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.performSearch(searchTerm)
      })
  }

  private loadProjects(): void {
    this.loading = true
    this.error = false
    this.jiraService
      .getAllProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false
          if (response.success) {
            this.projects = response.projects
            this.extractFilterOptions()
            this.applyFilters()
          } else {
            this.error = true
            this.errorMessage = response.message
          }
        },
        error: (error) => {
          this.loading = false
          this.error = true
          this.errorMessage = "Erreur lors du chargement des projets"
          console.error("Erreur:", error)
        },
      })
  }

  private extractFilterOptions(): void {
    // Catégories uniques en filtrant les valeurs undefined
    this.categories = [
      ...new Set(
        this.projects
          .map((p) => p.categoryName)
          .filter((categoryName): categoryName is string => Boolean(categoryName)),
      ),
    ].sort()

    // Responsables uniques en filtrant les valeurs undefined
    this.leads = [
      ...new Set(this.projects.map((p) => p.leadName).filter((leadName): leadName is string => Boolean(leadName))),
    ].sort()
  }

  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm
    this.searchSubject.next(searchTerm)
  }

  private performSearch(searchTerm: string): void {
    this.currentPage = 1
    this.applyFilters()
  }

  applyFilters(): void {
    let filtered = [...this.projects]

    // Filtre par terme de recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(term) ||
          project.key.toLowerCase().includes(term) ||
          (project.description && project.description.toLowerCase().includes(term)),
      )
    }

    // Filtre par catégorie
    if (this.selectedCategory) {
      filtered = filtered.filter((project) => project.categoryName === this.selectedCategory)
    }

    // Filtre par responsable
    if (this.selectedLead) {
      filtered = filtered.filter((project) => project.leadName === this.selectedLead)
    }

    // Tri
    filtered = this.sortProjects(filtered)

    // Mise à jour des résultats
    this.filteredProjects = filtered
    this.updatePagination()
  }

  private sortProjects(projects: Project[]): Project[] {
    return projects.sort((a, b) => {
      let valueA: string
      let valueB: string

      switch (this.sortBy) {
        case "name":
          valueA = a.name.toLowerCase()
          valueB = b.name.toLowerCase()
          break
        case "key":
          valueA = a.key.toLowerCase()
          valueB = b.key.toLowerCase()
          break
        case "category":
          valueA = (a.categoryName || "").toLowerCase()
          valueB = (b.categoryName || "").toLowerCase()
          break
        case "lead":
          valueA = (a.leadName || "").toLowerCase()
          valueB = (b.leadName || "").toLowerCase()
          break
        default:
          valueA = a.name.toLowerCase()
          valueB = b.name.toLowerCase()
      }

      const comparison = valueA.localeCompare(valueB)
      return this.sortDirection === "asc" ? comparison : -comparison
    })
  }

  onSortChange(sortBy: string): void {
    if (this.sortBy === sortBy) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc"
    } else {
      this.sortBy = sortBy
      this.sortDirection = "asc"
    }
    this.applyFilters()
  }

  onCategoryChange(): void {
    this.currentPage = 1
    this.applyFilters()
  }

  onLeadChange(): void {
    this.currentPage = 1
    this.applyFilters()
  }

  clearFilters(): void {
    this.searchTerm = ""
    this.selectedCategory = ""
    this.selectedLead = ""
    this.currentPage = 1
    this.applyFilters()
  }

  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProjects.length / this.itemsPerPage)
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1
    }
  }

  get paginatedProjects(): Project[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    return this.filteredProjects.slice(startIndex, endIndex)
  }

  get pageNumbers(): number[] {
    const pages: number[] = []
    const maxVisiblePages = 5
    const halfVisible = Math.floor(maxVisiblePages / 2)

    let startPage = Math.max(1, this.currentPage - halfVisible)
    const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page
    }
  }

  // NOUVELLE FONCTIONNALITÉ : Sélection d'un projet pour voir ses tickets
  selectProject(project: Project): void {
    this.selectedProject = project
    this.loadProjectIssues(project.key)
  }

  // NOUVELLE FONCTIONNALITÉ : Chargement des tickets d'un projet
  private loadProjectIssues(projectKey: string): void {
    this.loadingIssues = true
    this.projectIssues = []

    this.jiraService
      .getIssuesByProject(projectKey)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadingIssues = false
          if (response.success) {
            this.projectIssues = response.issues || []
          } else {
            console.error("Erreur lors du chargement des tickets:", response.message)
            this.projectIssues = []
          }
        },
        error: (error) => {
          this.loadingIssues = false
          console.error("Erreur lors du chargement des tickets:", error)
          this.projectIssues = []
        },
      })
  }

  // NOUVELLE FONCTIONNALITÉ : Fermeture du panneau des tickets
  closeProjectIssues(): void {
    this.selectedProject = null
    this.projectIssues = []
  }

  // Méthodes pour les couleurs des avatars (style Jira)
  getProjectColor(projectKey: string): string {
    const colors = [
      "#0052cc", // Bleu Jira
      "#00875a", // Vert Jira
      "#ff5630", // Rouge Jira
      "#ff8b00", // Orange Jira
      "#6554c0", // Violet Jira
      "#00b8d9", // Cyan Jira
    ]

    // Utilise le hash du projectKey pour une couleur consistante
    let hash = 0
    for (let i = 0; i < projectKey.length; i++) {
      hash = projectKey.charCodeAt(i) + ((hash << 5) - hash)
    }

    return colors[Math.abs(hash) % colors.length]
  }

  getProjectTypeColor(categoryName: string | undefined): string {
    if (!categoryName) return "#00875a" // Vert par défaut

    const typeColors: { [key: string]: string } = {
      développement: "#0052cc",
      marketing: "#ff8b00",
      infrastructure: "#6554c0",
      data: "#00b8d9",
      design: "#ff5630",
    }

    return typeColors[categoryName.toLowerCase()] || "#00875a"
  }

  // NOUVELLE MÉTHODE : Redirection vers les tickets du projet
  navigateToProjectIssues(projectKey: string): void {
    console.log("Navigation vers les tickets du projet:", projectKey)
    this.router
      .navigate(["/issues"], {
        queryParams: { project: projectKey },
        state: { fromProjects: true },
      })
      .then((success) => {
        if (success) {
          console.log("Navigation réussie vers /issues avec projet:", projectKey)
        } else {
          console.error("Échec de la navigation vers /issues")
        }
      })
      .catch((error) => {
        console.error("Erreur lors de la navigation:", error)
      })
  }

  // ANCIENNE MÉTHODE : Redirection vers les tickets du projet (DÉPRÉCIÉE)
  viewProjectIssues(projectKey: string): void {
    // Utilise la nouvelle méthode
    this.navigateToProjectIssues(projectKey)
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === "grid" ? "list" : "grid"
  }

  refreshProjects(): void {
    this.loadProjects()
  }

  goBack(): void {
    this.router.navigate(["/dashboard"])
  }

  // MÉTHODES UTILITAIRES POUR LES TICKETS
  getIssueTypeIcon(issueType: string | undefined): string {
    if (!issueType) return "T"

    switch (issueType.toLowerCase()) {
      case "bug":
        return "B"
      case "story":
        return "S"
      case "epic":
        return "E"
      case "task":
      default:
        return "T"
    }
  }

  getIssueTypeClass(issueType: string | undefined): string {
    if (!issueType) return "task"

    switch (issueType.toLowerCase()) {
      case "bug":
        return "bug"
      case "story":
        return "story"
      case "epic":
        return "epic"
      case "task":
      default:
        return "task"
    }
  }

  getPriorityClass(priority: string | undefined): string {
    if (!priority) return "medium"

    switch (priority.toLowerCase()) {
      case "highest":
        return "highest"
      case "high":
        return "high"
      case "medium":
        return "medium"
      case "low":
        return "low"
      case "lowest":
        return "lowest"
      default:
        return "medium"
    }
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return "open"

    switch (status.toLowerCase()) {
      case "terminé":
      case "done":
        return "done"
      case "en cours":
      case "in progress":
        return "in-progress"
      case "à faire":
      case "to do":
        return "to-do"
      case "bloqué":
      case "blocked":
        return "blocked"
      default:
        return "open"
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return "N/A"

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return "N/A"
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
