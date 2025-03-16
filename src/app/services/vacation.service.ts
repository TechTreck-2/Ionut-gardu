import { Injectable } from '@angular/core';
import { VacationEntry } from '../models/vacation-entry.model';

@Injectable({
  providedIn: 'root'
})
export class VacationService {
  private storageKey = 'vacationEntries';

  getVacationEntries(): VacationEntry[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  saveVacationEntry(entry: VacationEntry): void {
    const entries = this.getVacationEntries();
    entries.push(entry);
    localStorage.setItem(this.storageKey, JSON.stringify(entries));
  }
}