import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}  canActivate(): Observable<boolean> | boolean {
    // First check if token exists
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    // If token exists, verify it's still valid by checking current user
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (user) {
          return true;
        }
        
        // If no user in subject, try to fetch current user
        this.authService.getCurrentUser().subscribe({
          next: (fetchedUser) => {
            if (!fetchedUser) {
              this.router.navigate(['/login']);
            }
          },
          error: () => {
            this.router.navigate(['/login']);
          }
        });
        
        return true; // Allow navigation, let the service handle authentication errors
      })
    );
  }
}