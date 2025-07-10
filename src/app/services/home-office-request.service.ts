import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, tap } from 'rxjs';
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
      switchMap(userId => {        return this.http.get<any>(`${this.apiUrl}?filters[users_permissions_user][id][$eq]=${userId}&populate=*`)
          .pipe(            map((response: any) => {
              //console.log(' Raw Strapi API Response:', JSON.stringify(response, null, 2));
              
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
                    documentId: item.documentId,
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
        
        //console.log('📤 Sending to Strapi (CREATE):', JSON.stringify(requestData, null, 2));
        return this.http.post<any>(this.apiUrl, requestData).pipe(
          map(response => {
            //console.log('📥 Raw Strapi CREATE Response:', JSON.stringify(response, null, 2));
            return response;
          })
        );
      })
    );
  }  // Update an existing home office request
  updateEntry(documentId: string, entry: HomeOfficeRequestEntry): Observable<any> {
    const requestData = {
      data: {
        address: entry.address,
        startDate: entry.startDate,
        endDate: entry.endDate,
        approvalStatus: entry.status
      }
    };
    
    //console.log(' Sending to Strapi (UPDATE) with documentId:', documentId, JSON.stringify(requestData, null, 2));
    return this.http.put<any>(`${this.apiUrl}/${documentId}`, requestData).pipe(
      map(response => {
        //console.log(' Raw Strapi UPDATE Response:', JSON.stringify(response, null, 2));
        return response;
      })
    );
  }  // Delete a home office request
  deleteEntry(documentId: string): Observable<any> {
    //console.log(' Sending DELETE request to Strapi for documentId:', documentId);
    return this.http.delete<any>(`${this.apiUrl}/${documentId}`).pipe(
      map(response => {
        //console.log(' Raw Strapi DELETE Response:', JSON.stringify(response, null, 2));
        return response;
      })
    );
  }
}
