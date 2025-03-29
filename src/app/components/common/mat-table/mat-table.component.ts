import { Component, OnInit, ViewChild, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { PermissionLeaveService } from '../../../services/permission-leave.service';

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
export class MatTableComponent<T> implements OnInit {
  constructor(private permissionLeaveService: PermissionLeaveService) {}

  @Input() entries: T[] = [];
  @Input() displayedColumns: string[] = [];
  @Input() localStorageKey: string = 'defaultEntries'; // Unique key for each component
  @Output() entryDeleted = new EventEmitter<void>();
  startDate: Date | null = null;
  endDate: Date | null = null;

  filteredData = new MatTableDataSource<T>(this.entries);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.initializeDataSource();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['entries']) {
      this.updateDataSource();
    }
  }

  initializeDataSource() {
    this.filteredData.data = this.entries;
    setTimeout(() => {
      this.filteredData.paginator = this.paginator;
      this.filteredData.sort = this.sort;
    }, 0);
  }

  updateDataSource() {
    this.filteredData.data = this.entries;
    this.filteredData.paginator = this.paginator;
    this.filteredData.sort = this.sort;
  }

  filterEntriesByDate() {
    const currentData = [...this.entries];
  
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      start.setHours(0, 0, 0, 0);
  
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999);
  
      let filteredEntries;
  
      if (this.localStorageKey === 'vacationEntries') {
        filteredEntries = currentData.filter((entry: any) => {
          const entryStartDate = new Date(entry.startDate).getTime();
          const entryEndDate = new Date(entry.endDate).getTime();
          return (
            (entryStartDate >= start.getTime() &&
              entryStartDate <= end.getTime()) ||
            (entryEndDate >= start.getTime() && entryEndDate <= end.getTime()) ||
            (entryStartDate <= start.getTime() && entryEndDate >= end.getTime())
          );
        });
      } else if (this.localStorageKey === 'permissionEntries') {
        // Ensure entry.date is parsed correctly
        filteredEntries = currentData.filter((entry: any) => {
          const entryDate = new Date(entry.date).getTime();
          return entryDate >= start.getTime() && entryDate <= end.getTime();
        });
      } else {
        filteredEntries = currentData;
      }
  
      this.filteredData = new MatTableDataSource(filteredEntries);
  
      this.filteredData.sortingDataAccessor = (item: any, property) => {
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
          // Add cases for permissionEntries fields
          case 'date':
            return new Date(item.date).getTime();
          case 'title':
            return item.title;
          case 'description':
            return item.description;
          // Add more cases as needed for other fields
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
    const storedEntries = localStorage.getItem(this.localStorageKey);
    this.entries = storedEntries ? JSON.parse(storedEntries) : [];
    this.filteredData.data = this.entries;
    console.log('Entries loaded from local storage:', this.entries);
  }

  deleteEntry(entry: T) {
    const index = this.entries.findIndex(e => e === entry);
    if (index > -1) {
      this.entries.splice(index, 1);
      this.filteredData.data = [...this.entries];
      this.entryDeleted.emit();
    }

    localStorage.setItem(this.localStorageKey, JSON.stringify(this.entries));
  }

  isWeekday = (date: Date | null): boolean => {
    const day = (date || new Date()).getDay();
    return day !== 0 && day !== 6;
  };

  calculateDuration(entry: any): string {
    return this.permissionLeaveService.calculateDuration(entry);
  }
}