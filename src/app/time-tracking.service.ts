import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface TimeEntry {
  date: string;
  hoursWorked: number;
}

@Injectable({
  providedIn: 'root'
})
export class TimeTrackingService {
  private timeEntriesSubject = new BehaviorSubject<TimeEntry[]>(this.loadData());
  timeEntries$ = this.timeEntriesSubject.asObservable();

  private loadData(): TimeEntry[] {
    if (this.isLocalStorageAvailable()) {
      const savedData = localStorage.getItem('timeEntries');
      return savedData ? JSON.parse(savedData) : [];
    }
    return [];
  }

  private saveData(entries: TimeEntry[]) {
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem('timeEntries', JSON.stringify(entries));
    }
  }

  getTimeEntries(): TimeEntry[] {
    return this.timeEntriesSubject.getValue();
  }

  addOrUpdateEntry(entry: TimeEntry) {
    const entries = this.getTimeEntries();
    const existingEntryIndex = entries.findIndex(e => e.date === entry.date);
    if (existingEntryIndex > -1) {
      entries[existingEntryIndex] = entry;
    } else {
      entries.push(entry);
    }
    this.timeEntriesSubject.next([...entries]);
    this.saveData(entries);
  }

  deleteEntry(date: string) {
    const entries = this.getTimeEntries().filter(e => e.date !== date);
    this.timeEntriesSubject.next([...entries]);
    this.saveData(entries);
  }

  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }
}