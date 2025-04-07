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
  timeEntries: TimeEntry[] = [];
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

    if (this.isLocalStorageAvailable()) {
      const today = new Date().toDateString();
      const savedData = localStorage.getItem('timeEntries');
      let timeEntries = savedData ? JSON.parse(savedData) : [];

      const entryIndex = timeEntries.findIndex(
        (entry: any) => entry.date === today
      );

      if (entryIndex > -1) {
        timeEntries[entryIndex] = {
          date: today,
          hoursWorked: 0,
          clockInTime: '---',
          clockOutTime: '---',
        };
      }
      localStorage.setItem('timeEntries', JSON.stringify(timeEntries));
    }
  }

  updateTimeEntry(
    date: string,
    hoursWorked: number,
    clockInTime?: string,
    clockOutTime?: string
  ) {
    if (this.isLocalStorageAvailable()) {
      const savedData = localStorage.getItem('timeEntries');
      let timeEntries = savedData ? JSON.parse(savedData) : [];

      const entryIndex = timeEntries.findIndex(
        (entry: any) => entry.date === date
      );
      const entry = {
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

      localStorage.setItem('timeEntries', JSON.stringify(timeEntries));
    }
  }

  deleteTimeEntry(date: string) {
    if (this.isLocalStorageAvailable()) {
      const savedData = localStorage.getItem('timeEntries');
      if (savedData) {
        let timeEntries = JSON.parse(savedData);

        //console.log('Before deletion:', timeEntries); //Debugging log

        timeEntries = timeEntries.filter((entry: any) => entry.date !== date);

        //console.log('After deletion:', timeEntries); //Debugging log

        localStorage.setItem('timeEntries', JSON.stringify(timeEntries));
      } else {
        console.log('No time entries found in local storage.');
      }
    } else {
      console.log('Local storage is not available.');
    }
  }

  saveState() {
    if (this.isLocalStorageAvailable()) {
      const today = new Date().toDateString();
      const savedData = localStorage.getItem('timeEntries');
      let timeEntries = savedData ? JSON.parse(savedData) : [];

      const entryIndex = timeEntries.findIndex(
        (entry: any) => entry.date === today
      );
      const entry = {
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

      localStorage.setItem('timeEntries', JSON.stringify(timeEntries));
      //console.log('State saved successfully.', timeEntries); //Debugging log
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
    if (this.isLocalStorageAvailable()) {
      const savedData = localStorage.getItem('timeEntries');
      const today = new Date().toDateString();

      if (savedData) {
        const timeEntries = JSON.parse(savedData);
        const todayEntry = timeEntries.find(
          (entry: any) => entry.date === today
        );

        if (todayEntry) {
          this.timeSubject.next(todayEntry.hoursWorked * 3600); // Convert hours to seconds
          this.firstClockIn = this.parseTimeStringToToday(
            todayEntry.clockInTime
          );
          this.clockOutTime = this.parseTimeStringToToday(
            todayEntry.clockOutTime
          );
        } else {
          this.resetTimer();
        }
        //console.log('State loaded successfully.', timeEntries); //Debugging log
      } else {
        this.resetTimer();
      }
    }
  }

  logLocalStorageContent() {
    if (this.isLocalStorageAvailable()) {
      const timeEntries = localStorage.getItem('timeEntries');
      console.log('Local Storage Content:');
      console.log(
        'Time Entries:',
        timeEntries ? JSON.parse(timeEntries) : 'No entries'
      );
    } else {
      console.log('Local storage is not available.');
    }
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
    if (this.isLocalStorageAvailable()) {
      this.vacationEntries = this.vacationService.getVacationEntries();
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0); 
  
      return this.vacationEntries.some((vacation) => {
        const vacationStart = new Date(vacation.startDate);
        const vacationEnd = new Date(vacation.endDate);
        vacationStart.setHours(0, 0, 0, 0); 
        vacationEnd.setHours(0, 0, 0, 0); 
  
        return (
          vacation.status === 'Approved' &&
          targetDate >= vacationStart &&
          targetDate <= vacationEnd
        );
      });
    }
    return false;
  }
}