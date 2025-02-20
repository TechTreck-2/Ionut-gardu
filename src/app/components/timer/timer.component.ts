import { Component } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatSnackBarModule, MatProgressBarModule],
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.css'],
  providers: [DatePipe]
})
export class TimerComponent {
  time: number = 0;
  interval: any;
  isRunning: boolean = false;
  firstClockIn: Date | null = null;
  clockOutTime: Date | null = null;
  totalWorkTime: number = 8 * 3600; // 8 hours in seconds

  constructor(private snackBar: MatSnackBar, private datePipe: DatePipe) {}

  ngOnInit(): void {
    if (this.isLocalStorageAvailable()) {
      const savedData = localStorage.getItem('savedTime');
      if (savedData) {
        const { date, time, firstClockIn, clockOutTime } = JSON.parse(savedData);
        const today = new Date().toDateString();
        if (date === today) {
          this.time = time;
          this.firstClockIn = firstClockIn ? new Date(firstClockIn) : null;
          this.clockOutTime = clockOutTime ? new Date(clockOutTime) : null;
        } else {
          this.resetTimer();
        }
      }
    }
  }

  startTimer() {
    if (!this.isRunning) {
      this.isRunning = true;
      if (!this.firstClockIn) {
        this.firstClockIn = new Date();
      }
      this.clockOutTime = null; // Reset clock-out time when clocking in
      this.interval = setInterval(() => {
        this.time++;
      }, 1000);
    }
  }

  stopTimer() {
    if (this.isRunning) {
      clearInterval(this.interval);
      this.isRunning = false;
      this.clockOutTime = new Date();
      if (this.isLocalStorageAvailable()) {
        const today = new Date().toDateString();
        const data = {
          date: today,
          time: this.time,
          firstClockIn: this.firstClockIn,
          clockOutTime: this.clockOutTime
        };
        localStorage.setItem('savedTime', JSON.stringify(data));
      }
      this.snackBar.open('Time saved successfully!', 'Close', { duration: 2000 });
    }
  }

  resetTimer() {
    clearInterval(this.interval);
    this.time = 0;
    this.isRunning = false;
    this.firstClockIn = null;
    this.clockOutTime = null;
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem('savedTime');
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

  get formattedTime(): string {
    const hours = Math.floor(this.time / 3600);
    const minutes = Math.floor((this.time % 3600) / 60);
    const seconds = this.time % 60;
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  get workPercentage(): number {
    return (this.time / this.totalWorkTime) * 100;
  }

  get timeLeft(): string {
    const remainingTime = this.totalWorkTime - this.time;
    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  get currentDate(): string {
    return this.datePipe.transform(new Date(), 'dd/MM/yyyy') || '';
  }

  private pad(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }
}