import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableComponent } from '../common/mat-table/mat-table.component';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { HomeOfficeRequestEntry } from '../../models/home-office-request-entry.model';
import { HomeOfficeRequestService } from '../../services/home-office-request.service';
import { HomeOfficeRequestDialogComponent } from '../home-office-request-dialog/home-office-request-dialog.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-home-office-request',
  templateUrl: './home-office-request.component.html',
  styleUrls: ['./home-office-request.component.css'],
  standalone: true,
  imports: [MatTableComponent, MatButtonModule, CommonModule, MatProgressSpinnerModule],
})
export class HomeOfficeRequestComponent implements OnInit {
  entries: HomeOfficeRequestEntry[] = [];
  displayedColumns: string[] = ['actions', 'address', 'startDate', 'endDate', 'status'];
  homeOfficeRequestService = inject(HomeOfficeRequestService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);
  loading = false;

  ngOnInit(): void {
    this.loadEntries();
  }

  loadEntries() {
    this.loading = true;
    this.homeOfficeRequestService.getEntries()
      .pipe(
        catchError(error => {
          console.error('Error loading home office requests:', error);
          this.snackBar.open('Failed to load home office requests', 'Close', { duration: 3000 });
          return of([]);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(entries => {
        this.entries = entries;
      });
  }

  openModal() {
    const dialogRef = this.dialog.open(HomeOfficeRequestDialogComponent, {
      width: '400px',
      data: { existingEntries: this.entries }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newEntry: HomeOfficeRequestEntry = {
          address: result.address,
          startDate: result.startDate,
          endDate: result.endDate,
          status: 'Pending',
        };
        this.saveEntry(newEntry);
      }
    });
  }
  saveEntry(entry: HomeOfficeRequestEntry) {
    this.loading = true;
    this.homeOfficeRequestService.saveEntry(entry)
      .pipe(
        catchError(error => {
          console.error('Error saving home office request:', error);
          this.snackBar.open('Failed to save request', 'Close', { duration: 3000 });
          return of(null);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe((result: any) => {
        if (result) {
          this.snackBar.open('Request saved successfully', 'Close', { duration: 2000 });
          this.loadEntries();
        }
      });
  }
  deleteEntry(entry: any) {
    if (confirm('Are you sure you want to delete this request?')) {
      this.loading = true;
      this.homeOfficeRequestService.deleteEntry(entry.id)
        .pipe(
          catchError(error => {
            console.error('Error deleting home office request:', error);
            this.snackBar.open('Failed to delete request', 'Close', { duration: 3000 });
            return of(null);
          }),
          finalize(() => this.loading = false)
        )
        .subscribe((result: any) => {
          if (result !== null) {
            this.snackBar.open('Request deleted successfully', 'Close', { duration: 2000 });
            this.loadEntries();
          }
        });
    }
  }
}
