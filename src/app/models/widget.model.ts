export interface Widget {
  id: string
  type: WidgetType
  title: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  config?: any
  data?: any
}

export enum WidgetType {
  LINE_CHART = "line-chart",
  PIE_CHART = "pie-chart",
  BUBBLE_CHART = "bubble-chart",
  TICKET_LIST = "ticket-list",
  STATS_CARD = "stats-card",
}

export interface WidgetConfig {
  type: WidgetType
  title: string
  description: string
  icon: string
  defaultSize: { width: number; height: number }
}
