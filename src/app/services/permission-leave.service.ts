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

  calculateDuration(entry: PermissionEntry): number {
    return entry.endTime - entry.startTime;
  }
}