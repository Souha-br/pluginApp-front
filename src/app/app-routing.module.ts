import { NgModule } from "@angular/core"
import { RouterModule, type Routes } from "@angular/router"
import { DashboardComponent } from "./components/dashboard/dashboard.component"
import { ProjectsComponent } from "./components/projects/projects.component"
import { IssuesComponent } from "./components/issues/issues.component"
import { LoginComponent } from "./components/login/login.component"
import { AuthGuard } from "./guards/auth.guards"
import { IssueDetailsComponent } from "./components/issue-details/issue-details.component"

const routes: Routes = [
  { path: "", redirectTo: "/dashboard", pathMatch: "full" },
  { path: "login", component: LoginComponent },
  {
    path: "dashboard",
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "projects",
    component: ProjectsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "issues",
    component: IssuesComponent,
    canActivate: [AuthGuard],
  },
  { path: "issues/:issueKey",
   component: IssueDetailsComponent },
  { path: "**", redirectTo: "/dashboard" },
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
