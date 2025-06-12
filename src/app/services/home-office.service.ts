import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { HomeOfficeEntry, HomeOfficeResponse } from '../models/home-office-entry.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HomeOfficeService {
  private apiUrl = `${environment.apiUrl}/api/home-office-locations`;

  constructor(private http: HttpClient) { }

  // Get entries from Strapi API for the current user
  getEntries(): Observable<HomeOfficeEntry[]> {
    const headers = this.getAuthHeaders();
    const userId = this.getCurrentUserId();
    
    // If no user ID is available, return an empty array
    if (!userId) {
      console.warn('No user ID available, returning empty locations array');
      return of([]);
    }
    
    // Log the request being made
    console.log(`Fetching locations for user ID: ${userId}`);
    
    // Filter by current user using Strapi's filtering
    return this.http.get<any>(
      `${this.apiUrl}?filters[users_permissions_user][id][$eq]=${userId}&populate=users_permissions_user`,
      { headers }
    ).pipe(
      map(response => {
        console.log('Strapi response for getEntries:', response);
        
        // Check if the response has the expected structure
        if (!response) {
          console.warn('Empty response from Strapi');
          return [];
        }
        
        // Determine if we're dealing with standard Strapi format or a different format
        const dataArray = response.data || response || [];
        console.log('Data array to process:', dataArray);
        
        // Map the data to our model
        return dataArray.map((item: any) => {
          try {
            console.log('Processing item:', item);
            
            // Handle different response formats
            if (item.attributes) {
              // Standard Strapi format
              return {
                id: item.id,
                documentId: item.documentId || item.id.toString(), // Use documentId if available, otherwise convert id to string
                address: item.attributes.address,
                createdAt: item.attributes.createdAt,
                updatedAt: item.attributes.updatedAt,
                publishedAt: item.attributes.publishedAt,
                users_permissions_user: item.attributes.users_permissions_user?.data ? {
                  id: item.attributes.users_permissions_user.data.id,
                  username: item.attributes.users_permissions_user.data.attributes.username
                } : {
                  id: userId as number,
                  username: ''
                }
              };
            } else {
              // Data is directly on the item
              return {
                id: item.id || 0,
                documentId: item.documentId || (item.id ? item.id.toString() : ''),
                address: item.address || 'Unknown address',
                createdAt: item.createdAt || new Date().toISOString(),
                updatedAt: item.updatedAt || new Date().toISOString(),
                publishedAt: item.publishedAt || new Date().toISOString(),
                users_permissions_user: item.users_permissions_user || {
                  id: userId as number,
                  username: ''
                }
              };
            }          } catch (error) {
            console.error('Error mapping location item:', error, item);
            // Return a minimal valid item if there's an error parsing a specific item
            return {
              id: item.id || 0,
              documentId: item.documentId || (item.id ? item.id.toString() : ''),
              address: item.address || 'Unknown address',
              createdAt: item.createdAt || new Date().toISOString(),
              updatedAt: item.updatedAt || new Date().toISOString(),
              publishedAt: item.publishedAt || new Date().toISOString()
            };
          }
        });
      }),
      catchError(err => {
        console.error('Error fetching home office locations', err);
        return of([]);
      })
    );
  }

  // Save a new entry to Strapi
  saveEntry(entry: HomeOfficeEntry): Observable<HomeOfficeEntry> {
    const headers = this.getAuthHeaders();
    const userId = this.getCurrentUserId();
    
    // Log the data we're sending to better understand any issues
    console.log('Sending data to Strapi:', {
      address: entry.address,
      userId: userId
    });
    
    // Format the data according to Strapi's structure
    const data = {
      data: {
        address: entry.address,
        users_permissions_user: userId
      }
    };
    
    // Log the full request payload
    console.log('Full request payload:', data);
    
    return this.http.post<any>(`${this.apiUrl}`, data, { headers }).pipe(
      map(response => {
        // Log the response to see its actual structure
        console.log('Strapi response for saveEntry:', response);
        
        // Handle different response structures that Strapi might return
        try {
          if (response && response.data && response.data.attributes) {
            // Standard Strapi response format
            return {
              id: response.data.id,
              documentId: response.data.id.toString(),
              address: response.data.attributes.address,
              createdAt: response.data.attributes.createdAt,
              updatedAt: response.data.attributes.updatedAt,
              publishedAt: response.data.attributes.publishedAt,
              users_permissions_user: {
                id: userId as number,
                username: ''
              }
            };
          } else if (response && response.data) {
            // Data object without attributes
            return {
              id: response.data.id || 0,
              documentId: response.data.documentId || response.data.id.toString(),
              address: response.data.address || entry.address,
              createdAt: response.data.createdAt || new Date().toISOString(),
              updatedAt: response.data.updatedAt || new Date().toISOString(),
              publishedAt: response.data.publishedAt || new Date().toISOString(),
              users_permissions_user: {
                id: userId as number,
                username: ''
              }
            };
          } else {
            // If response structure is completely different, try to extract what we can
            return {
              id: response?.id || 0,
              documentId: response?.documentId || response?.id?.toString() || '',
              address: response?.address || entry.address,
              createdAt: response?.createdAt || new Date().toISOString(),
              updatedAt: response?.updatedAt || new Date().toISOString(),
              publishedAt: response?.publishedAt || new Date().toISOString(),
              users_permissions_user: {
                id: userId as number,
                username: ''
              }
            };
          }
        } catch (error) {
          console.error('Error parsing Strapi response:', error);
          throw new Error('Failed to parse Strapi response');
        }
      }),
      catchError(err => {
        console.error('Error saving home office location', err);
        throw err;
      })
    );
  }

  // Delete an entry by documentId
  deleteEntry(documentId: string): Observable<any> {
    if (!documentId) {
      console.error('Attempted to delete entry with no documentId');
      return throwError(() => new Error('No documentId provided for deletion'));
    }
    
    const headers = this.getAuthHeaders();
    console.log(`Deleting entry with documentId: ${documentId}`);
    
    return this.http.delete(`${this.apiUrl}/${documentId}`, { headers }).pipe(
      tap(response => console.log('Delete response:', response)),
      catchError(err => {
        console.error('Error deleting home office location', err);
        throw err;
      })
    );
  }

  // Helper method to get auth headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt');
    
    if (!token) {
      console.warn('No JWT token found in localStorage');
      // Return basic headers without authorization
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }
    
    console.log('Using JWT token for request');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
  
  // Get current user ID from JWT token
  private getCurrentUserId(): number | null {
    const token = localStorage.getItem('jwt');
    if (!token) {
      console.warn('No JWT token found in localStorage');
      return null;
    }
    
    try {
      const decoded: any = this.decodeJwt(token);
      if (!decoded || !decoded.id) {
        console.warn('JWT token does not contain user ID');
        return null;
      }
      
      console.log(`Current user ID from JWT: ${decoded.id}`);
      return decoded.id;
    } catch (error) {
      console.error('Error decoding JWT', error);
      return null;
    }
  }
  
  // Simple JWT decode implementation
  private decodeJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        console.error('Invalid JWT format, missing payload section');
        return null;
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to decode JWT token:', e);
      return null;
    }
  }
}