import { Component, OnInit, ViewChild, Input } from '@angular/core';
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
import { VacationEntry } from '../../../models/vacation-entry.model';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';

@Component({
  selector: 'app-mat-table',
  templateUrl: './mat-table.component.html',
  styleUrls: ['./mat-table.component.css'],
  imports: [
    MatTableModule,
    CommonModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatDatepickerModule,
    FormsModule,
    MatNativeDateModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
  ],
})
export class MatTableComponent implements OnInit {
  @Input() entries: VacationEntry[] = [];
  @Input() displayedColumns: string[] = ['startDate', 'endDate', 'duration', 'reason', 'status', 'actions'];
  startDate: Date | null = null;
  endDate: Date | null = null;

  filteredData = new MatTableDataSource<VacationEntry>(this.entries);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.filteredData = new MatTableDataSource(this.entries);
    setTimeout(() => {
      this.filteredData.paginator = this.paginator;
      this.filteredData.sort = this.sort;
    }, 0);
  }

  filterEntriesByDate() {
    const currentData = [...this.entries];

    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999);

      const filteredEntries = currentData.filter((entry) => {
        const entryStartDate = new Date(entry.startDate).getTime();
        const entryEndDate = new Date(entry.endDate).getTime();
        return (
          (entryStartDate >= start.getTime() &&
            entryStartDate <= end.getTime()) ||
          (entryEndDate >= start.getTime() && entryEndDate <= end.getTime()) ||
          (entryStartDate <= start.getTime() && entryEndDate >= end.getTime())
        );
      });

      this.filteredData = new MatTableDataSource(filteredEntries);

      this.filteredData.sortingDataAccessor = (item, property) => {
        switch (property) {
          case 'startDate':
            return new Date(item.startDate).getTime();
          case 'endDate':
            return new Date(item.endDate).getTime();
          case 'duration':
            return item.duration;
          case 'reason':
            return item.reason;
          case 'status':
            return item.status;
          default:
            return '';
        }
      };

      this.filteredData.paginator = this.paginator;
      this.filteredData.sort = this.sort;
    } else {
      this.loadFromLocalStorage();
    }
  }

  loadFromLocalStorage() {
    this.filteredData.data = this.entries;
  }

  deleteEntry(entry: VacationEntry) {
    // Remove the entry from the data source
    const index = this.entries.findIndex(e => e === entry);
    if (index > -1) {
      this.entries.splice(index, 1);
      this.filteredData.data = [...this.entries];
    }

    // Remove the entry from local storage
    localStorage.setItem('vacationEntries', JSON.stringify(this.entries));

    // Optionally, show a snackbar notification
    // this.snackBar.open('Entry deleted successfully', 'Close', { duration: 3000 });
  }
}