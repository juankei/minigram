import { Component, inject, input, OnInit } from '@angular/core';
import { RestApiServiceService } from '../../services/rest-api.service.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-comments',
  imports: [CommonModule, FormsModule, MatIconModule],
  standalone: true, 
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css']
})
export class CommentsComponent implements OnInit {
  private api = inject(RestApiServiceService);

  readonly apiUrl = 'http://localhost:3000/uploads/';

  postId = input.required<string>();

  comments: any[] = [];
  newComment = '';

  ngOnInit() {
    this.loadComments();
  }

  loadComments() {
    this.api.getComments(this.postId()).subscribe({
      next: (data) => {
        this.comments = data;
      },
      error: (error) => console.error(error)
    });
  }

  addComment() {
    if (!this.newComment.trim()) return;

    this.api.createComment(this.postId(), this.newComment).subscribe({
      next: (data) => {
        this.comments.push(data);
        this.newComment = '';
      },
      error: (error) => console.error('Error al crear comentario:', error)
    });
  }

  isOwnComment(comment: any): boolean {
    return comment.username === this.api.getusername();
  }

  deleteComment(commentId: number) {

    this.api.deleteComment(commentId).subscribe({
      next: () => {
        this.comments = this.comments.filter((comment) => comment.id !== commentId);
      },
      error: (error) => console.error('Error al eliminar comentario:', error)
    });
  }
}
