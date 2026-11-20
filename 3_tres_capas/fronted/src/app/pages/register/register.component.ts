import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RestApiServiceService } from '../../services/rest-api.service.service';

@Component({
  selector: 'app-register',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private readonly api = inject(RestApiServiceService);
  private readonly router = inject(Router);

  username = signal('');
  email = signal('');
  password = signal('');
  loading = signal(false);
  error = signal('');

  submit(event?: Event): void {
    event?.preventDefault();
    this.error.set('');
    this.loading.set(true);

    this.api.register(this.username(), this.email(), this.password()).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => {
        console.error('Error al registrar:', err);
        this.error.set(err?.error?.message ?? 'No se pudo registrar');
      }
    }).add(() => this.loading.set(false));
  }
}
