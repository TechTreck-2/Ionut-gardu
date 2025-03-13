import { Component, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { CommonModule, DatePipe } from '@angular/common';
import { TimerService } from '../../timer.service';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressBarModule, MatTableModule, MatSnackBarModule, MatIconModule],
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.css'],
  providers: [DatePipe]
})
export class TimerComponent implements OnInit {
  time: number = 0;
  totalWorkTime: number = 8 * 3600; // 8 hours in seconds

  displayedColumns: string[] = ['icon','label', 'value'];
  dataSource: { label: string, value: string }[] = [];
  firstClockInDisplay: string = '---';
  clockOutTimeDisplay: string = '---';
  constructor(private snackBar: MatSnackBar, private datePipe: DatePipe, private timerService: TimerService) {}

  ngOnInit(): void {
    this.timerService.time$.subscribe(time => {
      this.time = time;
      this.updateDataSource();
    });
    this.timerService.loadState();
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
    this.dataSource = [
      { label: 'Current Date', value: this.currentDate },
      { 
        label: 'First Clock In', 
        value: this.timerService.getFirstClockIn() 
          ? this.timerService.getFirstClockIn()!.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) 
          : '---' 
      },
      { 
        label: 'Clock Out', 
        value: this.timerService.getClockOutTime() 
          ? this.timerService.getClockOutTime()!.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) 
          : '---' 
      },
      { label: 'All for Today', value: this.formattedTime },
      { label: 'Time Left', value: this.timeLeft }
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
    if (remainingTime <= 0) {
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
}