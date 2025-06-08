import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidenavComponent } from './components/sidenav/sidenav.component';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidenavComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'tt-project';
  authService = inject(AuthService);
}
