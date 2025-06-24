import { Component, type OnInit, type OnDestroy } from "@angular/core"
import { Router } from "@angular/router"
import { Subject, debounceTime, distinctUntilChanged } from "rxjs"
import { takeUntil } from "rxjs/operators"
import { Project } from "src/app/models/project.model"
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

  // Filtres
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

  viewProjectIssues(projectKey: string): void {
    this.router.navigate(["/issues"], {
      queryParams: { project: projectKey },
      state: { fromProjects: true },
    })
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

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
