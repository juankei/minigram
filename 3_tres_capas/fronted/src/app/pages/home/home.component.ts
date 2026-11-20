import { Component } from '@angular/core';
import { RestApiServiceService } from '../../services/rest-api.service.service';
import { PostComponent } from '../../components/post/post.component';
@Component({
  selector: 'app-home',
  imports: [PostComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  posts: any[] = [];
restApiService: any;

  constructor(private apiService: RestApiServiceService) {
    this.restApiService = apiService;
    this.loadPosts();
  }

  loadPosts() {
    this.apiService.listPosts().subscribe((response: any) => {
      this.posts = response.posts;
    });
  }

  onPostDeleted(postId: string | number) {
    this.posts = this.posts.filter((post) => post.id !== postId);
  }
}
