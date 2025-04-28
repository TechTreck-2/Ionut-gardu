import { Injectable } from '@angular/core';
import { HomeOfficeRequestEntry } from '../models/home-office-request-entry.model';

@Injectable({
  providedIn: 'root'
})
export class HomeOfficeRequestService {
  private readonly storageKey = 'homeOfficeRequests';

  getEntries(): HomeOfficeRequestEntry[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  saveEntry(entry: HomeOfficeRequestEntry): void {
    const entries = this.getEntries();
    entries.push(entry);
    localStorage.setItem(this.storageKey, JSON.stringify(entries));
  }

  deleteEntry(entry: HomeOfficeRequestEntry): void {
    const entries = this.getEntries().filter(
      e => !(e.startDate === entry.startDate && e.endDate === entry.endDate && e.address === entry.address)
    );
    localStorage.setItem(this.storageKey, JSON.stringify(entries));
  }

  clearEntries(): void {
    localStorage.removeItem(this.storageKey);
  }
}
