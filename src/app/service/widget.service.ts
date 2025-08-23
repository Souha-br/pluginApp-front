import { Injectable } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { Widget, WidgetType, type WidgetConfig } from "../models/widget.model"
import { Issue } from "../models/issue.model"

@Injectable({
  providedIn: "root",
})
export class WidgetService {
  private widgetsSubject = new BehaviorSubject<Widget[]>([])
  public widgets$ = this.widgetsSubject.asObservable()

  private availableWidgets: WidgetConfig[] = [
    {
      type: WidgetType.LINE_CHART,
      title: "Tickets créés vs résolus",
      description: "Graphique linéaire des tickets créés comparés aux tickets résolus",
      icon: "trending-up",
      defaultSize: { width: 6, height: 4 },
    },
    {
      type: WidgetType.PIE_CHART,
      title: "Répartition par assigné",
      description: "Graphique circulaire de la répartition des tickets par personne",
      icon: "pie-chart",
      defaultSize: { width: 4, height: 4 },
    },
    {
      type: WidgetType.BUBBLE_CHART,
      title: "Corrélation tickets",
      description: "Graphique à bulles montrant la corrélation entre différentes métriques",
      icon: "scatter-chart",
      defaultSize: { width: 6, height: 4 },
    },
    {
      type: WidgetType.TICKET_LIST,
      title: "Liste des tickets",
      description: "Liste filtrée des tickets avec statuts",
      icon: "list",
      defaultSize: { width: 8, height: 6 },
    },
  ]

  getAvailableWidgets(): WidgetConfig[] {
    return this.availableWidgets
  }

  addWidget(widgetConfig: WidgetConfig): void {
    const currentWidgets = this.widgetsSubject.value
    const newWidget: Widget = {
      id: this.generateId(),
      type: widgetConfig.type,
      title: widgetConfig.title,
      position: this.findAvailablePosition(currentWidgets),
      size: widgetConfig.defaultSize,
      config: {},
    }

    this.widgetsSubject.next([...currentWidgets, newWidget])
  }

  removeWidget(widgetId: string): void {
    const currentWidgets = this.widgetsSubject.value
    this.widgetsSubject.next(currentWidgets.filter((w) => w.id !== widgetId))
  }

  updateWidget(widgetId: string, updates: Partial<Widget>): void {
    const currentWidgets = this.widgetsSubject.value
    const updatedWidgets = currentWidgets.map((w) => (w.id === widgetId ? { ...w, ...updates } : w))
    this.widgetsSubject.next(updatedWidgets)
  }

  generateTicketLineChartData(issues: Issue[]): any {
    const last30Days = this.getLast30Days()
    const createdData = this.getTicketsByDate(issues, "created", last30Days)
    const resolvedData = this.getTicketsByDate(issues, "resolved", last30Days)

    return {
      labels: last30Days.map((date) => date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })),
      datasets: [
        {
          label: "Tickets créés",
          data: createdData,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.4,
        },
        {
          label: "Tickets résolus",
          data: resolvedData,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
        },
      ],
    }
  }

  generateAssigneesPieChartData(issues: Issue[]): any {
    const assigneeCounts = issues.reduce(
      (acc, issue) => {
        const assignee = issue.assignee || "Non attribué"
        acc[assignee] = (acc[assignee] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      labels: Object.keys(assigneeCounts),
      datasets: [
        {
          data: Object.values(assigneeCounts),
          backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
        },
      ],
    }
  }

  generateBubbleChartData(issues: Issue[]): any {
    const projectData = issues.reduce(
      (acc, issue) => {
        const project = issue.project || "Inconnu"
        if (!acc[project]) {
          acc[project] = { openDays: [], comments: [], participants: [] }
        }

        const openDays = this.calculateOpenDays(issue.created)
        const comments = Math.floor(Math.random() * 20)
        const participants = Math.floor(Math.random() * 10) + 1

        acc[project].openDays.push(openDays)
        acc[project].comments.push(comments)
        acc[project].participants.push(participants)

        return acc
      },
      {} as Record<string, any>,
    )

    const datasets = Object.keys(projectData).map((project, index) => ({
      label: project,
      data: projectData[project].openDays.map((days: number, i: number) => ({
        x: days,
        y: projectData[project].comments[i],
        r: projectData[project].participants[i] * 2,
      })),
      backgroundColor: [
        "rgba(16, 185, 129, 0.6)",
        "rgba(59, 130, 246, 0.6)",
        "rgba(245, 158, 11, 0.6)",
        "rgba(239, 68, 68, 0.6)",
      ][index % 4],
    }))

    return { datasets }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  private findAvailablePosition(widgets: Widget[]): { x: number; y: number } {
    return { x: 0, y: widgets.length * 2 }
  }

  private getLast30Days(): Date[] {
    const days = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push(date)
    }
    return days
  }

  private getTicketsByDate(issues: Issue[], type: "created" | "resolved", dates: Date[]): number[] {
    return dates.map((date) => {
      return issues.filter((issue) => {
        const dateString = type === "created" ? issue.created : issue.updated
        if (!dateString) return false

        const issueDate = new Date(dateString)
        return (
          issueDate.toDateString() === date.toDateString() &&
          (type === "resolved" ? this.isResolved(issue.status) : true)
        )
      }).length
    })
  }

  private isResolved(status?: string): boolean {
    if (!status) return false
    return ["done", "closed", "resolved", "terminé"].includes(status.toLowerCase())
  }

  private calculateOpenDays(created?: string): number {
    if (!created) return 0
    try {
      const createdDate = new Date(created)
      const now = new Date()
      return Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    } catch {
      return 0
    }
  }
}
