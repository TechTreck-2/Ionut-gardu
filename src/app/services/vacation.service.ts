import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError, map, switchMap, firstValueFrom, tap } from 'rxjs';
import { VacationEntry } from '../models/vacation-entry.model';
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

interface StrapiVacationEntry {
  id: number;
  documentId: string;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  approvalState: string;
  users_permissions_user?: {
    id: number;
    username: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class VacationService {
  private apiUrl = `${environment.apiUrl}/api/vacation-entries`;
  private maxVacationDays = 21;
  entries: VacationEntry[] = [];
  vacationDaysLeft: number = this.maxVacationDays;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}  private handleError(error: HttpErrorResponse) {
    // Check if error is null or undefined
    if (!error) {
      console.error('Vacation Service - Undefined error received');
      return throwError(() => new Error('An unknown error occurred'));
    }
    
    console.error('Vacation Service - Error details:', {
      status: error.status,
      statusText: error.statusText,
      error: error.error,
      url: error.url,
      message: error.message
    });
    
    let errorMessage = 'An error occurred while processing your request';
    try {
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        // Network error
        errorMessage = 'A network error occurred. Please check your connection and try again.';
      } else if (error.error?.error?.details?.errors) {
        // Strapi validation error
        errorMessage = error.error.error.details.errors
          .map((err: any) => err.message)
          .join(', ');
      } else if (error.error?.error?.message) {
        // Other Strapi error
        errorMessage = error.error.error.message;
      } else {
        // Fallback error message
        errorMessage = `${error.status ? `Error ${error.status}: ` : ''}${error.message || 'Unknown error occurred'}`;
      }
    } catch (e) {
      errorMessage = 'Error processing response';
    }
    
    return throwError(() => new Error(errorMessage));
  }  private mapStrapiResponse(response: StrapiResponse<any>): StrapiVacationEntry[] {
    if (!response.data || !Array.isArray(response.data)) {
      console.error('Invalid response structure:', response);
      return [];
    }
    
    const result: StrapiVacationEntry[] = [];
      for (const item of response.data) {
      try {
        // Log the entire item structure to identify where documentId is stored
        //console.log('Raw Strapi item structure:', JSON.stringify(item, null, 2));
        
        // Check if the item has the correct structure
        const attributes = item.attributes || item;
        
        // Handle the case when response structure changes
        if (!attributes.startDate || !attributes.endDate) {
          //console.log('Skipping invalid entry:', item);
          continue;
        }
          const userId = attributes.users_permissions_user?.data?.id || 
                      attributes.users_permissions_user?.id || 
                      null;
                      
        // Enhanced logging for documentId handling
        const itemId = item.id || (typeof item === 'object' ? item.id || 0 : 0);
        // Look for documentId in multiple possible locations in the Strapi response structure
        const rawDocumentId = item.documentId || 
                              item.attributes?.documentId || 
                              attributes.documentId;
        const generatedDocumentId = itemId ? itemId.toString() : '';
        // Use the raw documentId if available, otherwise fall back to the generated ID
        const finalDocumentId = rawDocumentId || generatedDocumentId;
        
        
        
        const mappedEntry: StrapiVacationEntry = {
          id: itemId,
          documentId: finalDocumentId,
          startDate: attributes.startDate,
          endDate: attributes.endDate,
          duration: attributes.duration || 0,
          reason: attributes.reason || '',
          approvalState: attributes.approvalState || 'Pending',
          users_permissions_user: userId ? {
            id: userId,
            username: attributes.users_permissions_user?.data?.attributes?.username || 
                     attributes.users_permissions_user?.username || '',
            email: attributes.users_permissions_user?.data?.attributes?.email || 
                  attributes.users_permissions_user?.email || ''
          } : undefined
        };
        
        result.push(mappedEntry);
      } catch (error) {
        console.error('Invalid item structure:', item);
        // Instead of throwing an error, we'll just skip this item
        continue;
      }
    }
    
    return result;
  }  private mapToVacationEntry(strapiEntry: StrapiVacationEntry): VacationEntry {
    try {
      // Validate that approvalState is one of the allowed values
      const validStates = ['Pending', 'Approved', 'Rejected', 'Cancelled'];
      const approvalState = validStates.includes(strapiEntry.approvalState) 
        ? strapiEntry.approvalState as 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'
        : 'Pending';
        // Enhanced logging for documentId handling in final mapping
      const entryId = strapiEntry.id;
      const entryDocumentId = strapiEntry.documentId;
      const generatedDocumentId = strapiEntry.id ? strapiEntry.id.toString() : '';
      // Always preserve the original documentId and only fall back to the ID if documentId is not available
      const finalDocumentId = entryDocumentId || generatedDocumentId;
      
      
      
      return {
        id: strapiEntry.id,
        documentId: finalDocumentId,
        startDate: new Date(strapiEntry.startDate),
        endDate: new Date(strapiEntry.endDate),
        duration: strapiEntry.duration || 0,
        reason: strapiEntry.reason || '',
        status: approvalState
      };
    } catch (error) {
      console.error('Error mapping vacation entry:', error, strapiEntry);      // Return a default entry to prevent crashes
      console.error('Returning default VacationEntry due to mapping error');
      return {
        startDate: new Date(),
        endDate: new Date(),
        duration: 0,
        reason: 'Error loading data',
        status: 'Pending',
        documentId: 'error'
      };
    }
  }

