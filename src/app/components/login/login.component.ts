import { Component } from '@angular/core';
import { JwtService } from "src/app/service/jwt.service";
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  user_name: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  submitted: boolean = false;  // Ajout de cette propriété

  constructor(
    private jwtService: JwtService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.submitted = true;

    if (this.user_name === '' || this.password === '') {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.jwtService.login(this.user_name, this.password).subscribe(
      (response) => {
        console.log('Login successful', response);
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      (error) => {
        this.isLoading = false;
        if (error.invalidCredentials) {
          this.errorMessage = "Nom d'utilisateur ou mot de passe incorrect";
        } else if (error.userNotFound) {
          this.errorMessage = "Utilisateur non trouvé";
        } else {
          this.errorMessage = "Une erreur s'est produite. Veuillez réessayer.";
        }
        console.error('Login error', error);
      }
    );
  }
}
