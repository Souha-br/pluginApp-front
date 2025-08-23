import { Component, Input, type OnInit, ViewChild, type ElementRef, type OnDestroy } from "@angular/core"
import { Chart, type ChartConfiguration, registerables } from "chart.js"

Chart.register(...registerables)

@Component({
  selector: "app-pie-chart-widget",
  templateUrl: "./pie-chart-widget.component.html",
  styleUrls: ["./pie-chart-widget.component.scss"],
})
export class PieChartWidgetComponent implements OnInit, OnDestroy {
  @Input() data: any
  @Input() title = "Graphique circulaire"
  @ViewChild("chartCanvas", { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>

  private chart: Chart | null = null

  ngOnInit(): void {
    this.createChart()
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy()
    }
  }

  private createChart(): void {
    const config: ChartConfiguration = {
      type: "doughnut",
      data: this.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    }

    this.chart = new Chart(this.chartCanvas.nativeElement, config)
  }
}
