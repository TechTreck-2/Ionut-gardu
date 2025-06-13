import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, catchError, of } from 'rxjs';
import { 
  PermissionEntry, 
  StrapiPermissionEntry, 
  StrapiPermissionEntryResponse 
} from '../models/permission-entry.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionLeaveApiService {
  private apiUrl = 'http://localhost:1337/api/permission-entries';
  private authService = inject(AuthService);

  constructor(private http: HttpClient) {}
  getPermissionEntries(): Observable<PermissionEntry[]> {
    return this.authService.getCurrentUserId().pipe(
      catchError(error => {
        console.error('Failed to get current user ID:', error);
        return of(null); // Return null if user ID can't be fetched
      }),
      switchMap(userId => {
        // If there's no user ID, return an empty array
        if (!userId) {
          console.warn('No user ID available, returning empty entries array');
          return of([]);
        }

        // Build the URL with filter for current user
        const url = `${this.apiUrl}?filters[users_permissions_user][id][$eq]=${userId}&populate=users_permissions_user`;
        //console.log(`Fetching permission entries for user ID: ${userId}`);
        
        return this.http.get<any>(url)
          .pipe(
            map(response => {
              if (!response) {
                console.error('Empty API response for permission entries');
                return [];
              }
              
              return this.mapToPermissionEntries(response);
            }),
            catchError(error => {
              console.error('Error fetching permission entries:', error);
              return of([]);
            })
          );
      })
    );
  }
  getPermissionEntryById(id: number): Observable<PermissionEntry> {
    return this.http.get<any>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (!response) {
            throw new Error('Permission entry not found');
          }
          
          // Handle Strapi response format with data property
          if (response.data) {
            return this.mapToPermissionEntry(response.data);
          }
          
          // Handle direct response format
          return this.mapToPermissionEntry(response);
        }),
        catchError(error => {
          console.error(`Error fetching permission entry with ID ${id}:`, error);
          throw error;
        })
      );
  }

  createPermissionEntry(entry: PermissionEntry): Observable<PermissionEntry> {
    return this.authService.getCurrentUserId().pipe(
      catchError(error => {
        console.error('Failed to get current user ID:', error);
        return of(null); // Return null if user ID can't be fetched
      }),
      map(userId => {
        const strapiData = {
          data: {
            date: entry.date,
            startTime: entry.startTime,
            endTime: entry.endTime,
            approvalStatus: entry.status,
            users_permissions_user: userId || undefined
          }
        };
        return strapiData;
      }),      switchMap(strapiData => 
        this.http.post<any>(this.apiUrl, strapiData)
          .pipe(
            map(response => {
              if (!response) {
                console.error('Empty API response');
                return entry; // Return the original entry if response is empty
              }
              
              // Handle Strapi response format with data property
              if (response.data) {
                return this.mapToPermissionEntry(response.data);
              }
              
              // Handle direct response format
              return this.mapToPermissionEntry(response);
            }),
            catchError(error => {
              console.error('Error creating permission entry:', error);
              return of(entry); // Return original entry in case of error
            })
          )
      )
    );
  }
  updatePermissionEntry(id: number, entry: PermissionEntry): Observable<PermissionEntry> {
    const strapiData = {
      data: {
        date: entry.date,
        startTime: entry.startTime,
        endTime: entry.endTime,
        approvalStatus: entry.status
      }
    };
    return this.http.put<any>(`${this.apiUrl}/${id}`, strapiData)
      .pipe(
        map(response => {
          if (!response) {
            console.error('Empty API response');
            return entry;
          }
          
          // Handle Strapi response format with data property
          if (response.data) {
            return this.mapToPermissionEntry(response.data);
          }
          
          // Handle direct response format
          return this.mapToPermissionEntry(response);
        }),
        catchError(error => {
          console.error(`Error updating permission entry with ID ${id}:`, error);
          return of(entry);
        })
      );
  }

  deletePermissionEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error deleting permission entry with ID ${id}:`, error);
        throw error;
      })
    );
  }  private mapToPermissionEntries(response: StrapiPermissionEntryResponse | any): PermissionEntry[] {
    // Handle standard Strapi response format
    if (response && Array.isArray(response.data)) {
      return response.data.map((item: any) => this.mapToPermissionEntry(item));
    }
    
    // Handle direct array response
    if (Array.isArray(response)) {
      return response.map((item: any) => this.mapToPermissionEntry(item));
    }
    
    console.error('Unsupported response format:', response);
    return [];
  }
  private mapToPermissionEntry(item: StrapiPermissionEntry | any): PermissionEntry {
    if (!item) {
      console.error('Missing Strapi permission entry data');
      return {
        date: '',
        startTime: '',
        endTime: '',
        status: 'Pending'
      };
    }
    
    // Check if the response is in the expected format with attributes
    if (item.attributes) {
      return {
        id: item.id,
        date: item.attributes.date,
        startTime: item.attributes.startTime,
        endTime: item.attributes.endTime,
        status: item.attributes.approvalStatus,
        user: item.attributes.users_permissions_user?.data?.id
      };
    }
    
    // Handle direct response format (without attributes nesting)
    if (item.date && item.startTime && item.endTime) {
      return {
        id: item.id,
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        // Handle both status or approvalStatus field names
        status: item.status || item.approvalStatus || 'Pending',
        user: item.users_permissions_user || item.user
      };
    }
    
    console.error('Unsupported Strapi permission entry format:', item);
    return {
      date: '',
      startTime: '',
      endTime: '',
      status: 'Pending'
    };
  }
}
