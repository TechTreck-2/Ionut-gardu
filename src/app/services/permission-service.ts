import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, catchError, map, switchMap } from 'rxjs';
import { 
  PermissionEntry, 
  StrapiPermissionEntry, 
  StrapiPermissionEntryResponse 
} from '../models/permission-entry.model';
import { AuthService } from './auth.service';

/**
 * Unified Permission Service
 * 
 * This service combines both the API layer and state management for permission entries.
 * It eliminates the need for two separate services and ensures consistent handling of documentId.
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  // API configuration
  private apiUrl = 'http://localhost:1337/api/permission-entries';
  
  // For reactive state management
  private entriesSubject = new BehaviorSubject<PermissionEntry[]>([]);
  public entries$ = this.entriesSubject.asObservable();
  
  // Injected services
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  constructor() {
    this.loadPermissionEntries();
  }

  // PUBLIC API METHODS
  
  /**
   * Get all permission entries from state
   */
  getPermissionEntries(): PermissionEntry[] {
    return this.entriesSubject.value;
  }

  /**
   * Get observable stream of permission entries
   */
  getPermissionEntriesAsync(): Observable<PermissionEntry[]> {
    return this.entries$;
  }

  /**
   * Create a new permission entry
   */
  savePermissionEntry(entry: PermissionEntry): Observable<PermissionEntry> {
    return this.createPermissionEntry(entry).pipe(
      tap(response => {
        //console.log('Created permission entry:', response);
        this.loadPermissionEntries();
      }),
      catchError(error => {
        console.error('Failed to save entry to API', error);
        return of(entry);
      })
    );
  }

  /**
   * Delete a permission entry
   */
  deletePermissionEntry(entry: PermissionEntry): Observable<void> {
    if (!entry.documentId) {
      console.error('Cannot delete entry without a documentId:', entry);
      return of(undefined);
    }
    
    return this.deletePermissionEntryApi(entry.documentId).pipe(
      tap(() => {
        //console.log(`Deleted permission entry with documentId: ${entry.documentId}`);
        this.loadPermissionEntries();
      }),
      catchError(error => {
        console.error('Failed to delete entry from API', error);
        return of(undefined);
      })
    );
  }

  /**
   * Calculate duration between start and end time
   */
  calculateDuration(entry: PermissionEntry): string {
    const startTimeParts = entry.startTime.split(':').map(Number);
    const endTimeParts = entry.endTime.split(':').map(Number);
  
    const startDate = new Date();
    startDate.setHours(startTimeParts[0], startTimeParts[1], 0, 0);
  
    const endDate = new Date();
    endDate.setHours(endTimeParts[0], endTimeParts[1], 0, 0);
  
    const durationInMilliseconds = endDate.getTime() - startDate.getTime();
  
    // Calculate hours, minutes, and seconds
    const hours = Math.floor(durationInMilliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((durationInMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationInMilliseconds % (1000 * 60)) / 1000);
  
    // Helper function to pad numbers with leading zeros
    const padWithZero = (num: number): string => num.toString().padStart(2, '0');
  
    // Format the result as a string
    return `${padWithZero(hours)}:${padWithZero(minutes)}:${padWithZero(seconds)}`;
  }

  /**
   * Update entry status
   */
  updateEntryStatus(entry: PermissionEntry, status: string): Observable<PermissionEntry> {
    if (!entry.documentId && !entry.id) {
      console.error('Cannot update entry without an ID or documentId:', entry);
      return of(entry);
    }
    
    const updatedEntry = { ...entry, status: status };
    // Use the documentId string for the API call
    const documentId = entry.documentId || (entry.id ? entry.id.toString() : '');
    
    if (!documentId) {
      console.error('Cannot update entry without a valid documentId:', entry);
      return of(entry);
    }
    
    return this.updatePermissionEntryApi(documentId, updatedEntry).pipe(
      tap(response => {
        //console.log(`Updated permission entry status to ${status}:`, response);
        this.loadPermissionEntries();
      }),
      catchError(error => {
        console.error(`Failed to update entry status to ${status}:`, error);
        return of(entry);
      })
    );
  }

  /**
   * Approve a permission entry
   */
  approvePermissionEntry(entry: PermissionEntry): Observable<PermissionEntry> {
    return this.updateEntryStatus(entry, 'Approved');
  }
    /**
   * Cancel a permission entry
   */
  cancelPermissionEntry(entry: PermissionEntry): Observable<PermissionEntry> {
    return this.updateEntryStatus(entry, 'Rejected');
  }

  // PRIVATE API METHODS
  
  /**
   * Load all permission entries from API and update state
   */
  private loadPermissionEntries(): void {
    this.getPermissionEntriesApi()
      .pipe(
        tap(response => {
          //console.log('Loaded permission entries:', response);
        }),
        catchError(error => {
          console.error('Failed to load entries from API', error);
          return of([]);
        })
      )
      .subscribe(entries => this.entriesSubject.next(entries));
  }

  /**
   * Get all permission entries from API
   */
  private getPermissionEntriesApi(): Observable<PermissionEntry[]> {
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

  /**
   * Get permission entry by ID
   */
  private getPermissionEntryById(id: number): Observable<PermissionEntry> {
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
  /**
   * Create permission entry in API
   */
  private createPermissionEntry(entry: PermissionEntry): Observable<PermissionEntry> {
    return this.authService.getCurrentUserId().pipe(
      catchError(error => {
        console.error('Failed to get current user ID:', error);
        return of(null); // Return null if user ID can't be fetched
      }),
      map(userId => {
        // Generate a unique documentId if not provided
        if (!entry.documentId) {
          // Create a unique ID that's more than just a number
          entry.documentId = 'perm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
        }        // Make sure we're using the correct status value based on schema
        const approvalStatus = entry.status === 'Cancelled' ? 'Rejected' : entry.status;
        
        const strapiData = {
          data: {
            date: entry.date,
            startTime: entry.startTime,
            endTime: entry.endTime,
            approvalStatus: approvalStatus, // Make sure we use the correct field name and allowed values
            users_permissions_user: userId || undefined
            // Note: documentId is auto-generated by Strapi and should not be included in create requests
          }
        };
        return strapiData;
      }),
      switchMap(strapiData => 
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
            }),            catchError(error => {
              console.error('Error creating permission entry:', error);
              console.error('Error details:', {
                status: error.status,
                statusText: error.statusText,
                message: error.message,
                errorBody: error.error ? JSON.stringify(error.error, null, 2) : 'No error body',
                requestUrl: this.apiUrl,
                requestPayload: strapiData
              });
              return of(entry); // Return original entry in case of error
            })
          )
      )
    );
  }

  /**
   * Update permission entry in API
   */  private updatePermissionEntryApi(documentId: string, entry: PermissionEntry): Observable<PermissionEntry> {
    // Make sure we convert 'Cancelled' to 'Rejected' to match backend schema
    const approvalStatus = entry.status === 'Cancelled' ? 'Rejected' : entry.status;
    
    const strapiData = {
      data: {
        date: entry.date,
        startTime: entry.startTime,
        endTime: entry.endTime,
        approvalStatus: approvalStatus
        // Intentionally not including documentId to avoid "Invalid key documentId" error
      }
    };
      
    //console.log(`Updating permission entry with documentId: ${documentId}`, strapiData);
    return this.http.put<any>(`${this.apiUrl}/${documentId}`, strapiData)
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
          // Log detailed error information
          console.error(`Error updating permission entry with documentId ${documentId}:`, {
            url: `${this.apiUrl}/${documentId}`,
            requestPayload: strapiData,
            responseStatus: error.status,
            statusText: error.statusText,
            errorObject: error,
            errorBody: error.error ? JSON.stringify(error.error, null, 2) : 'No error body'
          });
          return of(entry);
        })
      );
  }

  /**
   * Delete permission entry in API
   */
  private deletePermissionEntryApi(documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${documentId}`).pipe(
      tap(() => {
        
      }),
      catchError(error => {
        console.error(`Error deleting permission entry with documentId ${documentId}:`, error);
        throw error;
      })
    );
  }

  // DATA MAPPING UTILITIES
  
  /**
   * Map Strapi response to permission entries
   */
  private mapToPermissionEntries(response: StrapiPermissionEntryResponse | any): PermissionEntry[] {
    
    
    // Handle standard Strapi response format
    if (response && Array.isArray(response.data)) {
      //console.log(`Processing ${response.data.length} permission entries from standard Strapi format`);
      return response.data.map((item: any) => this.mapToPermissionEntry(item));
    }
    
    // Handle direct array response
    if (Array.isArray(response)) {
      //console.log(`Processing ${response.length} permission entries from direct array format`);
      return response.map((item: any) => this.mapToPermissionEntry(item));
    }
    
    console.error('Unsupported response format:', response);
    return [];
  }
  /**
   * Map Strapi item to permission entry
   */
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
    
      // Extract documentId from different possible locations or generate from id
    const entryId = item.id;
    // Look for documentId in all possible locations in the response
    const rawDocumentId = item.documentId || 
                         (item.attributes && item.attributes.documentId);
    // Generate a fallback documentId from the numeric ID
    const generatedDocumentId = entryId ? entryId.toString() : '';
    // Always preserve the original documentId and only fall back to the ID if documentId is not available
    // Ensure that documentId is always a string
    const finalDocumentId = rawDocumentId ? rawDocumentId.toString() : generatedDocumentId;
    
    
    
    // Check if the response is in the expected format with attributes
    if (item.attributes) {
      return {
        id: item.id,
        documentId: finalDocumentId,
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
        documentId: finalDocumentId,
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
