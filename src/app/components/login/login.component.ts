import { Component, type OnInit } from "@angular/core"
import { FormBuilder, type FormGroup, Validators } from "@angular/forms"
import { Router } from "@angular/router"
import { JwtService } from "src/app/service/jwt.service"
import { HttpErrorResponse } from "@angular/common/http"

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup
  passwordError: string = '';
  emailError: string = '';
  isSubmitting: boolean = false;

  constructor(
    private service: JwtService,
    private fb: FormBuilder,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required]],
    })

    // Reset errors when form values change
    this.loginForm.get('email')?.valueChanges.subscribe(() => {
      this.emailError = '';
    });

    this.loginForm.get('password')?.valueChanges.subscribe(() => {
      this.passwordError = '';
    });
  }

  submitForm() {
    if (this.loginForm.invalid) return;

    // Clear any previous errors
    this.passwordError = '';
    this.emailError = '';
    this.isSubmitting = true;

    this.service.login(this.loginForm.value).subscribe(
      (response: any) => {
        console.log("Login successful:", response);
        this.isSubmitting = false;

        // If we get here, login was successful, navigate to dashboard
        this.router.navigateByUrl("/dashboard");
      },
      (error: any) => {
        console.error("Login error in component:", error);
        this.isSubmitting = false;

        // Check if this is a user not found error
        if (error.userNotFound) {
          this.emailError = error.message || "There's no existing account with this email";
        }
        // Check for wrong password (usually 401 Unauthorized)
        else if (error.status === 401 || error.status === 403) {
          this.passwordError = "Wrong password";
        }
        // Handle other errors
        else {
          // Try to extract a meaningful error message
          let errorMessage = "Login failed. Please try again.";

          if (error instanceof HttpErrorResponse) {
            if (error.error && error.error.message) {
              errorMessage = error.error.message;
            }
          }

          // Decide where to display the error based on context
          if (errorMessage.toLowerCase().includes('password')) {
            this.passwordError = errorMessage;
          } else if (errorMessage.toLowerCase().includes('email') ||
                     errorMessage.toLowerCase().includes('user')) {
            this.emailError = errorMessage;
          } else {
            // Default to password error if we can't determine
            this.passwordError = errorMessage;
          }
        }
      }
    );
  }
}
