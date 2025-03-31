import { Component, inject, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { CommonModule, DatePipe } from '@angular/common';
import { TimerService } from '../../services/timer.service';
import { MatIconModule } from '@angular/material/icon';
import { TimeEntry } from '../../models/time-entry.model'; // Import the TimeEntry interface

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTableModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.css'],
  providers: [DatePipe],
})
export class TimerComponent implements OnInit {
  time: number = 0;
  totalWorkTime: number = 8 * 3600; // 8 hours in seconds

  displayedColumns: string[] = ['icon', 'label', 'value'];
  dataSource: { label: string; value: string }[] = [];
  isWeekend: boolean = false;
  isVacation: boolean = false;
  snackBar = inject(MatSnackBar);
  datePipe = inject(DatePipe);
  timerService = inject(TimerService);

  ngOnInit(): void {
    this.timerService.time$.subscribe((time) => {
      this.time = time;
      this.updateDataSource();
    });
    this.checkIsWeekend();
    this.timerService.loadState();
  }

  ngAfterViewInit() {
    this.checkIsVacation();
  }

  logLocalStorageContent() {
    this.timerService.logLocalStorageContent();
  }

  get isRunning() {
    return this.timerService.runningStatus;
  }

  startTimer() {
    const statusMessage = this.timerService.startTimer();
    this.snackBar.open(statusMessage, 'Close', { duration: 2000 });
    this.updateDataSource();
  }

  stopTimer() {
    this.timerService.stopTimer();
    this.snackBar.open('Time saved successfully!', 'Close', { duration: 2000 });
    this.updateDataSource();
  }

  resetTimer() {
    this.timerService.resetTimer();
    this.updateDataSource();
  }

  private updateDataSource() {
    const timeEntries: TimeEntry[] = this.timerService.loadTimeEntriesFromLocalStorage();
    const today = new Date().toDateString();
    const todayEntry = timeEntries.find(entry => entry.date === today);

    this.dataSource = [
      { label: 'Current Date', value: this.currentDate },
      {
        label: 'First Clock In',
        value: todayEntry?.clockInTime || '---',
      },
      {
        label: 'Clock Out',
        value: todayEntry?.clockOutTime || '---',
      },
      { label: 'All for Today', value: this.formattedTime },
      { label: 'Time Left', value: this.timeLeft },
    ];
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
    if (remainingTime <= 0 || this.isWeekend || this.isVacation) {
      return '00:00:00';
    }
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  get currentDate(): string {
    return this.datePipe.transform(new Date(), 'dd/MM/yyyy') || '';
  }

  private pad(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }

  checkIsWeekend() {
    this.isWeekend = this.timerService.isWeekend(new Date());
  }

  checkIsVacation() {
    this.isVacation = this.timerService.isVacationDay(new Date());
  }
}