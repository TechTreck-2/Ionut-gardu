import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EditTimeDialogComponent } from '../../edit-time-dialog/edit-time-dialog.component';
import { TimerService } from '../../timer.service';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
interface TimeEntry {
  date: string;
  hoursWorked: number;
  clockInTime?: string;
  clockOutTime?: string;
}

@Component({
  selector: 'app-time-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatButtonModule,
    MatFormFieldModule,
    FormsModule,
    MatDialogModule,
    MatPaginatorModule 
  ],
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.css']
})
export class TimeTrackingComponent implements OnInit {
  displayedColumns: string[] = ['date', 'clockInTime', 'clockOutTime', 'hoursWorked', 'actions'];
  dataSource = new MatTableDataSource<TimeEntry>(); // Initialize here
  selectedDate: Date | null = null;
  newHours: number | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private timerService: TimerService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadFromLocalStorage();
    setTimeout(() => this.dataSource.paginator = this.paginator);


    this.timerService.time$.subscribe(time => {
      const today = new Date().toDateString();
      const clockInTime = this.timerService.getFirstClockIn()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      const clockOutTime = this.timerService.getClockOutTime()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

      const entry: TimeEntry = {
        date: today,
        hoursWorked: time / 3600, // Convert seconds to hours
        clockInTime: clockInTime || '---',
        clockOutTime: clockOutTime || '---'
      };

      const existingEntryIndex = this.dataSource.data.findIndex(e => e.date === today);
      if (existingEntryIndex > -1) {
        this.dataSource.data[existingEntryIndex] = entry;
      } else {
        this.dataSource.data.push(entry);
      }

      this.saveToLocalStorage();
    });
  }

  addEntry() {
    if (this.selectedDate && this.newHours !== null && this.newHours >= 0 && this.newHours <= 24) {
      const dateString = this.selectedDate.toDateString();
      const entry: TimeEntry = {
        date: dateString,
        hoursWorked: this.newHours,
        clockInTime: '---',
        clockOutTime: '---'
      };

      const existingEntryIndex = this.dataSource.data.findIndex(e => e.date === dateString);
      if (existingEntryIndex > -1) {
        this.dataSource.data[existingEntryIndex] = entry;
      } else {
        this.dataSource.data = [...this.dataSource.data, entry];
      }

      this.timerService.updateTimeEntry(dateString, this.newHours);

      this.saveToLocalStorage();
      this.loadFromLocalStorage();
      this.snackBar.open('Entry added/updated successfully!', 'Close', { duration: 2000 });
      
      // Reset inputs
      this.selectedDate = null;
      this.newHours = null;
    } else {
      this.snackBar.open('Please enter a valid date and hours (0-24).', 'Close', { duration: 2000 });
    }
    this.loadFromLocalStorage();
  }

  editEntry(entry: TimeEntry) {
    const dialogRef = this.dialog.open(EditTimeDialogComponent, {
      width: '500px',
      data: {
        clockInTime: entry.clockInTime,
        clockOutTime: entry.clockOutTime
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result && this.validateTimeFormat(result.clockInTime) && this.validateTimeFormat(result.clockOutTime)) {
        entry.clockInTime = result.clockInTime;
        entry.clockOutTime = result.clockOutTime;
        entry.hoursWorked = this.calculateHoursWorked(result.clockInTime, result.clockOutTime);
        this.dataSource.data = [...this.dataSource.data]; // Reassign to trigger change detection
        this.saveToLocalStorage();
        this.snackBar.open('Entry updated successfully!', 'Close', { duration: 2000 });
      } else {
        this.snackBar.open('Invalid time format. Please use HH:mm:ss.', 'Close', { duration: 2000 });
      }
    });
  }

  deleteEntry(entry: TimeEntry) {
    this.timerService.deleteTimeEntry(entry.date);
    this.snackBar.open('Entry deleted successfully!', 'Close', { duration: 2000 });
    this.loadFromLocalStorage();
  }

  private saveToLocalStorage() {
  // Extract only the data array from the dataSource
  const dataToSave = this.dataSource.data.map(entry => ({
    date: entry.date,
    hoursWorked: entry.hoursWorked,
    clockInTime: entry.clockInTime,
    clockOutTime: entry.clockOutTime
  }));

  // Save the extracted data to local storage
  localStorage.setItem('timeEntries', JSON.stringify(dataToSave));
}

private loadFromLocalStorage() {
  const savedData = localStorage.getItem('timeEntries');
  if (savedData) {
    const parsedData: TimeEntry[] = JSON.parse(savedData);
    this.dataSource.data = parsedData;
    console.log('Loaded data:', this.dataSource.data); // Debugging log
  } else {
    this.dataSource.data = [];
    console.log('No data found in local storage.'); // Debugging log
  }
}

  calculateHoursWorked(clockIn: string, clockOut: string): number {
    const clockInParts = clockIn.split(':').map(Number);
    const clockOutParts = clockOut.split(':').map(Number);

    if (clockInParts.length !== 3 || clockOutParts.length !== 3) {
      console.error('Invalid time format. Expected HH:mm:ss');
      return NaN;
    }

    const [inHours, inMinutes, inSeconds] = clockInParts;
    const [outHours, outMinutes, outSeconds] = clockOutParts;

    const inDate = new Date();
    const outDate = new Date();

    inDate.setHours(inHours, inMinutes, inSeconds, 0);
    outDate.setHours(outHours, outMinutes, outSeconds, 0);

    const diffInMilliseconds = outDate.getTime() - inDate.getTime();
    const diffInHours = diffInMilliseconds / 1000 / 3600; // Convert milliseconds to hours
    this.saveToLocalStorage();
    return diffInHours;
  }

  validateTimeFormat(time: string): boolean {
    const timeFormat = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    return timeFormat.test(time);
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(secs)}`;
  }

  private pad(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }
}