import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RestApiServiceService } from '../../services/rest-api.service.service';

@Component({
  selector: 'app-create-post',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
  ],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.css']
})
export class CreatePostComponent {
  private readonly api = inject(RestApiServiceService);
  private readonly router = inject(Router);

  caption = signal('');
  image = signal<File | null>(null);
  loading = signal(false);
  message = signal('');
  error = signal('');

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.image.set(input.files?.[0] ?? null);
    this.error.set('');
  }

  submit(): void {
    const file = this.image();
    if (!file) {
      this.error.set('Selecciona una imagen');
      this.message.set('');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.message.set('');

    this.api.createPost(this.caption(), file).subscribe({
      next: () => {
        this.message.set('Post creado correctamente');
        this.caption.set('');
        this.image.set(null);
        // La página es independiente: al publicar volvemos al feed
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error('Error al crear el post:', err);
        this.error.set(err?.error?.message ?? 'No se pudo crear el post');
      }
    }).add(() => this.loading.set(false));
  }
}
