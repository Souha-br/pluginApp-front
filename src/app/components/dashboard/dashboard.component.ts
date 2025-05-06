import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { JwtService } from "src/app/service/jwt.service";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit {
  constructor(
    private service: JwtService,
    private router: Router
  ) {}

  ngOnInit() {
    this.hello();
  }

  hello() {
    this.service.hello().subscribe(
      (response: any) => {
        console.log("Réponse de l'API:", response);
      },
      (error: any) => {
        console.error("Erreur lors de l'appel à hello:", error);
        console.log("Status:", error.status);
        console.log("Error message:", error.message);
      }
    );
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
