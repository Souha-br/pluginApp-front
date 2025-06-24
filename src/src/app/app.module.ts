import { NgModule } from "@angular/core"
import { BrowserModule } from "@angular/platform-browser"
import { HttpClientModule } from "@angular/common/http"
import { FormsModule } from "@angular/forms"

import { AppRoutingModule } from "./app-routing.module"
import { AppComponent } from "./app.component"
import { DashboardComponent } from "./components/dashboard/dashboard.component"
import { ProjectsComponent } from "./components/projects/projects.component"
import { IssuesComponent } from "./components/issues/issues.component"
import { LoginComponent } from "./components/login/login.component"

@NgModule({
  declarations: [AppComponent, DashboardComponent, ProjectsComponent, IssuesComponent, LoginComponent],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule, FormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
