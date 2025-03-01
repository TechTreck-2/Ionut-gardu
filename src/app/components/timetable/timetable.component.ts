import { Component, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerToggle } from '@angular/material/datepicker';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimeTrackingService } from '../../time-tracking.service';

interface TimeEntry {
  date: string;
  hoursWorked: number;
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
    FormsModule
  ],
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.css']
})
export class TimeTrackingComponent implements OnInit {
  displayedColumns: string[] = ['date', 'hoursWorked', 'actions'];
  dataSource: TimeEntry[] = [];
  selectedDate: Date | null = null;
  newHours: number | null = null;

  constructor(private timeTrackingService: TimeTrackingService) {}

  ngOnInit(): void {
    this.timeTrackingService.timeEntries$.subscribe(entries => {
      this.dataSource = entries;
    });
  }

  addEntry() {
    if (this.selectedDate && this.newHours !== null) {
      const dateString = this.selectedDate.toDateString();
      this.timeTrackingService.addOrUpdateEntry({ date: dateString, hoursWorked: this.newHours });
      this.selectedDate = null;
      this.newHours = null;
    }
  }

  editEntry(entry: TimeEntry) {
    this.selectedDate = new Date(entry.date);
    this.newHours = entry.hoursWorked;
  }

  deleteEntry(entry: TimeEntry) {
    this.timeTrackingService.deleteEntry(entry.date);
  }
}