import { Component, EventEmitter, Output } from "@angular/core"
import type { WidgetConfig } from "../../models/widget.model"
import { WidgetService } from "src/app/service/widget.service"

@Component({
  selector: "app-widget-selector",
  templateUrl: "./widget-selector.component.html",
  styleUrls: ["./widget-selector.component.scss"],
})
export class WidgetSelectorComponent {
  @Output() close = new EventEmitter<void>()

  availableWidgets: WidgetConfig[]

  constructor(private widgetService: WidgetService) {
    this.availableWidgets = this.widgetService.getAvailableWidgets()
  }

  addWidget(widgetConfig: WidgetConfig): void {
    this.widgetService.addWidget(widgetConfig)
    this.close.emit()
  }

  onClose(): void {
    this.close.emit()
  }
}
