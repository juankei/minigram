import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { map, Observable, catchError, of,  } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RestApiServiceService {
  private apiUrl = 'http://localhost:3000';
  private jwtToken = "jwtToken";
  private username = "username";
   isloggedIn =  signal<boolean>(false);
  constructor(private http: HttpClient) {
    // Al recargar la página, el estado se recupera del token guardado
    this.isloggedIn.set(!!localStorage.getItem('token'));
  }

  listPosts(): Observable<any> {

  const token = localStorage.getItem('token');

  console.log('Token enviado:', token);

  return this.http.get<any>(
    `${this.apiUrl}/posts/feed`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
}

login(username: string, password: string): Observable<{ success: boolean }> {

  return this.http.post<any>(
    `${this.apiUrl}/auth/login`,
    { username, password }
  ).pipe(

    map((data) => {

      console.log('RESPUESTA COMPLETA DEL BACKEND:', data);
      console.log('TOKEN RECIBIDO:', data.token);

      if (!data.token) {
        console.error('No se ha recibido ningún token');
        return { success: false };
      }

      this.jwtToken = data.token;
      this.username = username;

      localStorage.setItem('token', data.token);
      localStorage.setItem('username', username);

      this.isloggedIn.set(true);

      console.log('TOKEN GUARDADO:', localStorage.getItem('token'));

      return { success: true };
    }),

    catchError((error) => {
      console.error('ERROR EN LOGIN:', error);
      return of({ success: false });
    })
  );
}


logout(): void {

  // Remove authentication information
  localStorage.removeItem('token');
  localStorage.removeItem('username');

  // Reset variables
  this.jwtToken = '';
  this.username = '';

  // Update login status
  this.isloggedIn.set(false);

  console.log('Usuario desconectado');
  console.log(this.isloggedIn);
}

getusername(): string {
  return localStorage.getItem('username') || '';
}

getComments(postId: string): Observable<any[]> {
  return this.http.get<any[]>(
    `${this.apiUrl}/comments/list/${postId}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || this.jwtToken}`
      }
    }
  );
}
createComment(postId: string, comment: string): Observable<any> {
  return this.http.post<any>(
    `${this.apiUrl}/comments/create/${postId}`,
    { comment },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || this.jwtToken}`
      }
    }
  );
}


deleteComment(commentId: number): Observable<any> {
  return this.http.delete<any>(
    `${this.apiUrl}/comments/delete/${commentId}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || this.jwtToken}`
      }
    }
  );
}

switchLike(postId: string | number): Observable<{ hasLiked: boolean; newLikesCount: number }> {
  return this.http.get<{ hasLiked: boolean; newLikesCount: number }>(
    `${this.apiUrl}/likes/switchLike/${postId}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || this.jwtToken}`
      }
    }
  );
}

  deletePost(postId: string | number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/posts/delete-post/${postId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || this.jwtToken}`
        }
      }
    );
  }

  createPost(caption: string, image: File): Observable<any> {
    const formData = new FormData();
    formData.append('caption', caption);
    formData.append('image', image);

    return this.http.post<any>(
      `${this.apiUrl}/posts/create-post`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || this.jwtToken}`
        }
      }
    );
  }
}