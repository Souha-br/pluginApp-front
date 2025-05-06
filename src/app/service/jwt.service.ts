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

  login(loginRequest: any): Observable<any> {
    return this.http.post(BASE_URL + "login", loginRequest).pipe(
      tap((response: any) => {
        console.log("Full response object:", response)
        console.log("Response type:", typeof response)
        console.log("Response keys:", Object.keys(response))

        const token = response?.jwt || response?.jwtToken

        if (token) {
          localStorage.setItem("jwt", token)
          console.log("✅ JWT stocké dans localStorage:", localStorage.getItem("jwt"))
        } else {
          console.error("No JWT token in response:", response)
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error("Login error in service:", error);

        // Check if this is a user not found error based on the error response
        if (this.isUserNotFoundError(error)) {
          return throwError({
            userNotFound: true,
            message: "There's no existing account with this email"
          });
        }

        // For other errors, pass them through
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
      console.log("✅ JWT token found in local storage:", jwtToken)
      return new HttpHeaders().set("Authorization", "Bearer " + jwtToken)
    } else {
      console.warn("⚠️ JWT token not found in local storage")
      return new HttpHeaders()
    }
  }

  // Helper method to determine if an error indicates user not found
  private isUserNotFoundError(error: HttpErrorResponse): boolean {
    // Log the error details to help with debugging
    console.log("Error status:", error.status);
    console.log("Error body:", error.error);

    // Check for specific error messages or status codes that indicate user not found
    // Adjust these conditions based on your Spring Boot API's actual error responses

    // Check for 404 status code
    if (error.status === 404) {
      return true;
    }

    // Check for specific error messages in the response
    if (error.error && typeof error.error === 'object') {
      const errorMessage = error.error.message || error.error.error || '';
      const errorString = errorMessage.toString().toLowerCase();

      if (errorString.includes('user not found') ||
          errorString.includes('no account') ||
          errorString.includes('not registered') ||
          errorString.includes('invalid email') ||
          errorString.includes('user doesn\'t exist')) {
        return true;
      }
    }

    // Check for specific error codes that your Spring Boot might return
    if (error.error && error.error.code === 'USER_NOT_FOUND') {
      return true;
    }

    // If none of the above conditions match, it's not a user not found error
    return false;
  }
}
