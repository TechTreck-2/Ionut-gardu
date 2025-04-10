import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { VacationService } from './vacation.service';
import { VacationEntry } from '../models/vacation-entry.model';
import { TimeEntry } from '../models/time-entry.model';
import { PermissionLeaveService } from './permission-leave.service';
import { PermissionEntry } from '../models/permission-entry.model';
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
  permissionLeaveService = inject(PermissionLeaveService);
  permissionEntries: PermissionEntry[] = [];
  constructor() {
    this.loadState();
    this.loadPermissionEntries();
  }

  loadPermissionEntries(): void {
    this.permissionEntries = this.permissionLeaveService.getPermissionEntries();
    //console.log('Permission entries loaded.', this.permissionEntries); // Debugging log
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

  calculateHoursWorked(
    clockIn: string,
    clockOut: string,
    date: string
  ): number {
    //console.log(clockIn, clockOut, date); // Debugging log
    const clockInParts = clockIn.split(':').map(Number);
    const clockOutParts = clockOut.split(':').map(Number);

    if (clockInParts.length !== 3 || clockOutParts.length !== 3) {
      console.error('Invalid time format. Expected HH:mm:ss');
      return 0;
    }

    const [inHours, inMinutes, inSeconds] = clockInParts;
    const [outHours, outMinutes, outSeconds] = clockOutParts;

    const inDate = new Date();
    const outDate = new Date();

    inDate.setHours(inHours, inMinutes, inSeconds, 0);
    outDate.setHours(outHours, outMinutes, outSeconds, 0);

    const diffInMilliseconds = outDate.getTime() - inDate.getTime();
    let diffInHours = diffInMilliseconds / 1000 / 3600;

    const formattedDate = this.formatDate(new Date(date));
    //console.log('Checking for permission entry on formatted date:', formattedDate); // Debugging log

    const permissionEntry = this.permissionEntries.find(
      (pe) => pe.date === formattedDate && pe.status === 'Approved'
    );
    //console.log('Permission entry:', permissionEntry); // Debugging log

    if (permissionEntry) {
      const permissionDuration =
        this.permissionLeaveService.calculateDuration(permissionEntry);
      const [permHours, permMinutes, permSeconds] = permissionDuration
        .split(':')
        .map(Number);
      const permDurationInHours =
        permHours + permMinutes / 60 + permSeconds / 3600;
      //console.log('Permission duration in hours:', permDurationInHours); // Debugging log

      diffInHours -= permDurationInHours;
    }
    //console.log('Calculated hours worked:', diffInHours); // Debugging log
    return Math.max(0, diffInHours);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}