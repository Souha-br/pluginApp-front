import { Component } from "@angular/core"
import { Router } from "@angular/router"
import { JwtService } from "src/app/service/jwt.service"

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent {
  user_name = ""
  password = ""
  errorMessage = ""
  submitted = false
  isLoading = false

  constructor(
    private jwtService: JwtService,
    private router: Router,
  ) {}

  onSubmit(): void {
    this.submitted = true

    if (this.user_name === "" || this.password === "") {
      return
    }

    this.isLoading = true
    this.errorMessage = ""

    this.jwtService.login(this.user_name, this.password).subscribe(
      (response) => {
        console.log("Login successful", response)

        // ✅ S'assurer que le token est stocké
        if (response && response.token) {
          localStorage.setItem("token", response.token)
          localStorage.setItem("currentUser", this.user_name)
        }

        this.isLoading = false
        this.router
          .navigate(["/dashboard"])
          .then(() => {
            console.log("Navigation vers dashboard réussie")
          })
          .catch((error) => {
            console.error("Erreur de navigation:", error)
            // Fallback: redirection par URL
            window.location.href = "/dashboard"
          })
      },
      (error) => {
        this.isLoading = false
        if (error.invalidCredentials) {
          this.errorMessage = "Nom d'utilisateur ou mot de passe incorrect"
        } else if (error.userNotFound) {
          this.errorMessage = "Utilisateur non trouvé"
        } else {
          this.errorMessage = "Une erreur s'est produite. Veuillez réessayer."
        }
        console.error("Login error", error)
      },
    )
  }
}
