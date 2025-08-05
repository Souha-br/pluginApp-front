import { Component, type OnInit } from "@angular/core"
import { ActivatedRoute, Router } from "@angular/router"
import { JiraService } from "../../service/jira.service"
import type { Issue } from "../../models/issue.model"

@Component({
  selector: "app-issue-details",
  templateUrl: "./issue-details.component.html",
  styleUrls: ["./issue-details.component.scss"],
})
export class IssueDetailsComponent implements OnInit {
  issue: Issue | undefined
  loading = true
  errorMessage: string | undefined

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jiraService: JiraService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const issueKey = params.get("issueKey")
      if (issueKey) {
        this.loadIssueDetails(issueKey)
      } else {
        this.errorMessage = "Clé de ticket manquante."
        this.loading = false
      }
    })
  }

  loadIssueDetails(issueKey: string): void {
    this.loading = true
    this.jiraService.getIssueDetails(issueKey).subscribe({
      next: (response) => {
        if (response.success && response.issue) {
          this.issue = response.issue
        } else {
          this.errorMessage = response.message || "Ticket non trouvé."
        }
        this.loading = false
      },
      error: (error) => {
        console.error("Erreur lors du chargement des détails du ticket:", error)
        this.errorMessage = "Erreur lors du chargement des détails du ticket."
        this.loading = false
      },
    })
  }

  goBack(): void {
    this.router.navigate(["/issues"])
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  getAssigneeDisplayName(assigneeId?: string): string {
    if (!assigneeId) {
      return "Non attribuée"
    }
    return assigneeId
  }

  getAssigneeInitial(assigneeId?: string): string {
    if (!assigneeId) {
      return "?"
    }
    return assigneeId.charAt(0).toUpperCase()
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
}
