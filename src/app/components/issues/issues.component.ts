import { Component, type OnInit, HostListener } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import type { Issue } from "../../models/issue.model"
import { JiraService } from "src/app/service/jira.service"

@Component({
  selector: "app-issues",
  templateUrl: "./issues.component.html",
  styleUrls: ["./issues.component.scss"],
})
export class IssuesComponent implements OnInit {
  console = console
  issues: Issue[] = []
  filteredIssues: Issue[] = []
  loading = true
  searchTerm = ""
  selectedProject = ""
  selectedStatus = ""
  selectedTypes: string[] = []
  selectedAssignee = ""
  selectedType = ""
  selectedIssueType = ""
  statusOptions: string[] = []
  projectOptions: string[] = []
  typeOptions: string[] = []
  issueTypeOptions: string[] = []
  assigneeOptions: { id: string; displayName: string }[] = []
  userOptions: string[] = []
  groupOptions: string[] = []
  isTypeDropdownOpen = false
  isAssigneeDropdownOpen = false
  typeSearchTerm = ""
  assigneeSearchTerm = ""
  filteredTypeOptions: string[] = []
  filteredUserOptions: string[] = []
  filteredGroupOptions: string[] = []
  sortDirection: "asc" | "desc" = "asc"

  constructor(
    private jiraService: JiraService,
    private router: Router,
    public route: ActivatedRoute,
  ) {}

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement
    if (!target.closest(".filter-dropdown")) {
      this.isTypeDropdownOpen = false
      this.isAssigneeDropdownOpen = false
    }
  }

  ngOnInit(): void {
    console.log("IssuesComponent: ngOnInit démarré.")
    this.route.queryParams.subscribe((params) => {
      console.log("IssuesComponent: Paramètres de route reçus:", params)
      if (params["project"]) {
        this.selectedProject = params["project"]
        console.log("IssuesComponent: Chargement des tickets par projet:", params["project"])
        this.loadIssuesByProject(params["project"])
      } else {
        console.log("IssuesComponent: Chargement de tous les tickets.")
        this.loadAllIssues()
      }
    })
  }

  loadAllIssues(): void {
    this.loading = true
    console.log("IssuesComponent: Appel à jiraService.getAllIssues().")
    this.jiraService.getAllIssues(0, 100).subscribe({
      next: (response) => {
        console.log("IssuesComponent: Réponse de getAllIssues reçue:", response)
        if (response.success && response.issues) {
          this.issues = response.issues
          this.filteredIssues = [...this.issues]
          this.extractFilterOptions()
          console.log("IssuesComponent: Tickets chargés. Nombre de tickets:", this.issues.length)
          console.log("IssuesComponent: filteredIssues contient:", this.filteredIssues.length, "tickets.")
        } else {
          console.warn("IssuesComponent: getAllIssues n'a pas retourné de succès ou de tickets.")
          this.issues = []
          this.filteredIssues = []
        }
        this.loading = false
        console.log("IssuesComponent: Chargement terminé (loadAllIssues).")
      },
      error: (error) => {
        console.error("IssuesComponent: Erreur lors du chargement de tous les tickets:", error)
        this.loading = false
      },
    })
  }

  loadIssuesByProject(projectKey: string): void {
    this.loading = true
    console.log("IssuesComponent: Appel à jiraService.getIssuesByProject() pour le projet:", projectKey)
    this.jiraService.getIssuesByProject(projectKey).subscribe({
      next: (response) => {
        console.log("IssuesComponent: Réponse de getIssuesByProject reçue:", response)
        this.loading = false
        if (response.success && response.issues) {
          this.issues = response.issues || []
          this.filteredIssues = [...this.issues]
          this.extractFilterOptions()
          console.log("IssuesComponent: Tickets du projet chargés. Nombre de tickets:", this.issues.length)
          console.log("IssuesComponent: filteredIssues contient:", this.filteredIssues.length, "tickets.")
        } else {
          console.warn("IssuesComponent: getIssuesByProject n'a pas retourné de succès ou de tickets.")
          this.issues = []
          this.filteredIssues = []
        }
        console.log("IssuesComponent: Chargement terminé (loadIssuesByProject).")
      },
      error: (error) => {
        console.error("IssuesComponent: Erreur lors du chargement des tickets du projet:", error)
        this.loading = false
        this.issues = []
        this.filteredIssues = []
      },
    })
  }

  private extractFilterOptions(): void {
    console.log("IssuesComponent: Extraction des options de filtre.")
    this.statusOptions = [
      ...new Set(this.issues.map((issue) => issue.status).filter((status): status is string => Boolean(status))),
    ].sort()
    this.projectOptions = [
      ...new Set(
        this.issues
          .map((issue) => issue.projectName)
          .filter((projectName): projectName is string => Boolean(projectName)),
      ),
    ].sort()
    this.typeOptions = [
      ...new Set(this.issues.map((issue) => issue.issueType).filter((type): type is string => Boolean(type))),
    ].sort()
    this.issueTypeOptions = [...this.typeOptions]
    const assigneeIds = [
      ...new Set(
        this.issues.map((issue) => issue.assignee).filter((assignee): assignee is string => Boolean(assignee)),
      ),
    ]
    this.assigneeOptions = assigneeIds
      .map((assigneeId) => ({
        id: assigneeId,
        displayName: assigneeId,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
    const assignees = assigneeIds
    this.userOptions = assignees.filter((assignee) => !assignee.includes("-") || assignee.includes("@"))
    this.groupOptions = assignees.filter((assignee) => assignee.includes("-") && !assignee.includes("@"))
    this.filteredTypeOptions = [...this.typeOptions]
    this.filteredUserOptions = [...this.userOptions]
    this.filteredGroupOptions = [...this.groupOptions]
    console.log("IssuesComponent: Options de filtre extraites.")
  }

  getAssigneeDisplayName(assigneeId: string): string {
    const assignee = this.assigneeOptions.find((a) => a.id === assigneeId)
    return assignee ? assignee.displayName : assigneeId
  }

  getIssueTypeClass(issueType?: string): string {
    if (!issueType) return "task"
    switch (issueType.toLowerCase()) {
      case "bug":
      case "problème":
      case "incident":
        return "bug"
      case "story":
      case "user story":
      case "demande de service":
        return "story"
      case "epic":
        return "epic"
      case "changement":
        return "change"
      case "aide informatique":
        return "help"
      case "requête de service":
      case "requête de service avec amélioration":
        return "service-request"
      case "sous-tâche":
        return "subtask"
      case "task":
      case "tâche":
      default:
        return "task"
    }
  }

  getIssueTypeIcon(issueType?: string): string {
    if (!issueType) return "T"
    switch (issueType.toLowerCase()) {
      case "bug":
      case "problème":
      case "incident":
        return "B"
      case "story":
      case "user story":
      case "demande de service":
        return "S"
      case "epic":
        return "E"
      case "changement":
        return "C"
      case "aide informatique":
        return "H"
      case "requête de service":
      case "requête de service avec amélioration":
        return "R"
      case "sous-tâche":
        return "ST"
      case "task":
      case "tâche":
      default:
        return "T"
    }
  }

  getPriorityClass(priority?: string): string {
    if (!priority) return "medium"
    const priorityLower = priority.toLowerCase()
    if (priorityLower.includes("blocker") || priorityLower.includes("bloqueur")) return "blocker"
    if (priorityLower.includes("high") || priorityLower.includes("haute")) return "high"
    if (priorityLower.includes("medium") || priorityLower.includes("moyenne")) return "medium"
    if (priorityLower.includes("low") || priorityLower.includes("basse")) return "low"
    if (priorityLower.includes("minor") || priorityLower.includes("mineure")) return "minor"
    return "medium"
  }

  getStatusClass(status?: string): string {
    if (!status) return "open"
    const statusLower = status.toLowerCase()
    if (statusLower.includes("annulé") || statusLower.includes("cancelled")) return "cancelled"
    if (statusLower.includes("done") || statusLower.includes("closed") || statusLower.includes("terminé")) return "done"
    if (statusLower.includes("progress") || statusLower.includes("cours") || statusLower.includes("development"))
      return "in-progress"
    if (statusLower.includes("blocked") || statusLower.includes("bloqué")) return "blocked"
    if (statusLower.includes("support") || statusLower.includes("attente du support")) return "support"
    if (statusLower.includes("approbation") || statusLower.includes("approval")) return "approval"
    if (statusLower.includes("todo") || statusLower.includes("to do")) return "to-do"
    if (statusLower.includes("ouvert") || statusLower.includes("open")) return "open"
    return "open"
  }

  toggleTypeDropdown(): void {
    this.isTypeDropdownOpen = !this.isTypeDropdownOpen
    this.isAssigneeDropdownOpen = false
  }

  toggleAssigneeDropdown(): void {
    this.isAssigneeDropdownOpen = !this.isAssigneeDropdownOpen
    this.isTypeDropdownOpen = false
  }

  filterTypeOptions(): void {
    const term = this.typeSearchTerm.toLowerCase()
    this.filteredTypeOptions = this.typeOptions.filter((type) => type.toLowerCase().includes(term))
  }

  filterAssigneeOptions(): void {
    const term = this.assigneeSearchTerm.toLowerCase()
    this.filteredUserOptions = this.userOptions.filter((user) => user.toLowerCase().includes(term))
    this.filteredGroupOptions = this.groupOptions.filter((group) => group.toLowerCase().includes(term))
  }

  onTypeChange(type: string, event: any): void {
    if (event.target.checked) {
      this.selectedTypes.push(type)
    } else {
      this.selectedTypes = this.selectedTypes.filter((t) => t !== type)
    }
    this.applyFilters()
  }

  onAssigneeChange(): void {
    this.applyFilters()
  }

  onTypeSelectChange(): void {
    this.applyFilters()
  }

  onAssigneeSelectChange(): void {
    this.applyFilters()
  }

  onIssueTypeChange(): void {
    this.applyFilters()
  }

  getTypeFilterLabel(): string {
    if (this.selectedTypes.length === 0) {
      return "Type : Tous"
    } else if (this.selectedTypes.length === 1) {
      return `Type : ${this.selectedTypes[0]}`
    } else {
      return `Type : ${this.selectedTypes.length} sélectionnés`
    }
  }

  getAssigneeFilterLabel(): string {
    if (!this.selectedAssignee) {
      return "Personne assignée : Tous"
    } else if (this.selectedAssignee === "current") {
      return "Personne assignée : Utilisateur actuel"
    } else if (this.selectedAssignee === "unassigned") {
      return "Personne assignée : Non attribuée"
    } else {
      return `Personne assignée : ${this.selectedAssignee}`
    }
  }

  getTypeIconClass(type: string): string {
    switch (type.toLowerCase()) {
      case "aide informatique":
        return "type-help"
      case "changement":
        return "type-change"
      case "demande de service":
        return "type-service"
      case "incident":
        return "type-incident"
      case "problème":
        return "type-problem"
      case "requête de service avec accord":
        return "type-request"
      case "tâche":
        return "type-task"
      default:
        return "type-default"
    }
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
    console.log("IssuesComponent: Application des filtres.")
    let filtered = [...this.issues]
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (issue) =>
          issue.summary.toLowerCase().includes(term) ||
          issue.key.toLowerCase().includes(term) ||
          (issue.description && issue.description.toLowerCase().includes(term)),
      )
    }
    if (this.selectedStatus) {
      filtered = filtered.filter((issue) => issue.status === this.selectedStatus)
    }
    if (this.selectedProject && !this.route.snapshot.queryParams["project"]) {
      filtered = filtered.filter((issue) => issue.projectName === this.selectedProject)
    }
    if (this.selectedType) {
      filtered = filtered.filter((issue) => issue.issueType === this.selectedType)
    }
    if (this.selectedIssueType) {
      filtered = filtered.filter((issue) => issue.issueType === this.selectedIssueType)
    }
    if (this.selectedTypes.length > 0) {
      filtered = filtered.filter((issue) => issue.issueType && this.selectedTypes.includes(issue.issueType))
    }
    if (this.selectedAssignee) {
      if (this.selectedAssignee === "unassigned") {
        filtered = filtered.filter((issue) => !issue.assignee)
      } else if (this.selectedAssignee === "current") {
        // Logique pour l'utilisateur actuel, si nécessaire
      } else {
        filtered = filtered.filter((issue) => issue.assignee === this.selectedAssignee)
      }
    }
    this.filteredIssues = filtered
    console.log(
      "IssuesComponent: Filtrage terminé. filteredIssues contient maintenant:",
      this.filteredIssues.length,
      "tickets.",
    )
  }

  clearFilters(): void {
    this.searchTerm = ""
    this.selectedStatus = ""
    this.selectedTypes = []
    this.selectedAssignee = ""
    this.selectedType = ""
    this.selectedIssueType = ""
    this.typeSearchTerm = ""
    this.assigneeSearchTerm = ""
    if (!this.route.snapshot.queryParams["project"]) {
      this.selectedProject = ""
    }
    this.filteredTypeOptions = [...this.typeOptions]
    this.filteredUserOptions = [...this.userOptions]
    this.filteredGroupOptions = [...this.groupOptions]
    this.filteredIssues = [...this.issues]
    console.log(
      "IssuesComponent: Filtres effacés. filteredIssues réinitialisé à:",
      this.filteredIssues.length,
      "tickets.",
    )
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

  viewIssueDetails(issueKey: string): void {
    console.log("IssuesComponent: viewIssueDetails appelé pour la clé:", issueKey)
    this.router.navigate(["/issues", issueKey])
  }
}
