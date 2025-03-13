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
import { EditTimeDialogComponent } from '../edit-time-dialog/edit-time-dialog.component';
import { TimerService } from '../../timer.service';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';

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
    MatPaginatorModule,
    MatSortModule,
  ],
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.css'],
})
export class TimeTrackingComponent implements OnInit {
  displayedColumns: string[] = [
    'actions',
    'date',
    'clockInTime',
    'clockOutTime',
    'hoursWorked',
    'status',
  ];
  dataSource = new MatTableDataSource<TimeEntry>();
  filteredData = new MatTableDataSource<TimeEntry>();
  selectedDate: Date | null = null;
  newHours: number | null = null;
  startDate: Date | null = null;
  endDate: Date | null = null;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private timerService: TimerService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadFromLocalStorage();
    const date = new Date();
    this.startDate = new Date(date);
    this.endDate = new Date(date);

    this.timerService.time$.subscribe((time) => {
      const today = new Date().toDateString();
      
      this.filterEntriesByDate();

      const clockInTime = this.timerService
        .getFirstClockIn()
        ?.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
      const clockOutTime = this.timerService
        .getClockOutTime()
        ?.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });

      const entry: TimeEntry = {
        date: today,
        hoursWorked: time / 3600, // Convert seconds to hours
        clockInTime: clockInTime || '---',
        clockOutTime: clockOutTime || '---',
      };

      const existingEntryIndex = this.dataSource.data.findIndex(
        (e) => e.date === today
      );
      if (existingEntryIndex > -1) {
        this.dataSource.data[existingEntryIndex] = entry;
      } else {
        this.dataSource.data.push(entry);
      }

      this.saveToLocalStorage();
    });
  }

  ngAfterViewInit(): void {
    this.filteredData.paginator = this.paginator; // Set paginator for main data source
    this.filteredData.sort = this.sort; // Set sort for main data source
  }

  filterEntriesByDate() {
    const currentData = [...this.dataSource.data];

    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      start.setHours(0, 0, 0, 0); // Set to midnight

      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999); // Set to the end of the day

      // Filter the local copy based on the selected dates
      const filteredEntries = currentData.filter((entry) => {
        const entryDate = new Date(entry.date).getTime();
        return entryDate >= start.getTime() && entryDate <= end.getTime();
      });

      // Set the filteredData to a new MatTableDataSource with the filtered results
      this.filteredData = new MatTableDataSource(filteredEntries);
      this.filteredData.paginator = this.paginator; // Link paginator to filteredData
    } else {
      this.loadFromLocalStorage(); // Reload all entries if no dates are set
    }
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this.snackBar.open(
        `Sorted ${sortState.active} ${sortState.direction}`,
        'Close',
        {
          duration: 2000,
        }
      );
    } else {
      this.snackBar.open('Sorting cleared', 'Close', {
        duration: 2000,
      });
    }
  }

  editEntry(entry: TimeEntry) {
    const dialogRef = this.dialog.open(EditTimeDialogComponent, {
      width: '500px',
      data: {
        clockInTime: entry.clockInTime,
        clockOutTime: entry.clockOutTime,
      },
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (
        result &&
        this.validateTimeFormat(result.clockInTime) &&
        this.validateTimeFormat(result.clockOutTime)
      ) {
        // Update the entry in filteredData
        entry.clockInTime = result.clockInTime;
        entry.clockOutTime = result.clockOutTime;
        entry.hoursWorked = this.calculateHoursWorked(
          result.clockInTime,
          result.clockOutTime
        );
  
        // Update the corresponding entry in dataSource
        const originalEntryIndex = this.dataSource.data.findIndex(
          (e) => e.date === entry.date
        );
        if (originalEntryIndex > -1) {
          this.dataSource.data[originalEntryIndex] = entry; // Update original data
        }
  
        this.saveToLocalStorage(); // Save changes to local storage
        this.snackBar.open('Entry updated successfully!', 'Close', {
          duration: 2000,
        });
      } else {
        this.snackBar.open(
          'Invalid time format. Please use HH:mm:ss.',
          'Close',
          { duration: 2000 }
        );
      }
    });
  }

  deleteEntry(entry: TimeEntry) {
    this.timerService.deleteTimeEntry(entry.date);
    this.snackBar.open('Entry deleted successfully!', 'Close', {
      duration: 2000,
    });
    this.loadFromLocalStorage();
  }

  private saveToLocalStorage() {
    // Extract only the data array from the dataSource
    const dataToSave = this.dataSource.data.map((entry) => ({
      date: entry.date,
      hoursWorked: entry.hoursWorked,
      clockInTime: entry.clockInTime,
      clockOutTime: entry.clockOutTime,
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

  isWeekend(date: Date): boolean {
    const dayOfWeek = date.getDay(); // Get the day of the week (0 for Sunday, 6 for Saturday)
    return dayOfWeek === 0 || dayOfWeek === 6; // Return true if it's Saturday or Sunday
  }

  computeStatus(entry: TimeEntry): string {
    const seconds = entry.hoursWorked;
    const day = entry.date;
    if (this.isWeekend(new Date(day))) {
      return 'Weekend';
    } else if (seconds < 0) {
      return 'Error';
    } else if (seconds === 0) {
      return 'Untracked';
    } else if (seconds < 8) {
      return 'Partially tracked';
    } else {
      return 'Tracked';
    }
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
