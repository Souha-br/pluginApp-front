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
  currentPage = 1
  itemsPerPage = 12
  totalPages = 1
  private searchSubject = new Subject<string>()
  private destroy$ = new Subject<void>()
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
            this.applyFilters()
          } else {
            this.error = true
            this.errorMessage = response.message
          }
        },
        error: () => {
          this.loading = false
          this.error = true
          this.errorMessage = "Erreur lors du chargement des projets"
        },
      })
  }

  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm
    this.searchSubject.next(searchTerm)
  }

  private performSearch(_: string): void {
    this.currentPage = 1
    this.applyFilters()
  }

  applyFilters(): void {
    let filtered = [...this.projects]

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(term) ||
          project.key.toLowerCase().includes(term) ||
          (project.description && project.description.toLowerCase().includes(term)),
      )
    }

    filtered = this.sortProjects(filtered)
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
        default:
          valueA = a.name.toLowerCase()
          valueB = b.name.toLowerCase()
      }

      const comparison = valueA.localeCompare(valueB)
      return this.sortDirection === "asc" ? comparison : -comparison
    })
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

  selectProject(project: Project): void {
    this.selectedProject = project
    this.loadProjectIssues(project.key)
  }

  private loadProjectIssues(projectKey: string): void {
    this.loadingIssues = true
    this.projectIssues = []

    this.jiraService
      .getIssuesByProject(projectKey)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadingIssues = false
          this.projectIssues = response.success ? response.issues || [] : []
        },
        error: () => {
          this.loadingIssues = false
          this.projectIssues = []
        },
      })
  }

  closeProjectIssues(): void {
    this.selectedProject = null
    this.projectIssues = []
  }

  getProjectColor(projectKey: string): string {
    const colors = ["#0052cc", "#00875a", "#ff5630", "#ff8b00", "#6554c0", "#00b8d9"]
    let hash = 0
    for (let i = 0; i < projectKey.length; i++) {
      hash = projectKey.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  getProjectTypeColor(categoryName: string | undefined): string {
    if (!categoryName) return "#00875a"
    const typeColors: { [key: string]: string } = {
      développement: "#0052cc",
      marketing: "#ff8b00",
      infrastructure: "#6554c0",
      data: "#00b8d9",
      design: "#ff5630",
    }
    return typeColors[categoryName.toLowerCase()] || "#00875a"
  }

  navigateToProjectIssues(projectKey: string): void {
    this.router.navigate(["/issues"], {
      queryParams: { project: projectKey },
      state: { fromProjects: true },
    })
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
  goBack(): void {
  this.router.navigate(["/dashboard"])
}

refreshProjects(): void {
  this.loadProjects()
}

getIssueTypeClass(issueType: string | undefined): string {
  if (!issueType) return "task"
  switch (issueType.toLowerCase()) {
    case "bug": return "bug"
    case "story": return "story"
    case "epic": return "epic"
    case "task":
    default: return "task"
  }
}

getIssueTypeIcon(issueType: string | undefined): string {
  if (!issueType) return "T"
  switch (issueType.toLowerCase()) {
    case "bug": return "B"
    case "story": return "S"
    case "epic": return "E"
    case "task":
    default: return "T"
  }
}

getPriorityClass(priority: string | undefined): string {
  if (!priority) return "medium"
  switch (priority.toLowerCase()) {
    case "highest": return "highest"
    case "high": return "high"
    case "medium": return "medium"
    case "low": return "low"
    case "lowest": return "lowest"
    default: return "medium"
  }
}

getStatusClass(status: string | undefined): string {
  if (!status) return "open"
  switch (status.toLowerCase()) {
    case "terminé":
    case "done": return "done"
    case "en cours":
    case "in progress": return "in-progress"
    case "à faire":
    case "to do": return "to-do"
    case "bloqué":
    case "blocked": return "blocked"
    default: return "open"
  }
}


}
