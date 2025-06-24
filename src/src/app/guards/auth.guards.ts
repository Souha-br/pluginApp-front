import { Injectable } from "@angular/core"
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router"
import { Observable } from "rxjs"

@Injectable({
  providedIn: "root",
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    const token = localStorage.getItem("jwt")

    if (token) {
      if (this.isTokenValid(token)) {
        return true
      } else {
        localStorage.removeItem("jwt")
        localStorage.removeItem("currentUser")
        this.router.navigate(["/login"])
        return false
      }
    } else {
      this.router.navigate(["/login"], {
        queryParams: { returnUrl: state.url },
      })
      return false
    }
  }

  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      const currentTime = Math.floor(Date.now() / 1000)

      return payload.exp > currentTime
    } catch (error) {
      console.error("Token invalide:", error)
      return false
    }
  }
}
