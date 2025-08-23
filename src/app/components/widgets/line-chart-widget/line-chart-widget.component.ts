import { Component, Input, type OnInit, ViewChild, type ElementRef, type OnDestroy } from "@angular/core"
import { Chart, type ChartConfiguration, registerables } from "chart.js"

Chart.register(...registerables)

@Component({
  selector: "app-line-chart-widget",
  templateUrl: "./line-chart-widget.component.html",
  styleUrls: ["./line-chart-widget.component.scss"],
})
export class LineChartWidgetComponent implements OnInit, OnDestroy {
  @Input() data: any
  @Input() title = "Graphique linéaire"
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
      type: "line",
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
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    }

    this.chart = new Chart(this.chartCanvas.nativeElement, config)
  }
}
