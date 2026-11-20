import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RestApiServiceService } from '../../services/rest-api.service.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  private readonly api = inject(RestApiServiceService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    // /auth/logout del backend redirige aquí con ?logout=1:
    // el token JWT se elimina en el cliente.
    if (this.route.snapshot.queryParamMap.has('logout')) {
      this.api.logout();
    }
  }

  hide = signal(true);
  username = signal('');
  password = signal('');

  updateUsername(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.username.set(inputElement.value);
  }

  updatePassword(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.password.set(inputElement.value);
  }

  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

login(event?: Event) {
  event?.preventDefault();
  console.log('Username:', this.username());

  this.api.login(this.username(), this.password())
    .subscribe({
      next: (response) => {

        if (response.success) {
          console.log('Login correcto');

          console.log(
            'Token guardado:',
            localStorage.getItem('token')
          );

          this.router.navigate(['/home']);

        } else {
          console.log('Login incorrecto');
        }
      },

      error: (error) => {
        console.error('Error al iniciar sesión:', error);
      }
    });
}

}