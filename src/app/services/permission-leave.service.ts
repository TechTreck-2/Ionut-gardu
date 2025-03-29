import { Injectable } from '@angular/core';
import { PermissionEntry } from '../models/permission-entry.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionLeaveService {
  private storageKey = 'permissionEntries';

  getPermissionEntries(): PermissionEntry[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  savePermissionEntry(entry: PermissionEntry): void {
    const entries = this.getPermissionEntries();
    entries.push(entry);
    localStorage.setItem(this.storageKey, JSON.stringify(entries));
  }

  deletePermissionEntry(entry: PermissionEntry): void {
    const entries = this.getPermissionEntries();
    const index = entries.findIndex(e => e.startTime === entry.startTime && e.endTime === entry.endTime);
    if (index > -1) {
      entries.splice(index, 1);
      localStorage.setItem(this.storageKey, JSON.stringify(entries));
    }
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