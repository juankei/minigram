import { Component, computed, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Timestamp } from 'rxjs/internal/types';
import { CommentsComponent } from '../comments/comments.component';
import { RestApiServiceService } from '../../services/rest-api.service.service';

type Data = {
    id: string;
    username: string;
    caption: string;
    image_filename: string;
    created_at: Timestamp<string>;
    avatar_filename: string | null;
    likes?: number;
    hasLiked?: boolean;
    comments?: any[];
}

@Component({
  selector: 'app-post',
  imports: [MatButtonModule, MatCardModule, MatIconModule, CommentsComponent],
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css']
})
export class PostComponent {
  post = input<Data | undefined>();
  // Avisa al feed para que quite el post de la lista
  deleted = output<string | number>();
  readonly apiUrl = 'http://localhost:3000/uploads/';

  // Estado local del like: se inicializa con lo que devuelve el feed
  private likeState = signal<{ likes: number; hasLiked: boolean } | null>(null);

  likes = computed(() => this.likeState()?.likes ?? Number(this.post()?.likes ?? 0));

  hasLiked = computed(() => this.likeState()?.hasLiked ?? !!this.post()?.hasLiked);
  
  likeLoading = signal(false);
  deleting = signal(false);

  private api = inject(RestApiServiceService);

  isOwnPost(post: Data): boolean {
    return post.username === this.api.getusername();
  }

  deletePost(postId: string | number) {
    if (this.deleting()) return;
    this.deleting.set(true);

    this.api.deletePost(postId).subscribe({
      next: () => this.deleted.emit(postId),
      error: (error) => console.error('Error al eliminar el post:', error)
    }).add(() => this.deleting.set(false));
  }

  toggleLike() {
    const p = this.post();
    if (!p || this.likeLoading()) return;

    this.likeLoading.set(true);

    this.api.switchLike(p.id).subscribe({
      next: ({ hasLiked, newLikesCount }) => {
        this.likeState.set({
          hasLiked,
          likes: Number(newLikesCount)
        });
      },
      error: (error) => console.error('Error al cambiar el like:', error)
    }).add(() => this.likeLoading.set(false));
  }
}
