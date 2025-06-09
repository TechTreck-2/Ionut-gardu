import { Component, inject, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { CommonModule, DatePipe } from '@angular/common';
import { TimerService } from '../../services/timer.service';
import { MatIconModule } from '@angular/material/icon';
import { VacationService } from '../../services/vacation.service';
import { TimeEntryService } from '../../services/time-entry.service';
import { firstValueFrom } from 'rxjs';

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
  firstClockInDisplay: string = '---';
  clockOutTimeDisplay: string = '---';
  isWeekend: boolean = false;
  isVacation: boolean = false;
  snackBar = inject(MatSnackBar);
  datePipe = inject(DatePipe);
  timerService = inject(TimerService);
  vacationService = inject(VacationService);
  timeEntryService = inject(TimeEntryService);
  vacationDaysLeft!: number;

  async ngOnInit(): Promise<void> {
    this.timerService.time$.subscribe((time) => {
      this.time = time;
      this.updateDataSource();
    });
    this.checkisWeekend();
    this.checkisVacation();
    await this.loadTimeEntries();
    this.timerService.loadState();
    this.vacationService.updateVacationDaysLeft();
    this.vacationDaysLeft = this.vacationService.getVacationDaysLeft();
  }

  private async loadTimeEntries(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format
      //console.log('Looking for entries with date:', today);
      
      const entries = await firstValueFrom(this.timeEntryService.getTimeEntries());
      //console.log('Raw entries data:', entries);
      
      // Initialize with default values
      this.firstClockInDisplay = '---';
      this.clockOutTimeDisplay = '---';
      this.time = 0;
      
      // Filter entries for today and log each comparison
      const todayEntries = entries.filter(entry => {
        //console.log('Raw entry data:', entry);
        
        return entry.date === today;
      });
      //console.log('Today entries:', todayEntries);
      
      if (todayEntries.length > 0) {
        const entry = todayEntries[0];
        //console.log('Using entry:', entry);
        
        this.firstClockInDisplay = entry.clockInTime || '---';
        this.clockOutTimeDisplay = entry.clockOutTime || '---';
        
        if (entry.clockInTime && entry.clockOutTime) {
          const hoursWorked = this.calculateAndFormatHoursWorked(
            entry.clockInTime,
            entry.clockOutTime,
            entry.date
          );
          this.time = this.timeStringToSeconds(hoursWorked);
        }
      } else {
        console.log('No entries found for today');
      }

      // Always update dataSource, whether we found entries or not
      this.dataSource = [
        { label: 'Current Date', value: this.currentDate },
        {
          label: 'First Clock In',
          value: this.firstClockInDisplay
        },
        {
          label: 'Clock Out',
          value: this.clockOutTimeDisplay
        },
        { 
          label: 'All for Today', 
          value: this.formattedTime 
        },
        { 
          label: 'Time Left', 
          value: this.timeLeft 
        }
      ];
    } catch (error) {
      console.error('Error loading time entries:', error);
      this.snackBar.open('Error loading time entries', 'Close', {
        duration: 3000,
      });
    }
  }

  private timeStringToSeconds(timeString: string): number {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }

  ngAfterViewInit():void {
    
  }

  get isRunning() {
    return this.timerService.runningStatus;
  }

  async startTimer() {
    const statusMessage = await this.timerService.startTimer();
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
    const clockIn = this.timerService.getFirstClockIn();
    const clockOut = this.timerService.getClockOutTime();
    const date = new Date(); // Assuming you want to use the current date

    this.dataSource = [
      { label: 'Current Date', value: this.currentDate },
      {
        label: 'First Clock In',
        value: clockIn
          ? clockIn.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })
          : '---',
      },
      {
        label: 'Clock Out',
        value: clockOut
          ? clockOut.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })
          : '---',
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

  checkisWeekend() {
    this.isWeekend = this.timerService.isWeekend(new Date());
  }

  checkisVacation() {
    this.isVacation = this.timerService.isVacationDay(new Date());
  }

  calculateAndFormatHoursWorked(
    clockIn: string,
    clockOut: string,
    date: string
  ): string {
    const hoursWorked = this.timerService.calculateHoursWorked(
      clockIn,
      clockOut,
      date
    );
    return this.formatHoursToHHMMSS(hoursWorked);
  }

  private formatHoursToHHMMSS(totalHours: number): string {
    const totalSeconds = totalHours * 3600; // Convert hours to seconds
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
  }
}
