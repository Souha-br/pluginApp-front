import { HttpClient, HttpHeaders, HttpErrorResponse } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { Observable, throwError } from "rxjs"
import { tap, catchError } from "rxjs/operators"

const BASE_URL = "http://localhost:8081/"

@Injectable({
  providedIn: "root",
})
export class JwtService {
  constructor(private http: HttpClient) {}

  register(signRequest: any): Observable<any> {
    return this.http.post(BASE_URL + "signup", signRequest)
  }
  login(user_name: string, password: string): Observable<any> {
    const loginRequest = { user_name, password };

    console.log("Sending login request:", loginRequest);

    return this.http.post(BASE_URL + "login", loginRequest).pipe(
      tap((response: any) => {
        console.log("Login successful! Full response:", response)
        const token = response?.jwtToken

        if (token) {
          localStorage.setItem("jwt", token)
          console.log("✅ JWT stocké dans localStorage:", token)
        } else {
          console.error("❌ Pas de token JWT dans la réponse:", response)
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error("Login error:", error);
        console.error("Status:", error.status);
        console.error("Error body:", error.error);

        if (error.status === 401) {
          return throwError({
            invalidCredentials: true,
            message: "Nom d'utilisateur ou mot de passe incorrect"
          });
        }

        if (error.status === 404) {
          return throwError({
            userNotFound: true,
            message: "Utilisateur non trouvé"
          });
        }

        return throwError(error);
      })
    )
  }

  hello(): Observable<any> {
    const headers = this.createAuthorizationHeader()
    return this.http.get(BASE_URL + "api/hello", { headers })
  }

  private createAuthorizationHeader(): HttpHeaders {
    const jwtToken = localStorage.getItem("jwt")
    if (jwtToken) {
      console.log("✅ JWT token trouvé dans le localStorage")
      return new HttpHeaders().set("Authorization", "Bearer " + jwtToken)
    } else {
      console.warn("⚠️ JWT token non trouvé dans le localStorage")
      return new HttpHeaders()
    }
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem("jwt");
  }

  logout(): void {
    localStorage.removeItem("jwt");
    console.log("✅ Utilisateur déconnecté, JWT supprimé du localStorage");
  }
}
