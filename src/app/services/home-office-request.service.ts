import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { HomeOfficeRequestEntry } from '../models/home-office-request-entry.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class HomeOfficeRequestService {
  private apiUrl = `${environment.apiUrl}/api/home-office-requests`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Get all home office requests for the logged-in user
  getEntries(): Observable<HomeOfficeRequestEntry[]> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        return this.http.get<any>(`${this.apiUrl}?filters[users_permissions_user][id][$eq]=${userId}&populate=*`)
          .pipe(            map((response: any) => {
              //console.log('API Response:', response);
              
              // Handle case where response format is different than expected
              if (!response || !response.data) {
                console.error('Unexpected API response format:', response);
                return [];
              }
              
              // Try to handle both array and direct object responses
              const dataArray = Array.isArray(response.data) ? response.data : [response.data];
              
              // The items in the response don't have attributes property, the data is directly on the item
              return dataArray
                .filter((item: any) => item && item.id)
                .map((item: any) => {
                  return {
                    id: item.id,
                    address: item.address || '',
                    startDate: item.startDate ? new Date(item.startDate) : new Date(),
                    endDate: item.endDate ? new Date(item.endDate) : new Date(),
                    status: item.approvalStatus || 'pending'
                  };
                });
            })
          );
      })
    );
  }

  // Create a new home office request
  saveEntry(entry: HomeOfficeRequestEntry): Observable<any> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        const requestData = {
          data: {
            address: entry.address,
            startDate: entry.startDate,
            endDate: entry.endDate,
            approvalStatus: entry.status,
            users_permissions_user: userId
          }
        };
        
        return this.http.post<any>(this.apiUrl, requestData);
      })
    );
  }

  // Update an existing home office request
  updateEntry(id: number, entry: HomeOfficeRequestEntry): Observable<any> {
    const requestData = {
      data: {
        address: entry.address,
        startDate: entry.startDate,
        endDate: entry.endDate,
        approvalStatus: entry.status
      }
    };
    
    return this.http.put<any>(`${this.apiUrl}/${id}`, requestData);
  }

  // Delete a home office request
  deleteEntry(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
