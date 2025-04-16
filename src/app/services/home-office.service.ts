import { Injectable } from '@angular/core';
import { HomeOfficeEntry } from '../models/home-office-entry.model';

@Injectable({
  providedIn: 'root'
})
export class HomeOfficeService {
  private readonly storageKey = 'homeOfficeEntries';

  constructor() { }

  // Get all entries from localStorage
  getEntries(): HomeOfficeEntry[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  // Save a new entry to localStorage
  saveEntry(entry: HomeOfficeEntry): void {
    const entries = this.getEntries();
    entries.push(entry);
    localStorage.setItem(this.storageKey, JSON.stringify(entries));
  }

  // Delete an entry by index
  deleteEntry(index: number): void {
    const entries = this.getEntries();
    if (index >= 0 && index < entries.length) {
      entries.splice(index, 1);
      localStorage.setItem(this.storageKey, JSON.stringify(entries));
    }
  }

  // Clear all entries from localStorage
  clearEntries(): void {
    localStorage.removeItem(this.storageKey);
  }
}