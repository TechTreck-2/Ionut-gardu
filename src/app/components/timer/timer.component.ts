import { Component, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule, DatePipe } from '@angular/common';
import { TimeTrackingService } from '../../time-tracking.service';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatSnackBarModule, MatProgressBarModule],
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.css'],
  providers: [DatePipe]
})
export class TimerComponent implements OnInit {
  time: number = 0;
  interval: any;
  isRunning: boolean = false;
  firstClockIn: Date | null = null;
  clockOutTime: Date | null = null;
  totalWorkTime: number = 8 * 3600; // 8 hours in seconds

  constructor(private snackBar: MatSnackBar, private datePipe: DatePipe, private timeTrackingService: TimeTrackingService) {}

  ngOnInit(): void {
    const today = new Date().toDateString();
    const entry = this.timeTrackingService.getTimeEntries().find(e => e.date === today);
    if (entry) {
      this.time = entry.hoursWorked * 3600; // Convert hours to seconds
    }
  }

  startTimer() {
    if (!this.isRunning) {
      this.isRunning = true;
      if (!this.firstClockIn) {
        this.firstClockIn = new Date();
      }
      this.clockOutTime = null;
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
      const today = new Date().toDateString();
      const hoursWorked = this.time / 3600; // Convert seconds to hours
      this.timeTrackingService.addOrUpdateEntry({ date: today, hoursWorked });
      this.snackBar.open('Time saved successfully!', 'Close', { duration: 2000 });
    }
  }

  resetTimer() {
    clearInterval(this.interval);
    this.time = 0;
    this.isRunning = false;
    this.firstClockIn = null;
    this.clockOutTime = null;
    const today = new Date().toDateString();
    this.timeTrackingService.deleteEntry(today);
  }

  get workPercentage(): number {
    return (this.time / this.totalWorkTime) * 100;
  }

  get formattedTime(): string {
    const hours = Math.floor(this.time / 3600);
    const minutes = Math.floor((this.time % 3600) / 60);
    const seconds = this.time % 60;
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
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