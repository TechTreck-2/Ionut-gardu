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
  @Input() displayedColumns: string[] = [];
  startDate: Date | null = null;
  endDate: Date | null = null;

  filteredData = new MatTableDataSource<VacationEntry>(this.entries); // Use definite assignment assertion

  @ViewChild(MatPaginator) paginator!: MatPaginator; // Use definite assignment assertion
  @ViewChild(MatSort) sort!: MatSort; // Use definite assignment assertion

  ngOnInit() {
    this.filteredData = new MatTableDataSource(this.entries); // Initialize with all entries
    setTimeout(() => {
      this.filteredData.paginator = this.paginator;
      this.filteredData.sort = this.sort;
    }, 0);
  }

  filterEntriesByDate() {
    const currentData = [...this.entries];

    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      start.setHours(0, 0, 0, 0); // Set to midnight

      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999); // Set to the end of the day

      // Filter the local copy based on the selected dates
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

      // Set the filteredData to a new MatTableDataSource with the filtered results
      this.filteredData = new MatTableDataSource(filteredEntries);

      this.filteredData.sortingDataAccessor = (item, property) => {
        switch (property) {
          case 'startDate':
            return new Date(item.startDate).getTime(); // Convert date to timestamp for comparison
          case 'endDate':
            return new Date(item.endDate).getTime(); // Convert date to timestamp for comparison
          case 'duration':
            return item.duration;
          case 'reason':
            return item.reason;
          case 'status':
            return item.status;
          default:
            return ''; // Return empty string for unsupported properties
        }
      };

      this.filteredData.paginator = this.paginator; // Link paginator to filteredData
      console.log('Data before sort:', this.filteredData.data);
      this.filteredData.sort = this.sort;
      console.log('Data after sort:', this.filteredData.data);
    } else {
      this.loadFromLocalStorage(); // Reload all entries if no dates are set
    }
  }

  loadFromLocalStorage() {
    // Implement this method to load data from local storage or another source
    this.filteredData.data = this.entries; // Example: reset to initial entries
  }
}
