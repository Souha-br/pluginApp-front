import { Component, type OnInit } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { Issue } from "../../models/issue.model"
import { JiraService } from "src/app/service/jira.service"

@Component({
  selector: "app-issues",
  templateUrl: "./issues.component.html",
  styleUrls: ["./issues.component.scss"],
})
export class IssuesComponent implements OnInit {
  issues: Issue[] = []
  filteredIssues: Issue[] = []
  loading = true
  searchTerm = ""
  selectedProject = ""
  selectedStatus = ""

  statusOptions: string[] = []
  projectOptions: string[] = []
  sortDirection: "asc" | "desc" = "asc"

  constructor(
    private jiraService: JiraService,
    private router: Router,
    public route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // Vérifier si on vient d'un projet spécifique
    this.route.queryParams.subscribe((params) => {
      if (params["project"]) {
        this.selectedProject = params["project"]
        this.loadIssuesByProject(params["project"])
      } else {
        this.loadAllIssues()
      }
    })
  }

  loadAllIssues(): void {
    this.loading = true
    this.jiraService.getAllIssues(0, 100).subscribe({
      next: (response) => {
        if (response.success) {
          this.issues = response.issues
          this.filteredIssues = [...this.issues]
          this.extractFilterOptions()
        }
        this.loading = false
      },
      error: (error) => {
        console.error("Erreur lors du chargement des tickets:", error)
        this.loading = false
      },
    })
  }

  loadIssuesByProject(projectKey: string): void {
    this.loading = true
    this.jiraService.getIssuesByProject(projectKey).subscribe({
      next: (response) => {
        if (response.success) {
          this.issues = response.issues
          this.filteredIssues = [...this.issues]
          this.extractFilterOptions()
        }
        this.loading = false
      },
      error: (error) => {
        console.error("Erreur lors du chargement des tickets du projet:", error)
        this.loading = false
      },
    })
  }

  private extractFilterOptions(): void {
    // Extraire les statuts uniques en filtrant les valeurs undefined
    this.statusOptions = [
      ...new Set(this.issues.map((issue) => issue.status).filter((status): status is string => Boolean(status))),
    ].sort()

    // Extraire les projets uniques en filtrant les valeurs undefined
    this.projectOptions = [
      ...new Set(
        this.issues
          .map((issue) => issue.projectName)
          .filter((projectName): projectName is string => Boolean(projectName)),
      ),
    ].sort()
  }

  onSearch(): void {
    this.applyFilters()
  }

  onStatusChange(): void {
    this.applyFilters()
  }

  onProjectChange(): void {
    this.applyFilters()
  }

  applyFilters(): void {
    let filtered = [...this.issues]

    // Filtre par terme de recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (issue) =>
          issue.summary.toLowerCase().includes(term) ||
          issue.key.toLowerCase().includes(term) ||
          (issue.description && issue.description.toLowerCase().includes(term)),
      )
    }

    // Filtre par statut
    if (this.selectedStatus) {
      filtered = filtered.filter((issue) => issue.status === this.selectedStatus)
    }

    // Filtre par projet (si pas déjà filtré par URL)
    if (this.selectedProject && !this.route.snapshot.queryParams["project"]) {
      filtered = filtered.filter((issue) => issue.projectName === this.selectedProject)
    }

    this.filteredIssues = filtered
  }

  clearFilters(): void {
    this.searchTerm = ""
    this.selectedStatus = ""
    if (!this.route.snapshot.queryParams["project"]) {
      this.selectedProject = ""
    }
    this.filteredIssues = [...this.issues]
  }

  goBack(): void {
    this.router.navigate(["/dashboard"])
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case "done":
      case "closed":
        return "#10b981"
      case "in progress":
      case "in review":
        return "#f59e0b"
      case "to do":
      case "open":
        return "#ef4444"
      default:
        return "#6b7280"
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority?.toLowerCase()) {
      case "highest":
      case "critical":
        return "#dc2626"
      case "high":
        return "#ea580c"
      case "medium":
        return "#d97706"
      case "low":
        return "#65a30d"
      case "lowest":
        return "#059669"
      default:
        return "#6b7280"
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR")
  }
  getSortArrowPoints(): string {
    return this.sortDirection === "asc" ? "6 9 12 15 18 9" : "18 15 12 9 6 15"
  }
}
