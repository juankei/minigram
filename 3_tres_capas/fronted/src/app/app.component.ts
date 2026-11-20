import { Component,signal } from '@angular/core';
import { RestApiServiceService } from './services/rest-api.service.service';
import { RouterOutlet,RouterLink, Router } from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatIconModule, MatButtonModule, MatToolbarModule ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
protected readonly title = signal('fronted');
constructor(public restApiService: RestApiServiceService, private router: Router) {}

onLogout() {
  this.restApiService.logout();
  console.log('Usuario desconectado');
  this.router.navigate(['/login']);
}
}
