import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, switchMap, map } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:1337/api';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private initialized = false;

  constructor(private http: HttpClient) {
    if (this.isLocalStorageAvailable()) {
      const token = localStorage.getItem('jwt');
      //console.log('Auth Service - Initial token check:', !!token);
      if (token) {
        //console.log('Auth Service - Token found, will fetch user when needed');
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
  }

  login(identifier: string, password: string): Observable<any> {
    console.log('Auth Service - Attempting login for:', identifier);
    return this.http.post(`${this.API_URL}/auth/local`, {
      identifier,
      password
    }).pipe(
      tap((response: any) => {
        //console.log('Auth Service - Login successful, storing token');
        if (this.isLocalStorageAvailable()) {
          localStorage.setItem('jwt', response.jwt);
        }
        this.currentUserSubject.next(response.user);
      }),
      switchMap(() => this.getCurrentUser())
    );
  }

  register(username: string, email: string, password: string): Observable<any> {
    //console.log('Auth Service - Attempting registration for:', username);
    return this.http.post(`${this.API_URL}/auth/local/register`, {
      username,
      email,
      password
    }).pipe(
      tap((response: any) => {
        //console.log('Auth Service - Registration successful, storing token');
        if (this.isLocalStorageAvailable()) {
          localStorage.setItem('jwt', response.jwt);
        }
        this.currentUserSubject.next(response.user);
      }),
      switchMap(() => this.getCurrentUser())
    );
  }

  logout() {
    //console.log('Auth Service - Logging out');
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem('jwt');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): Observable<any> {
    //console.log('Auth Service - Fetching current user');
    return this.http.get(`${this.API_URL}/users/me`).pipe(
      tap(user => {
        //console.log('Auth Service - Current user fetched:', user);
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        //console.error('Auth Service - Error fetching current user:', error);
        if (error.status === 403) {
          this.logout();
        }
        return of(null);
      })
    );
  }

  getCurrentUserId(): Observable<number> {
    //console.log('Auth Service - Getting current user ID');
    return this.initializeUserIfNeeded().pipe(
      switchMap(() => {
        const user = this.currentUserSubject.value;
        
        if (user?.id) {
          //console.log('Auth Service - User ID found:', user.id);
          return of(user.id);
        }

        //console.log('Auth Service - No user ID found, fetching user data');
        return this.getCurrentUser().pipe(
          map(user => {
            if (!user?.id) {
              throw new Error('User not authenticated');
            }
            //console.log('Auth Service - User ID fetched:', user.id);
            return user.id;
          })
        );
      })
    );
  }

  getToken(): string | null {
    const token = this.isLocalStorageAvailable() ? localStorage.getItem('jwt') : null;
    //console.log('Auth Service - Getting token:', !!token);
    return token;
  }

  isAuthenticated(): boolean {
    const isAuth = !!this.getToken();
    //console.log('Auth Service - Checking authentication:', isAuth);
    return isAuth;
  }
}