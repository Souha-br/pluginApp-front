import { Injectable } from "@angular/core"
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http"
import { type Observable, BehaviorSubject, of } from "rxjs"
import { map, catchError } from "rxjs/operators"
import type { Project, ProjectsResponse, ProjectStats } from "../models/project.model"
import type { Issue, IssuesResponse, IssueStats, JiraApiResponse } from "../models/issue.model" // Assurez-vous que JiraApiResponse est importé

@Injectable({
  providedIn: "root",
})
export class JiraService {
  getProjectByKey(projectKey: string) {
    throw new Error("Method not implemented.")
  }
  private readonly apiUrl = "http://localhost:8081/api"
  private projectsSubject = new BehaviorSubject<Project[]>([])
  private issuesSubject = new BehaviorSubject<Issue[]>([])
  public projects$ = this.projectsSubject.asObservable()
  public issues$ = this.issuesSubject.asObservable()

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem("jwt")
    console.log("Token récupéré:", token ? "Token présent" : "Aucun token")
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    })
  }

  private handleError<T>(operation = "operation", result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error)
      console.error("Status:", error.status)
      console.error("Error body:", error.error)
      if (error.status === 401) {
        console.warn("Token expiré, redirection vers login")
        localStorage.removeItem("jwt")
        window.location.href = "/login"
      }
      return of(result as T)
    }
  }

  getAllProjects(): Observable<ProjectsResponse> {
    const headers = this.getAuthHeaders()
    console.log("Appel API getAllProjects vers:", `${this.apiUrl}/projects`)
    return this.http.get<any>(`${this.apiUrl}/projects`, { headers }).pipe(
      map((response) => {
        console.log("Réponse brute getAllProjects:", response)
        let adaptedResponse: ProjectsResponse
        if (Array.isArray(response)) {
          adaptedResponse = {
            success: true,
            message: "Projets récupérés avec succès",
            count: response.length,
            projects: response,
          }
        } else if (response && response.projects) {
          adaptedResponse = response
        } else if (response && Array.isArray(response.data)) {
          adaptedResponse = {
            success: true,
            message: "Projets récupérés avec succès",
            count: response.data.length,
            projects: response.data,
          }
        } else {
          console.warn("Format de réponse inattendu:", response)
          adaptedResponse = {
            success: false,
            message: "Format de réponse inattendu",
            count: 0,
            projects: [],
          }
        }
        if (adaptedResponse.success && adaptedResponse.projects) {
          this.projectsSubject.next(adaptedResponse.projects)
          console.log("Cache projets mis à jour:", adaptedResponse.projects.length, "projets")
        }
        return adaptedResponse
      }),
      catchError(
        this.handleError<ProjectsResponse>("getAllProjects", {
          success: false,
          message: "Erreur lors de la récupération des projets",
          count: 0,
          projects: [],
        }),
      ),
    )
  }

  getProjectStats(): Observable<ProjectStats> {
    return this.projects$.pipe(
      map((projects) => {
        console.log("Calcul des stats projets pour:", projects.length, "projets")
        return {
          totalProjects: projects.length,
          activeProjects: projects.length,
          recentProjects: projects.slice(0, 5),
        }
      }),
    )
  }

  getAllIssues(startAt = 0, maxResults = 50): Observable<IssuesResponse> {
    const headers = this.getAuthHeaders()
    const params = new HttpParams().set("startAt", startAt.toString()).set("maxResults", maxResults.toString())
    console.log("Appel API getAllIssues vers:", `${this.apiUrl}/issues`)
    return this.http.get<any>(`${this.apiUrl}/issues`, { headers, params }).pipe(
      map((response) => {
        console.log("Réponse brute getAllIssues:", response)
        let adaptedResponse: IssuesResponse
        if (Array.isArray(response)) {
          adaptedResponse = {
            success: true,
            message: "Tickets récupérés avec succès",
            count: response.length,
            issues: response,
          }
        } else if (response && response.issues) {
          adaptedResponse = response
        } else if (response && Array.isArray(response.data)) {
          adaptedResponse = {
            success: true,
            message: "Tickets récupérés avec succès",
            count: response.data.length,
            issues: response.data,
          }
        } else {
          console.warn("Format de réponse inattendu:", response)
          adaptedResponse = {
            success: false,
            message: "Format de réponse inattendu",
            count: 0,
            issues: [],
          }
        }
        if (adaptedResponse.success && adaptedResponse.issues) {
          this.issuesSubject.next(adaptedResponse.issues)
          console.log("Cache tickets mis à jour:", adaptedResponse.issues.length, "tickets")
        }
        return adaptedResponse
      }),
      catchError(
        this.handleError<IssuesResponse>("getAllIssues", {
          success: false,
          message: "Erreur lors de la récupération des tickets",
          count: 0,
          issues: [],
        }),
      ),
    )
  }

  getIssuesByProject(projectKey: string): Observable<IssuesResponse> {
    const headers = this.getAuthHeaders()
    console.log("Appel API getIssuesByProject vers:", `${this.apiUrl}/issues/project/${projectKey}`)
    return this.http.get<any>(`${this.apiUrl}/issues/project/${projectKey}`, { headers }).pipe(
      map((response) => {
        console.log("Réponse brute getIssuesByProject:", response)
        let adaptedResponse: IssuesResponse
        if (Array.isArray(response)) {
          adaptedResponse = {
            success: true,
            message: "Tickets du projet récupérés avec succès",
            count: response.length,
            issues: response,
          }
        } else if (response && response.issues) {
          adaptedResponse = response
        } else if (response && Array.isArray(response.data)) {
          adaptedResponse = {
            success: true,
            message: "Tickets du projet récupérés avec succès",
            count: response.data.length,
            issues: response.data,
          }
        } else {
          adaptedResponse = {
            success: false,
            message: "Format de réponse inattendu",
            count: 0,
            issues: [],
          }
        }
        if (adaptedResponse.success && adaptedResponse.issues) {
          this.issuesSubject.next(adaptedResponse.issues)
        }
        return adaptedResponse
      }),
      catchError(
        this.handleError<IssuesResponse>("getIssuesByProject", {
          success: false,
          message: "Erreur lors de la récupération des tickets du projet",
          count: 0,
          issues: [],
        }),
      ),
    )
  }

  // Nouvelle méthode pour récupérer un seul ticket par sa clé
  getIssueDetails(issueKey: string): Observable<JiraApiResponse<Issue>> {
    const headers = this.getAuthHeaders()
    console.log("Appel API getIssueDetails vers:", `${this.apiUrl}/issues/${issueKey}`)
    return this.http.get<any>(`${this.apiUrl}/issues/${issueKey}`, { headers }).pipe(
      map((response) => {
        console.log("Réponse brute getIssueDetails:", response)
        let adaptedResponse: JiraApiResponse<Issue>
        // Assumons que l'API retourne directement l'objet issue ou un objet avec une propriété 'issue'
        if (response && response.key) {
          // Si la réponse est directement l'objet Issue
          adaptedResponse = {
            success: true,
            issue: response,
          }
        } else if (response && response.issue) {
          // Si la réponse est { success: true, issue: {...} }
          adaptedResponse = {
            success: true,
            issue: response.issue,
          }
        } else if (response && Array.isArray(response.data) && response.data.length > 0) {
          // Si la réponse est { success: true, data: [{...}] }
          adaptedResponse = {
            success: true,
            issue: response.data[0],
          }
        } else {
          console.warn("Format de réponse inattendu pour les détails du ticket:", response)
          adaptedResponse = {
            success: false,
            message: "Ticket non trouvé ou format inattendu",
          }
        }
        return adaptedResponse
      }),
      catchError(
        this.handleError<JiraApiResponse<Issue>>("getIssueDetails", {
          success: false,
          message: "Erreur lors de la récupération des détails du ticket",
        }),
      ),
    )
  }

  getIssueStats(): Observable<IssueStats> {
    return this.issues$.pipe(
      map((issues) => {
        console.log("Calcul des stats tickets pour:", issues.length, "tickets")
        const openIssues = issues.filter(
          (issue) => issue.status && ["Open", "To Do", "New", "TODO"].includes(issue.status),
        ).length
        const inProgressIssues = issues.filter(
          (issue) => issue.status && ["In Progress", "In Review", "Testing", "PROGRESS"].includes(issue.status),
        ).length
        const resolvedIssues = issues.filter(
          (issue) => issue.status && ["Done", "Closed", "Resolved", "DONE"].includes(issue.status),
        ).length
        const currentUser = this.getCurrentUser()
        const myIssues = issues.filter((issue) => issue.assignee === currentUser).length
        const stats = {
          totalIssues: issues.length,
          openIssues,
          inProgressIssues,
          resolvedIssues,
          myIssues,
          recentIssues: issues.slice(0, 5),
        }
        console.log("Stats calculées:", stats)
        return stats
      }),
    )
  }

  private getCurrentUser(): string {
    return localStorage.getItem("currentUser") || ""
  }

  testApiConnection(): Observable<boolean> {
    const headers = this.getAuthHeaders()
    console.log("Test de connectivité API")
    return this.http.get<any>(`${this.apiUrl}/health`, { headers }).pipe(
      map((response) => {
        console.log("API accessible:", response)
        return true
      }),
      catchError((error) => {
        console.error("API non accessible:", error)
        return of(false)
      }),
    )
  }

  getAllUsers(): Observable<any> {
    const headers = this.getAuthHeaders()
    console.log("Appel API getAllUsers vers:", `${this.apiUrl}/users`)
    return this.http.get<any>(`${this.apiUrl}/users`, { headers }).pipe(
      map((response) => {
        console.log("Réponse brute getAllUsers:", response)
        let adaptedResponse: any
        if (Array.isArray(response)) {
          adaptedResponse = {
            success: true,
            message: "Utilisateurs récupérés avec succès",
            count: response.length,
            users: response,
          }
        } else if (response && response.users) {
          adaptedResponse = response
        } else if (response && Array.isArray(response.data)) {
          adaptedResponse = {
            success: true,
            message: "Utilisateurs récupérés avec succès",
            count: response.data.length,
            users: response.data,
          }
        } else {
          console.warn("Format de réponse inattendu pour les utilisateurs:", response)
          adaptedResponse = {
            success: false,
            message: "Format de réponse inattendu",
            count: 0,
            users: [],
          }
        }
        return adaptedResponse
      }),
      catchError(
        this.handleError<any>("getAllUsers", {
          success: false,
          message: "Erreur lors de la récupération des utilisateurs",
          count: 0,
          users: [],
        }),
      ),
    )
  }

  getUsersByProject(projectKey: string): Observable<any> {
    const headers = this.getAuthHeaders()
    console.log("Appel API getUsersByProject vers:", `${this.apiUrl}/projects/${projectKey}/users`)
    return this.http.get<any>(`${this.apiUrl}/projects/${projectKey}/users`, { headers }).pipe(
      map((response) => {
        console.log("Réponse brute getUsersByProject:", response)
        let adaptedResponse: any
        if (Array.isArray(response)) {
          adaptedResponse = {
            success: true,
            message: "Utilisateurs du projet récupérés avec succès",
            count: response.length,
            users: response,
          }
        } else if (response && response.users) {
          adaptedResponse = response
        } else if (response && Array.isArray(response.data)) {
          adaptedResponse = {
            success: true,
            message: "Utilisateurs du projet récupérés avec succès",
            count: response.data.length,
            users: response.data,
          }
        } else {
          adaptedResponse = {
            success: false,
            message: "Format de réponse inattendu",
            count: 0,
            users: [],
          }
        }
        return adaptedResponse
      }),
      catchError(
        this.handleError<any>("getUsersByProject", {
          success: false,
          message: "Erreur lors de la récupération des utilisateurs du projet",
          count: 0,
          users: [],
        }),
      ),
    )
  }
}
