import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription, firstValueFrom } from 'rxjs';
import { VacationService } from './vacation.service';
import { VacationEntry } from '../models/vacation-entry.model';
import { TimeEntry } from '../models/time-entry.model';
import { PermissionService } from './permission.service';
import { PermissionEntry } from '../models/permission-entry.model';
import { TimeEntryService } from './time-entry.service';

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
  private currentEntryId: string | null = null;
  vacationEntries: VacationEntry[] = [];
  timeEntries: TimeEntry[] = [];  vacationService = inject(VacationService);
  permissionService = inject(PermissionService);
  timeEntryService = inject(TimeEntryService);
  permissionEntries: PermissionEntry[] = [];

  constructor() {
    this.loadState();
  }
  loadPermissionEntries(): void {
    this.permissionEntries = this.permissionService.getPermissionEntries();
  }

  get runningStatus() {
    return this.isRunning;
  }

  async startTimer() {
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

  async stopTimer() {
    if (this.isRunning) {
      this.isRunning = false;
      this.clockOutTime = new Date();
      this.intervalSubscription?.unsubscribe();
      await this.saveState();
    }
  }

  async resetTimer() {
    this.isRunning = false;
    this.firstClockIn = null;
    this.clockOutTime = null;
    this.timeSubject.next(0);
    this.intervalSubscription?.unsubscribe();

    const today = this.formatDate(new Date());
    try {
      const entries = await firstValueFrom(this.timeEntryService.getTimeEntryByDate(today));
      if (entries.length > 0 && entries[0].documentId) {
        await firstValueFrom(this.timeEntryService.updateTimeEntry(entries[0].documentId, {
          date: today,
          clockInTime: '---',
          clockOutTime: '---'
        }));
      }
    } catch (error) {
      console.error('Error resetting timer:', error);
    }
  }

  async updateTimeEntry(
    date: string,
    hoursWorked: number,
    clockInTime?: string,
    clockOutTime?: string
  ) {
    try {
      const entries = await firstValueFrom(this.timeEntryService.getTimeEntryByDate(date));
      const entry: Partial<TimeEntry> = {
        date,
        clockInTime: clockInTime || '---',
        clockOutTime: clockOutTime || '---'
      };

      if (entries.length > 0 && entries[0].documentId) {
        await firstValueFrom(this.timeEntryService.updateTimeEntry(entries[0].documentId, entry));
      } else {
        await firstValueFrom(this.timeEntryService.createTimeEntry(entry));
      }
    } catch (error) {
      console.error('Error updating time entry:', error);
    }
  }

  async deleteTimeEntry(date: string) {
    try {
      const entries = await firstValueFrom(this.timeEntryService.getTimeEntryByDate(date));
      if (entries.length > 0 && entries[0].documentId) {
        await firstValueFrom(this.timeEntryService.deleteTimeEntry(entries[0].documentId));
      }
    } catch (error) {
      console.error('Error deleting time entry:', error);
    }
  }

  async saveState() {
    const today = this.formatDate(new Date());
    const entryData: Partial<TimeEntry> = {
      date: today,
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
        : '---'
    };

    try {
      if (this.currentEntryId) {
        await firstValueFrom(this.timeEntryService.updateTimeEntry(this.currentEntryId, entryData));
      } else {
        const entries = await firstValueFrom(this.timeEntryService.getTimeEntryByDate(today));
        if (entries.length > 0 && entries[0].documentId) {
          this.currentEntryId = entries[0].documentId;
          await firstValueFrom(this.timeEntryService.updateTimeEntry(this.currentEntryId, entryData));
        } else {
          const newEntry = await firstValueFrom(this.timeEntryService.createTimeEntry(entryData));
          if (newEntry.documentId) {
            this.currentEntryId = newEntry.documentId;
          }
        }
      }
    } catch (error) {
      console.error('Error saving state:', error);
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

  async loadState() {
    const today = this.formatDate(new Date());
    try {
      const entries = await firstValueFrom(this.timeEntryService.getTimeEntryByDate(today));
      if (entries.length > 0) {
        const todayEntry = entries[0];
        if (todayEntry.documentId) {
          this.currentEntryId = todayEntry.documentId;
        }
        this.firstClockIn = this.parseTimeStringToToday(todayEntry.clockInTime || '---');
        this.clockOutTime = this.parseTimeStringToToday(todayEntry.clockOutTime || '---');
        
        if (this.firstClockIn && this.clockOutTime) {
          const diffInMilliseconds = this.clockOutTime.getTime() - this.firstClockIn.getTime();
          this.timeSubject.next(diffInMilliseconds / 1000);
        } else if (this.firstClockIn) {
          const now = new Date();
          const diffInMilliseconds = now.getTime() - this.firstClockIn.getTime();
          this.timeSubject.next(diffInMilliseconds / 1000);
          this.startTimer();
        }
      } else {
        this.resetTimer();
      }
    } catch (error) {
      console.error('Error loading state:', error);
      this.resetTimer();
    }
  }

  getFirstClockIn(): Date | null {
    return this.firstClockIn;
  }

  getClockOutTime(): Date | null {
    return this.clockOutTime;
  }

  isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }
  async isVacationDay(date: Date): Promise<boolean> {
    return await this.vacationService.isVacationDay(date);
  }

  calculateHoursWorked(
    clockIn: string,
    clockOut: string,
    date: string
  ): number {
    if (clockIn === '---' || clockOut === '---') {
      return 0;
    }

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
    this.loadPermissionEntries();
    const permissionEntry = this.permissionEntries.find(
      (pe) => pe.date === formattedDate && pe.status === 'Approved'
    );    if (permissionEntry) {
      const permissionDuration =
        this.permissionService.calculateDuration(permissionEntry);
      const [permHours, permMinutes, permSeconds] = permissionDuration
        .split(':')
        .map(Number);
      const permDurationInHours =
        permHours + permMinutes / 60 + permSeconds / 3600;

      diffInHours -= permDurationInHours;
    }
    return Math.max(0, diffInHours);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}