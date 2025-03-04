import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  private timeSubject = new BehaviorSubject<number>(0);
  time$ = this.timeSubject.asObservable();
  private intervalSubscription: Subscription | null = null;
  private isRunning = false;
  private firstClockIn: Date | null = null;
  private clockOutTime: Date | null = null;

  constructor() {
    this.loadState();
  }

  startTimer() {
    if (!this.isRunning) {
      this.isRunning = true;
      if (!this.firstClockIn) {
        this.firstClockIn = new Date();
        if (this.isLocalStorageAvailable()) {
          localStorage.setItem('firstClockIn', this.firstClockIn.toISOString());
        }
      }
      this.clockOutTime = null;
      if (this.isLocalStorageAvailable()) {
        localStorage.removeItem('clockOutTime');
      }
      this.intervalSubscription = interval(1000).subscribe(() => {
        this.timeSubject.next(this.timeSubject.value + 1);
        this.saveState();
      });
    }
  }

  stopTimer() {
    if (this.isRunning) {
      this.isRunning = false;
      this.clockOutTime = new Date();
      if (this.isLocalStorageAvailable()) {
        localStorage.setItem('clockOutTime', this.clockOutTime.toISOString());
      }
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
      localStorage.removeItem('firstClockIn');
      localStorage.removeItem('clockOutTime');
      localStorage.removeItem('timerTime');
    }
  }

  private saveState() {
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem('timerTime', this.timeSubject.value.toString());
    }
  }

  private loadState() {
    if (this.isLocalStorageAvailable()) {
      const savedTime = localStorage.getItem('timerTime');
      if (savedTime) {
        this.timeSubject.next(parseInt(savedTime, 10));
      }
      const savedFirstClockIn = localStorage.getItem('firstClockIn');
      if (savedFirstClockIn) {
        this.firstClockIn = new Date(savedFirstClockIn);
      }
      const savedClockOutTime = localStorage.getItem('clockOutTime');
      if (savedClockOutTime) {
        this.clockOutTime = new Date(savedClockOutTime);
      }
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
}