  private getUserId(): Observable<number> {
    return this.authService.getCurrentUserId().pipe(
      map(id => {
        if (id === null) {
          throw new Error('User not authenticated');
        }
        return id;
      }),
      catchError(error => {
        console.error('Vacation Service - Error getting user ID:', error);
        return throwError(() => error);
      })
    );
  }  getVacationEntries(): Observable<VacationEntry[]> {
    //console.log('Fetching vacation entries from API...');
    return this.getUserId().pipe(
      switchMap(userId => {
        const url = `${this.apiUrl}?filters[users_permissions_user][id][$eq]=${userId}&populate=users_permissions_user`;
        return this.http.get<StrapiResponse<any>>(url).pipe(
          map(response => {
            //console.log('Raw response from Strapi API:', response);
            try {
              const mapped = this.mapStrapiResponse(response);
              //console.log('Mapped Strapi response (intermediate format):', mapped);
              return mapped.map(entry => this.mapToVacationEntry(entry));
            } catch (error) {
              console.error('Error mapping Strapi response:', error);
              return [];
            }
          })
        );
      }),
      catchError(error => {
        console.error('Error loading vacation entries:', error);
        return new Observable<VacationEntry[]>(observer => {
          observer.next([]);
          observer.complete();
        });
      })
    );
  }
  async saveVacationEntry(entry: VacationEntry): Promise<void> {
    const userId = await firstValueFrom(this.getUserId());
    
    //console.log('Saving vacation entry:', entry);
    
    const payload = {
      data: {
        startDate: entry.startDate.toISOString().split('T')[0],
        endDate: entry.endDate.toISOString().split('T')[0],
        duration: entry.duration,
        reason: entry.reason,
        approvalState: entry.status,
        // Remove documentId from payload - Strapi generates this automatically
        users_permissions_user: userId
      }
    };    try {
      await firstValueFrom(
        this.http.post<StrapiResponse<any>>(`${this.apiUrl}?populate=users_permissions_user`, payload).pipe(
          catchError(this.handleError)
        )
      );
      await this.updateVacationDaysLeft();
    } catch (error) {
      console.error('Error saving vacation entry:', error);
      throw error;
    }
  }
  async deleteVacationEntry(documentId: string): Promise<void> {
    //console.log('Deleting vacation entry with documentId:', documentId);
    try {
      await firstValueFrom(
        this.http.delete<void>(`${this.apiUrl}/${documentId}`).pipe(
          catchError(this.handleError)
        )
      );
      //console.log('Successfully deleted vacation entry with documentId:', documentId);
      await this.updateVacationDaysLeft();
    } catch (error) {
      console.error('Error deleting vacation entry:', error);
      throw error;
    }
  }  async updateVacationEntry(entry: VacationEntry): Promise<void> {
    if (!entry.id && !entry.documentId) {
      console.error('Cannot update entry without id or documentId', entry);
      throw new Error('Cannot update entry without id or documentId');
    }
    
    // Use the original documentId from API if available
    const documentId = entry.documentId || entry.id!.toString();
    
    console.log('Updating vacation entry with documentId:', documentId, 'Entry:', entry);
    
    const payload = {
      data: {
        startDate: entry.startDate.toISOString().split('T')[0],
        endDate: entry.endDate.toISOString().split('T')[0],
        duration: entry.duration,
        reason: entry.reason,
        approvalState: entry.status
        // Removed documentId from payload as it causes "Invalid key documentId" error
      }
    };

    try {
      console.log('Vacation service - Request details:', {
        url: `${this.apiUrl}/${documentId}`,
        method: 'PUT',
        payload: JSON.stringify(payload, null, 2),
        documentIdType: typeof documentId
      });
        // Add tap to log the successful response
      await firstValueFrom(
        this.http.put<StrapiResponse<any>>(`${this.apiUrl}/${documentId}?populate=users_permissions_user`, payload).pipe(
          tap(response => {
            console.log('Vacation service - Successful response:', {
              responseData: JSON.stringify(response, null, 2)
            });
          }),
          catchError((error: HttpErrorResponse) => {
            console.error('Vacation service - Detailed error:', {
              status: error.status,
              statusText: error.statusText,
              url: error.url, 
              errorBody: error.error ? JSON.stringify(error.error, null, 2) : 'No error body'
            });
            return this.handleError(error);
          })
        )
      );
      await this.updateVacationDaysLeft();
    } catch (error) {
      console.error('Error updating vacation entry:', error);
      throw error;
    }
  }

  async updateVacationDaysLeft(): Promise<void> {
    try {
      const entries = await firstValueFrom(this.getVacationEntries());
      const usedDays = entries.reduce(
        (total, entry) => total + entry.duration,
        0
      );
      this.vacationDaysLeft = this.maxVacationDays - usedDays;
    } catch (error) {
      console.error('Error updating vacation days left:', error);
      throw error;
    }
  }

  getVacationDaysLeft(): number {
    return this.vacationDaysLeft;
  }
  async isVacationDay(date: Date): Promise<boolean> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const entries = await firstValueFrom(this.getVacationEntries());
    
    return entries.some((vacation) => {
      const vacationStart = new Date(vacation.startDate);
      const vacationEnd = new Date(vacation.endDate);
      vacationStart.setHours(0, 0, 0, 0);
      vacationEnd.setHours(0, 0, 0, 0);      return (
        vacation.status === 'Approved' &&
        targetDate >= vacationStart &&
        targetDate <= vacationEnd
      );
    });
  }
}