import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, switchMap, map, throwError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/api`;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private initialized = false;
  constructor(private http: HttpClient) {
    if (this.isLocalStorageAvailable()) {
      const token = localStorage.getItem('jwt');
      if (token) {
        // Token found, user will be fetched when needed
      }
    }
  }

  private isLocalStorageAvailable(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private initializeUserIfNeeded(): Observable<any> {
    if (!this.initialized && this.isLocalStorageAvailable() && localStorage.getItem('jwt')) {
      this.initialized = true;
      return this.getCurrentUser();
    }
    return of(null);
  }  login(identifier: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/local`, {
      identifier,
      password
    }).pipe(
      tap((response: any) => {
        if (this.isLocalStorageAvailable()) {
          localStorage.setItem('jwt', response.jwt);
        }
        this.currentUserSubject.next(response.user);
        
        // Fetch current user data asynchronously without blocking the login completion
        this.getCurrentUser().subscribe({
          next: (user) => {},
          error: (error) => console.error('Auth Service - Error refreshing user data:', error)
        });
      })
    );
  }  register(username: string, email: string, password: string): Observable<any> {
    const payload = { username, email, password };
    console.log('AuthService - Registration payload:', { username, email, password: '***' });
    
    return this.http.post(`${this.API_URL}/auth/local/register`, payload).pipe(
      tap((response: any) => {
        console.log('AuthService - Registration successful:', response);
        // Don't automatically log in the user after registration
        // Clear any existing authentication state to ensure clean login
        if (this.isLocalStorageAvailable()) {
          localStorage.removeItem('jwt');
        }
        this.currentUserSubject.next(null);
      }),
      catchError(error => {
        console.error('AuthService - Registration error:', error);
        console.error('AuthService - Error status:', error.status);
        console.error('AuthService - Error response:', error.error);
        return throwError(() => error);
      })
      // Remove the switchMap that automatically fetches current user
    );
  }
  logout() {
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem('jwt');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }getCurrentUser(): Observable<any> {
    return this.http.get(`${this.API_URL}/users/me`).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        if (error.status === 403) {
          this.logout();
        }
        return of(null);
      })
    );
  }
  getCurrentUserId(): Observable<number> {
    return this.initializeUserIfNeeded().pipe(
      switchMap(() => {
        const user = this.currentUserSubject.value;
        
        if (user?.id) {
          return of(user.id);
        }

        return this.getCurrentUser().pipe(
          map(user => {
            if (!user?.id) {
              throw new Error('User not authenticated');
            }
            return user.id;
          })
        );
      })
    );
  }
  getToken(): string | null {
    return this.isLocalStorageAvailable() ? localStorage.getItem('jwt') : null;
  }isAuthenticated(): boolean {
    return !!this.getToken();
  }
}