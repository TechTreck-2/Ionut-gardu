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
    const savedData = localStorage.getItem('timeEntries');
    return savedData ? JSON.parse(savedData) : [];
  }

  private saveData(entries: TimeEntry[]) {
    localStorage.setItem('timeEntries', JSON.stringify(entries));
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
}