import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError, map, switchMap, of, tap, filter } from 'rxjs';
import { TimeEntry } from '../models/time-entry.model';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';

interface StrapiResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface StrapiTimeEntry {
  id: number;
  documentId: string;
  date: string;
  clockInTime?: string;
  clockOutTime?: string;
  users_permissions_user?: {
    id: number;
    username: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TimeEntryService {
  private apiUrl = `${environment.apiUrl}/api/time-entries`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private handleError(error: HttpErrorResponse) {
    console.error('Time Entry Service - Error details:', {
      status: error.status,
      statusText: error.statusText,
      error: error.error,
      url: error.url
    });
    
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error?.error?.message) {
        errorMessage += `\nDetails: ${error.error.error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }

  private mapStrapiResponse(response: StrapiResponse<any>): StrapiTimeEntry[] {
    ////console.log('Mapping Strapi response:', JSON.stringify(response, null, 2));
    if (!response.data || !Array.isArray(response.data)) {
      console.error('Invalid response structure:', response);
      return [];
    }
    
    return response.data.map(item => {
      ////console.log('Mapping item:', JSON.stringify(item, null, 2));
      
      const mappedEntry: StrapiTimeEntry = {
        id: item.id,
        documentId: item.documentId || item.id.toString(),
        date: item.date,
        clockInTime: item.clockInTime,
        clockOutTime: item.clockOutTime,
        users_permissions_user: item.users_permissions_user
      };
      
      ////console.log('Mapped entry:', mappedEntry);
      return mappedEntry;
    });
  }

  private getUserId(): Observable<number> {
    return this.authService.getCurrentUserId().pipe(
      filter((id): id is number => id !== null),
      //tap(userId => //console.log('Time Entry Service - User ID received:', userId)),
      catchError(error => {
        console.error('Time Entry Service - Error getting user ID:', error);
        return throwError(() => new Error('User not authenticated'));
      })
    );
  }

  getTimeEntries(): Observable<StrapiTimeEntry[]> {
    ////console.log('Time Entry Service - Fetching all time entries');
    return this.http.get<StrapiResponse<any>>(`${this.apiUrl}?populate=*`).pipe(
      //tap(response => //console.log('Time Entry Service - Raw response:', JSON.stringify(response, null, 2))),
      map(response => this.mapStrapiResponse(response)),
      switchMap(entries => {
        return this.getUserId().pipe(
          map(userId => entries.filter(entry => 
            entry.users_permissions_user?.id === userId
          ))
        );
      }),
      catchError(error => {
        console.error('Time Entry Service - Error in getTimeEntries:', error);
        return this.handleError(error);
      })
    );
  }

  getTimeEntry(documentId: string): Observable<StrapiTimeEntry> {
    //console.log('Time Entry Service - Fetching time entry:', documentId);
    return this.http.get<{ data: { id: number; attributes: any } }>(`${this.apiUrl}/${documentId}?populate=*`).pipe(
      map(response => ({
        id: response.data.id,
        documentId,
        ...response.data.attributes
      })),
      catchError(this.handleError)
    );
  }

  createTimeEntry(timeEntry: Partial<TimeEntry>): Observable<StrapiTimeEntry> {

    return this.getUserId().pipe(
      switchMap(userId => {
        const { date, clockInTime, clockOutTime } = timeEntry;
        const payload = {
          data: {
            date,
            clockInTime,
            clockOutTime,
            users_permissions_user: userId
          }
        };

        //console.log('Time Entry Service - Request payload:', JSON.stringify(payload, null, 2));
        //console.log('Time Entry Service - Request URL:', `${this.apiUrl}?populate=*`);
        
        return this.http.post<{ data: { id: number; documentId: string; attributes: any } }>(`${this.apiUrl}?populate=*`, payload).pipe(
          map(response => {
            //console.log('Time Entry Service - Create response:', JSON.stringify(response, null, 2));
            return {
              id: response.data.id,
              documentId: response.data.documentId,
              ...response.data.attributes
            };
          })
        );
      }),
      catchError(error => {
        console.error('Time Entry Service - Create error:', error);
        return this.handleError(error);
      })
    );
  }

  updateTimeEntry(documentId: string, timeEntry: Partial<TimeEntry>): Observable<StrapiTimeEntry> {
    ////console.log('Time Entry Service - Updating time entry:', { documentId, timeEntry });
    return this.getUserId().pipe(
      switchMap(userId => {
        const { date, clockInTime, clockOutTime } = timeEntry;
        const payload = { 
          data: {
            date,
            clockInTime,
            clockOutTime,
            users_permissions_user: userId
          }
        };
        return this.http.put<{ data: { id: number; documentId: string; attributes: any } }>(`${this.apiUrl}/${documentId}`, payload).pipe(
          map(response => ({
            id: response.data.id,
            documentId: response.data.documentId,
            ...response.data.attributes
          }))
        );
      }),
      catchError(this.handleError)
    );
  }

  deleteTimeEntry(documentId: string): Observable<void> {
    //console.log('Time Entry Service - Deleting time entry:', documentId);
    return this.http.delete<void>(`${this.apiUrl}/${documentId}`).pipe(
      catchError(this.handleError)
    );
  }

  getTimeEntryByDate(date: string): Observable<StrapiTimeEntry[]> {
    ////console.log('Time Entry Service - Fetching time entries for date:', date);
    return this.http.get<StrapiResponse<any>>(`${this.apiUrl}?populate=*`).pipe(
      switchMap(response => {
        ////console.log('Time Entry Service - Raw response:', response);
        const entries = this.mapStrapiResponse(response);
        return this.getUserId().pipe(
          map(userId => entries.filter(entry => 
            entry.date === date && 
            entry.users_permissions_user?.id === userId
          ))
        );
      }),
      catchError(this.handleError)
    );
  }
}