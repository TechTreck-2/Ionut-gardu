import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:1337/api';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {
    if (this.isLocalStorageAvailable()) {
      const token = localStorage.getItem('jwt');
      if (token) {
        this.getCurrentUser().subscribe();
      }
    }
  }

  private isLocalStorageAvailable(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  login(identifier: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/local`, {
      identifier,
      password
    }).pipe(
      tap((response: any) => {
        if (this.isLocalStorageAvailable()) {
          localStorage.setItem('jwt', response.jwt);
        }
        this.currentUserSubject.next(response.user);
      })
    );
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/local/register`, {
      username,
      email,
      password
    }).pipe(
      tap((response: any) => {
        if (this.isLocalStorageAvailable()) {
          localStorage.setItem('jwt', response.jwt);
        }
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout() {
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem('jwt');
    }
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.API_URL}/users/me`).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
      })
    );
  }

  getToken(): string | null {
    return this.isLocalStorageAvailable() ? localStorage.getItem('jwt') : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}