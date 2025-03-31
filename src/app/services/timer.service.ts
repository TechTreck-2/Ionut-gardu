import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { VacationService } from './vacation.service';
import { VacationEntry } from '../models/vacation-entry.model';
import { TimeEntry } from '../models/time-entry.model';

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  private timeSubject = new BehaviorSubject<number>(0);
  time$ = this.timeSubject.asObservable();
  private intervalSubscription: Subscription | null = null;
  private isRunning = false;
  private firstClockIn: Date | null = null;
  private clockOutTime: Date | null = null;
  vacationEntries: VacationEntry[] = [];
  vacationService = inject(VacationService);
  constructor() {
    this.loadState();
  }

  get runningStatus() {
    return this.isRunning;
  }

  startTimer() {
    if (!this.isRunning) {
      const newClockInDate = new Date();

      if (this.firstClockIn && this.clockOutTime) {
        if (
          newClockInDate > this.firstClockIn &&
          newClockInDate < this.clockOutTime
        ) {
          return 'The new clock-in date is between the existing clock-in and clock-out times.';
        }
      }

      this.isRunning = true;
      if (!this.firstClockIn) {
        this.firstClockIn = newClockInDate;
      }
      this.clockOutTime = null;
      this.intervalSubscription = interval(1000).subscribe(() => {
        this.timeSubject.next(this.timeSubject.value + 1);
        this.saveState();
      });

      return 'Tracking started.';
    }

    return 'Tracking is already running.';
  }

  stopTimer() {
    if (this.isRunning) {
      this.isRunning = false;
      this.clockOutTime = new Date();
      this.intervalSubscription?.unsubscribe();
      this.saveState();
    }
  }

  resetTimer() {
    this.isRunning = false;
    this.firstClockIn = null;
    this.clockOutTime = null;
    this.timeSubject.next(0);
    this.intervalSubscription?.unsubscribe();

    const today = new Date().toDateString();
    const timeEntries = this.loadTimeEntriesFromLocalStorage();

    const entryIndex = timeEntries.findIndex(
      (entry) => entry.date === today
    );

    if (entryIndex > -1) {
      timeEntries[entryIndex] = {
        date: today,
        hoursWorked: 0,
        clockInTime: '---',
        clockOutTime: '---',
      };
    }
    this.saveTimeEntriesToLocalStorage(timeEntries);
  }

  updateTimeEntry(
    date: string,
    hoursWorked: number,
    clockInTime?: string,
    clockOutTime?: string
  ) {
    const timeEntries = this.loadTimeEntriesFromLocalStorage();

    const entryIndex = timeEntries.findIndex(
      (entry) => entry.date === date
    );
    const entry: TimeEntry = {
      date: date,
      hoursWorked: hoursWorked,
      clockInTime: clockInTime || '---',
      clockOutTime: clockOutTime || '---',
    };

    if (entryIndex > -1) {
      timeEntries[entryIndex] = entry;
    } else {
      timeEntries.push(entry);
    }

    this.saveTimeEntriesToLocalStorage(timeEntries);
  }

  deleteTimeEntry(date: string) {
    const timeEntries = this.loadTimeEntriesFromLocalStorage();
    const updatedEntries = timeEntries.filter((entry) => entry.date !== date);
    this.saveTimeEntriesToLocalStorage(updatedEntries);
  }

  saveState() {
    const today = new Date().toDateString();
    const timeEntries = this.loadTimeEntriesFromLocalStorage();

    const entryIndex = timeEntries.findIndex(
      (entry) => entry.date === today
    );
    const entry: TimeEntry = {
      date: today,
      hoursWorked: this.timeSubject.value / 3600, // Convert seconds to hours
      clockInTime: this.firstClockIn
        ? this.firstClockIn.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })
        : '---',
      clockOutTime: this.clockOutTime
        ? this.clockOutTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })
        : '---',
    };

    if (entryIndex > -1) {
      timeEntries[entryIndex] = entry;
    } else {
      timeEntries.push(entry);
    }

    this.saveTimeEntriesToLocalStorage(timeEntries);
  }

  loadTimeEntriesFromLocalStorage(): TimeEntry[] {
    if (this.isLocalStorageAvailable()) {
      const savedData = localStorage.getItem('timeEntries');
      return savedData ? JSON.parse(savedData) : [];
    }
    return [];
  }

  saveTimeEntriesToLocalStorage(timeEntries: TimeEntry[]): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem('timeEntries', JSON.stringify(timeEntries));
    }
  }

  private parseTimeStringToToday(timeString: string): Date | null {
    if (timeString === '---') {
      return null;
    }
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, seconds, 0);
    return date;
  }

  loadState() {
    const timeEntries = this.loadTimeEntriesFromLocalStorage();
    const today = new Date().toDateString();
  
    const todayEntry = timeEntries.find(
      (entry) => entry.date === today
    );
  
    if (todayEntry) {
      this.timeSubject.next(todayEntry.hoursWorked * 3600); 
  
      // Check if clockInTime and clockOutTime are defined before parsing
      if (todayEntry.clockInTime) {
        this.firstClockIn = this.parseTimeStringToToday(todayEntry.clockInTime);
      } else {
        this.firstClockIn = null;
      }
  
      if (todayEntry.clockOutTime) {
        this.clockOutTime = this.parseTimeStringToToday(todayEntry.clockOutTime);
      } else {
        this.clockOutTime = null;
      }
    } else {
      this.resetTimer();
    }
  }

  logLocalStorageContent() {
    const timeEntries = this.loadTimeEntriesFromLocalStorage();
    console.log('Local Storage Content:');
    console.log('Time Entries:', timeEntries.length ? timeEntries : 'No entries');
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

  getFirstClockIn(): Date | null {
    return this.firstClockIn;
  }

  getClockOutTime(): Date | null {
    return this.clockOutTime;
  }

  isWeekend(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  isVacationDay(date: Date): boolean {
    this.vacationEntries = this.vacationService.getVacationEntries();
    return this.vacationEntries.some((vacation) => {
      const vacationStart = new Date(vacation.startDate);
      const vacationEnd = new Date(vacation.endDate);
      return (
        vacation.status === 'Approved' &&
        date >= vacationStart &&
        date <= vacationEnd
      );
    });
  }
}