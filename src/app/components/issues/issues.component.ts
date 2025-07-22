import { Component, type OnInit } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { Issue } from "../../models/issue.model"
import { JiraService } from "src/app/service/jira.service"
import { forkJoin } from 'rxjs'

interface User {
  id: string;
  username: string;
  displayName: string;
  emailAddress?: string;
}

@Component({
  selector: "app-issues",
  templateUrl: "./issues.component.html",
  styleUrls: ["./issues.component.scss"],
})
export class IssuesComponent implements OnInit {
  issues: Issue[] = []
  filteredIssues: Issue[] = []
  users: User[] = []
  loading = true
  searchTerm = ""
  selectedProject = ""
  selectedStatus = ""
  selectedAssignee = ""
  selectedIssueType = ""

  statusOptions: string[] = []
  projectOptions: string[] = []
  assigneeOptions: { id: string, displayName: string }[] = []
  issueTypeOptions: string[] = []

  constructor(
    private jiraService: JiraService,
    private router: Router,
    public route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
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

    forkJoin({
      issues: this.jiraService.getAllIssues(0, 100),
      users: this.jiraService.getAllUsers()
    }).subscribe({
      next: (response: any) => {
        if (response.issues.success) {
          this.issues = response.issues.issues
          this.filteredIssues = [...this.issues]
        }

        if (response.users.success) {
          this.users = response.users.users || response.users
        }

        this.extractFilterOptions()
        this.loading = false
      },
      error: (error: any) => {
        console.error("Erreur lors du chargement des données:", error)
        this.loading = false
      },
    })
  }

  loadIssuesByProject(projectKey: string): void {
    this.loading = true

    forkJoin({
      issues: this.jiraService.getIssuesByProject(projectKey),
      users: this.jiraService.getUsersByProject ?
        this.jiraService.getUsersByProject(projectKey) :
        this.jiraService.getAllUsers()
    }).subscribe({
      next: (response: any) => {
        if (response.issues.success) {
          this.issues = response.issues.issues
          this.filteredIssues = [...this.issues]
        }

        if (response.users.success) {
          this.users = response.users.users || response.users
        }

        this.extractFilterOptions()
        this.loading = false
      },
      error: (error: any) => {
        console.error("Erreur lors du chargement des données du projet:", error)
        this.loading = false
      },
    })
  }

  private extractFilterOptions(): void {
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

    // Extraction des types de tickets
    this.issueTypeOptions = [
      ...new Set(
        this.issues
          .map((issue) => issue.issueType)
          .filter((issueType): issueType is string => Boolean(issueType))
      )
    ].sort()

    const assigneeIds = [
      ...new Set(
        this.issues
          .map((issue) => issue.assignee)
          .filter((assignee): assignee is string => Boolean(assignee))
      )
    ]

    this.assigneeOptions = assigneeIds
      .map(assigneeId => {
        const user = this.users.find(u => u.id === assigneeId || u.username === assigneeId)
        return {
          id: assigneeId,
          displayName: user ? user.displayName : assigneeId
        }
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
  }

  getAssigneeDisplayName(assigneeId: string): string {
    const user = this.users.find(u => u.id === assigneeId || u.username === assigneeId)
    return user ? user.displayName : assigneeId
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

  onAssigneeChange(): void {
    this.applyFilters()
  }

  onIssueTypeChange(): void {
    this.applyFilters()
  }

  applyFilters(): void {
    let filtered = [...this.issues]

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (issue) =>
          issue.summary.toLowerCase().includes(term) ||
          issue.key.toLowerCase().includes(term) ||
          (issue.description && issue.description.toLowerCase().includes(term)) ||
          (issue.assignee && this.getAssigneeDisplayName(issue.assignee).toLowerCase().includes(term))
      )
    }

    if (this.selectedStatus) {
      filtered = filtered.filter((issue) => issue.status === this.selectedStatus)
    }

    if (this.selectedProject && !this.route.snapshot.queryParams["project"]) {
      filtered = filtered.filter((issue) => issue.projectName === this.selectedProject)
    }

    if (this.selectedAssignee) {
      filtered = filtered.filter((issue) => issue.assignee === this.selectedAssignee)
    }

    if (this.selectedIssueType) {
      filtered = filtered.filter((issue) => issue.issueType === this.selectedIssueType)
    }

    this.filteredIssues = filtered
  }

  clearFilters(): void {
    this.searchTerm = ""
    this.selectedStatus = ""
    this.selectedAssignee = ""
    this.selectedIssueType = ""
    if (!this.route.snapshot.queryParams["project"]) {
      this.selectedProject = ""
    }
    this.filteredIssues = [...this.issues]
  }

  goBack(): void {
    this.router.navigate(["/dashboard"])
  }

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
}
