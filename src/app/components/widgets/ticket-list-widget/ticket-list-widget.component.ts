import { Component, Input } from "@angular/core"
import type { Issue } from "../../../models/issue.model"

@Component({
  selector: "app-ticket-list-widget",
  templateUrl: "./ticket-list-widget.component.html",
  styleUrls: ["./ticket-list-widget.component.scss"],
})
export class TicketListWidgetComponent {
  @Input() data: Issue[] = []
  @Input() title = "Liste des tickets"

  getStatusClass(status?: string): string {
    if (!status) return "open"
    switch (status.toLowerCase()) {
      case "done":
      case "closed":
      case "resolved":
        return "done"
      case "in progress":
      case "in review":
        return "in-progress"
      default:
        return "open"
    }
  }

  getPriorityClass(priority?: string): string {
    if (!priority) return "medium"
    switch (priority.toLowerCase()) {
      case "highest":
      case "critical":
        return "highest"
      case "high":
        return "high"
      case "low":
      case "lowest":
        return "lowest"
      default:
        return "medium"
    }
  }

  getIssueTypeIcon(issueType?: string): string {
    if (!issueType) return "T"
    switch (issueType.toLowerCase()) {
      case "bug":
        return "B"
      case "story":
        return "S"
      case "epic":
        return "E"
      default:
        return "T"
    }
  }
}
