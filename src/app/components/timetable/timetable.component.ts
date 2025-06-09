import {
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
  SimpleChanges,
  inject,
} from '@angular/core';
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
import { TimerService } from '../../services/timer.service';
import { TimeEntryService } from '../../services/time-entry.service';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { PermissionLeaveService } from '../../services/permission-leave.service';
import { PermissionEntry } from '../../models/permission-entry.model';
import { TimeEntry } from '../../models/time-entry.model';
import { firstValueFrom } from 'rxjs';

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
    'permissionLeaveDuration',
    'hoursWorked',
    'status',
  ];
  dataSource = new MatTableDataSource<TimeEntry>();
  filteredData = new MatTableDataSource<TimeEntry>();
  permissionEntries: PermissionEntry[] = [];

  selectedDate: Date | null = null;
  newHours: number | null = null;
  startDate: Date | null = null;
  endDate: Date | null = null;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  timerService = inject(TimerService);
  timeEntryService = inject(TimeEntryService);
  permissionLeaveService = inject(PermissionLeaveService);
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);
  
  ngOnInit(): void {
    this.loadInitialData();
    this.loadPermissionEntries();
    const date = new Date();
    this.startDate = new Date(date);
    this.endDate = new Date(date);

    // Subscribe to timer updates without making API calls on each tick
    this.timerService.time$.subscribe((time) => {
      const today = new Date().toISOString().split('T')[0];

      const clockInTime = this.timerService.getFirstClockIn()?.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const clockOutTime = this.timerService.getClockOutTime()?.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      // Update local data source without making API calls
      const currentData = [...this.dataSource.data];
      const existingEntryIndex = currentData.findIndex(e => e.date === today);
      
      if (existingEntryIndex > -1) {
        currentData[existingEntryIndex] = {
          ...currentData[existingEntryIndex],
          clockInTime: clockInTime || '---',
          clockOutTime: clockOutTime || '---'
        };
      } else {
        currentData.push({
          date: today,
          clockInTime: clockInTime || '---',
          clockOutTime: clockOutTime || '---'
        });
      }
      
      this.dataSource.data = currentData;
      this.filterEntriesByDate();
    });
  }

  async saveToStrapi(entry: TimeEntry) {
    try {
      if (entry.documentId) {
        await firstValueFrom(this.timeEntryService.updateTimeEntry(entry.documentId, entry));
      } else {
        const newEntry = await firstValueFrom(this.timeEntryService.createTimeEntry(entry));
        // Update local entry with the new documentId
        const index = this.dataSource.data.findIndex(e => e.date === entry.date);
        if (index > -1) {
          const updatedData = [...this.dataSource.data];
          updatedData[index] = { ...newEntry };
          this.dataSource.data = updatedData;
        }
      }
    } catch (error) {
      console.error('Error saving to Strapi:', error);
      throw error;
    }
  }

  // Load initial data from Strapi only once
  private async loadInitialData() {
    try {
      const entries = await firstValueFrom(this.timeEntryService.getTimeEntries());
      this.dataSource.data = entries;
      this.filterEntriesByDate();
    } catch (error) {
      console.error('Error loading time entries:', error);
      this.snackBar.open('Error loading time entries', 'Close', { duration: 3000 });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.filteredData.paginator = this.paginator;
      this.filteredData.sort = this.sort;
      this.sort.active = 'date';
      this.sort.direction = 'asc';
    }, 0);
  }

  ngOnDestroy(): void {
    this.startDate = null;
    this.endDate = null;
    this.filteredData = new MatTableDataSource(this.dataSource.data);
  }

  loadPermissionEntries(): void {
    this.permissionEntries = this.permissionLeaveService.getPermissionEntries();
    //console.log('Permission entries loaded.', this.permissionEntries); // Debugging log
  }

  calculatePermissionLeaveDuration(entry: TimeEntry): string {
    const formattedDate = this.formatDate(new Date(entry.date));
  
    const permissionEntries = this.permissionEntries.filter(
      (pe) => pe.date === formattedDate && pe.status === 'Approved'
    );
  
    if (permissionEntries.length === 0) {
      return '---';
    }
  
    let totalSeconds = 0;
    for (const permissionEntry of permissionEntries) {
      const durationString = this.permissionLeaveService.calculateDuration(permissionEntry);
      const [hours, minutes, seconds] = durationString.split(':').map(Number);
      totalSeconds += hours * 3600 + minutes * 60 + seconds;
    }
  
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    const totalSecs = totalSeconds % 60;
  
    return `${this.pad(totalHours)}:${this.pad(totalMinutes)}:${this.pad(totalSecs)}`;
  }
  

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  filterEntriesByDate() {
    const currentData = [...this.dataSource.data];

    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999);

      const filteredEntries = currentData.filter((entry) => {
        const entryDate = new Date(entry.date).getTime();
        return entryDate >= start.getTime() && entryDate <= end.getTime();
      });

      this.filteredData = new MatTableDataSource(filteredEntries);

      this.filteredData.sortingDataAccessor = (item: TimeEntry, property: string) => {
        switch (property) {
          case 'date':
            return new Date(item.date).getTime();
          case 'hoursWorked':
            return this.getHoursWorked(item);
          case 'clockInTime':
            return item.clockInTime || '';
          case 'clockOutTime':
            return item.clockOutTime || '';
          case 'permissionLeaveDuration':
            return this.getPermissionLeaveDurationInSeconds(item);
          case 'status':
            return this.computeStatus(item);
          default:
            return '';
        }
      };

      this.filteredData.paginator = this.paginator;
      this.filteredData.sort = this.sort;
    } else {
      // If no date range is selected, show all entries
      this.filteredData = new MatTableDataSource(currentData);
      this.filteredData.paginator = this.paginator;
      this.filteredData.sort = this.sort;
    }
  }

  async editEntry(entry: TimeEntry) {
    const dialogRef = this.dialog.open(EditTimeDialogComponent, {
      data: {
        clockInTime: entry.clockInTime,
        clockOutTime: entry.clockOutTime,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (
        result &&
        this.validateTimeFormat(result.clockInTime) &&
        this.validateTimeFormat(result.clockOutTime)
      ) {
        try {
          const updatedEntry = {
            ...entry,
            clockInTime: result.clockInTime,
            clockOutTime: result.clockOutTime,
          };

          // Update local state immediately
          const currentData = [...this.dataSource.data];
          const index = currentData.findIndex(e => e.date === entry.date);
          if (index > -1) {
            currentData[index] = updatedEntry;
            this.dataSource.data = currentData;
            this.filterEntriesByDate();
          }

          // Then save to Strapi
          await this.saveToStrapi(updatedEntry);
          this.timerService.loadState();
          
          this.snackBar.open('Entry updated successfully!', 'Close', {
            duration: 2000,
          });
        } catch (error) {
          console.error('Error updating entry:', error);
          this.snackBar.open('Failed to update entry', 'Close', { duration: 3000 });
        }
      } else if (result) {
        this.snackBar.open(
          'Invalid time format. Please use HH:mm:ss.',
          'Close',
          { duration: 2000 }
        );
      }
    });
  }

  calculateHoursWorked(clockIn: string, clockOut: string, date: string): number {
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
    );

    if (permissionEntry) {
      const permissionDuration = this.permissionLeaveService.calculateDuration(permissionEntry);
      const [permHours, permMinutes, permSeconds] = permissionDuration.split(':').map(Number);
      const permDurationInHours = permHours + permMinutes / 60 + permSeconds / 3600;
      diffInHours -= permDurationInHours;
    }

    return Math.max(0, diffInHours);
  }
  getHoursWorked(entry: TimeEntry): number {
    if (!entry || !entry.clockInTime || !entry.clockOutTime || !entry.date) {
      return 0;
    }
    return this.calculateHoursWorked(
      entry.clockInTime || '---',
      entry.clockOutTime || '---',
      entry.date
    );
  }

  private getPermissionLeaveDurationInSeconds(entry: TimeEntry): number {
    const durationString = this.calculatePermissionLeaveDuration(entry);
    if (durationString === '---') {
      return 0;
    }

    const [hours, minutes, seconds] = durationString.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }

  private async updateEntry(entry: TimeEntry, updates: Partial<TimeEntry>) {
    if (!entry.documentId) {
      this.snackBar.open('Cannot update entry: missing documentId', 'Close', {
        duration: 3000,
      });
      return;
    }
    
    await firstValueFrom(this.timeEntryService.updateTimeEntry(entry.documentId, {
      ...entry,
      ...updates
    }));
    await this.loadInitialData();
  }

  async deleteEntry(entry: TimeEntry) {
    if (!entry.documentId) {
      this.snackBar.open('Cannot delete entry: missing documentId', 'Close', {
        duration: 3000,
      });
      return;
    }

    // Store the current data for rollback
    const previousData = [...this.dataSource.data];

    try {
      // Update local state immediately
      const currentData = this.dataSource.data.filter(e => e.date !== entry.date);
      this.dataSource.data = currentData;
      this.filterEntriesByDate();

      // Then delete from Strapi
      await firstValueFrom(this.timeEntryService.deleteTimeEntry(entry.documentId));
      this.snackBar.open('Entry deleted successfully!', 'Close', {
        duration: 2000,
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      // Restore previous state if API call fails
      this.dataSource.data = previousData;
      this.filterEntriesByDate();
      this.snackBar.open('Failed to delete entry', 'Close', { duration: 3000 });
    }
  }

  computeStatus(entry: TimeEntry): string {
    const hoursWorked = this.getHoursWorked(entry);
    const seconds = hoursWorked * 3600;
    const entryDate = new Date(entry.date);

    if (this.timerService.isWeekend(entryDate)) {
      return 'Weekend';
    }

    if (this.timerService.isVacationDay(entryDate)) {
      return 'Vacation Day';
    } else if (seconds < 0) {
      return 'Error';
    } else if (seconds === 0) {
      return 'Untracked';
    } else if (hoursWorked < 8) {
      return 'Partially tracked';
    } else {
      return 'Tracked';
    }
  }

  isDisabled(entry: TimeEntry): boolean {
    const status = this.computeStatus(entry);
    return status === 'Weekend' || status === 'Vacation Day';
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

  isWeekday = (date: Date | null): boolean => {
    const day = (date || new Date()).getDay();
    return day !== 0 && day !== 6;
  };

  calculateDetailedMonthlySummary() {
    if (!this.startDate || !this.endDate) {
      return {
        totalHoursWorked: 0,
        totalPossibleHours: 0,
        vacationDays: 0,
        untrackedOrPartiallyTrackedDays: 0,
      };
    }
  
    const start = new Date(this.startDate);
    start.setDate(1); 
    start.setHours(0, 0, 0, 0);
  
    const end = new Date(this.startDate);
    end.setMonth(end.getMonth() + 1); 
    end.setDate(0); 
    end.setHours(23, 59, 59, 999);
  
    const monthlyEntries = this.dataSource.data.filter((entry) => {
      const entryDate = new Date(entry.date).getTime();
      return entryDate >= start.getTime() && entryDate <= end.getTime();
    });
  
    let totalHoursWorked = 0;
    let vacationDays = 0;
    let untrackedOrPartiallyTrackedDays = 0;
    const totalPossibleHours = monthlyEntries.length * 8; 
  
    monthlyEntries.forEach((entry) => {
      totalHoursWorked += this.getHoursWorked(entry);
      const status = this.computeStatus(entry);
  
      if (status === 'Vacation Day') {
        vacationDays++;
      } else if (status === 'Untracked' || status === 'Partially tracked') {
        untrackedOrPartiallyTrackedDays++;
      }
    });
  
    return {
      totalHoursWorked,
      totalPossibleHours,
      vacationDays,
      untrackedOrPartiallyTrackedDays,
    };
  }
}
