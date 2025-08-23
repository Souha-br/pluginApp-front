import { NgModule } from "@angular/core"
import { BrowserModule } from "@angular/platform-browser"
import { HttpClientModule } from "@angular/common/http"
import { FormsModule } from "@angular/forms"

import { AppRoutingModule } from "./app-routing.module"
import { AppComponent } from "./app.component"
import { DashboardComponent } from "./components/dashboard/dashboard.component"
import { ProjectsComponent } from "./components/projects/projects.component"
import { IssuesComponent } from "./components/issues/issues.component"
import { LoginComponent } from "./components/login/login.component";
import { IssueDetailsComponent } from './components/issue-details/issue-details.component';
import { WidgetSelectorComponent } from './components/widget-selector/widget-selector.component';
import { BubbleChartWidgetComponent } from './components/widgets/bubble-chart-widget/bubble-chart-widget.component';
import { LineChartWidgetComponent } from './components/widgets/line-chart-widget/line-chart-widget.component';
import { PieChartWidgetComponent } from './components/widgets/pie-chart-widget/pie-chart-widget.component';
import { TicketListWidgetComponent } from './components/widgets/ticket-list-widget/ticket-list-widget.component'

@NgModule({
  declarations: [AppComponent, DashboardComponent, ProjectsComponent, IssuesComponent, LoginComponent, IssueDetailsComponent, WidgetSelectorComponent, BubbleChartWidgetComponent, LineChartWidgetComponent, PieChartWidgetComponent, TicketListWidgetComponent],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule, FormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
