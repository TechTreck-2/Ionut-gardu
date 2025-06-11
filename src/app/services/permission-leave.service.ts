import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, tap, catchError } from 'rxjs';
import { PermissionEntry } from '../models/permission-entry.model';
import { PermissionLeaveApiService } from './permission-leave-api.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionLeaveService {
  // For reactive state management
  private entriesSubject = new BehaviorSubject<PermissionEntry[]>([]);
  public entries$ = this.entriesSubject.asObservable();
  
  private apiService = inject(PermissionLeaveApiService);
  
  constructor() {
    this.loadPermissionEntries();
  }
  
  private loadPermissionEntries(): void {
    this.apiService.getPermissionEntries()
      .pipe(
        catchError(error => {
          console.error('Failed to load entries from API', error);
          return of([]);
        })
      )
      .subscribe(entries => this.entriesSubject.next(entries));
  }

  getPermissionEntries(): PermissionEntry[] {
    return this.entriesSubject.value;
  }

  getPermissionEntriesAsync(): Observable<PermissionEntry[]> {
    return this.entries$;
  }

  savePermissionEntry(entry: PermissionEntry): Observable<PermissionEntry> {
    return this.apiService.createPermissionEntry(entry).pipe(
      tap(() => this.loadPermissionEntries()),
      catchError(error => {
        console.error('Failed to save entry to API', error);
        return of(entry);
      })
    );
  }

  deletePermissionEntry(entry: PermissionEntry): Observable<void> {
    if (!entry.id) {
      console.error('Cannot delete entry without an ID:', entry);
      return of(undefined);
    }
    
    return this.apiService.deletePermissionEntry(entry.id).pipe(
      tap(() => this.loadPermissionEntries()),
      catchError(error => {
        console.error('Failed to delete entry from API', error);
        return of(undefined);
      })
    );
  }

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
}