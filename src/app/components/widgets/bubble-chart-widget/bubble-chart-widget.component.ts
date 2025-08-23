import { Component, Input, type OnInit, ViewChild, type ElementRef, type OnDestroy } from "@angular/core"
import { Chart, type ChartConfiguration, registerables } from "chart.js"

Chart.register(...registerables)

@Component({
  selector: "app-bubble-chart-widget",
  templateUrl: "./bubble-chart-widget.component.html",
  styleUrls: ["./bubble-chart-widget.component.scss"],
})
export class BubbleChartWidgetComponent implements OnInit, OnDestroy {
  @Input() data: any
  @Input() title = "Graphique à bulles"
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
      type: "bubble",
      data: this.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Jours ouverts",
            },
          },
          y: {
            title: {
              display: true,
              text: "Commentaires",
            },
          },
        },
      },
    }

    this.chart = new Chart(this.chartCanvas.nativeElement, config)
  }
}
