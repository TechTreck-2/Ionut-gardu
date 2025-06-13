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
    //console.log(' Loading home office requests from Strapi...');
    this.homeOfficeRequestService.getEntries()
      .pipe(
        catchError(error => {
          console.error(' Error loading home office requests:', error);
          this.snackBar.open('Failed to load home office requests', 'Close', { duration: 3000 });
          return of([]);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(entries => {
        //console.log(' Processed entries from service:', entries);
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
  }  deleteEntry(entry: HomeOfficeRequestEntry) {
    if (confirm('Are you sure you want to delete this request?')) {
      this.loading = true;
      const documentId = entry.documentId;
      
      if (!documentId) {
        this.snackBar.open('Cannot delete: Missing document ID', 'Close', { duration: 3000 });
        this.loading = false;
        return;
      }
      
      this.homeOfficeRequestService.deleteEntry(documentId)
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
  }  // Event handlers for mat-table events with documentId support
  onEntryDeleted(entry: HomeOfficeRequestEntry): void {
    console.log('Entry deleted with documentId:', entry.documentId);
    // Use the documentId for deletion
    if (entry.documentId) {
      this.deleteEntry(entry);
    } else {
      console.error('Cannot delete entry without documentId:', entry);
      this.snackBar.open('Failed to delete: Missing document ID', 'Close', { duration: 3000 });
    }
  }
  onEntryApproved(entry: HomeOfficeRequestEntry): void {
    console.log('Entry approved with documentId:', entry.documentId);
    // Update the status to 'Approved' and save
    const updatedEntry: HomeOfficeRequestEntry = { 
      ...entry, 
      status: 'Approved' as 'Approved'
    };
    if (entry.documentId) {
      this.updateEntryStatus(entry.documentId, updatedEntry);
    }
  }

  onEntryCancelled(entry: HomeOfficeRequestEntry): void {
    console.log('Entry cancelled with documentId:', entry.documentId);
    // Update the status to 'Cancelled' and save
    const updatedEntry: HomeOfficeRequestEntry = { 
      ...entry, 
      status: 'Rejected' as 'Rejected' // Using Rejected for Cancel since the model doesn't have 'Cancelled'
    };
    if (entry.documentId) {
      this.updateEntryStatus(entry.documentId, updatedEntry);
    }
  }

  private updateEntryStatus(documentId: string, entry: HomeOfficeRequestEntry): void {
    this.loading = true;
    this.homeOfficeRequestService.updateEntry(documentId, entry)
      .pipe(
        catchError(error => {
          console.error('Error updating entry status:', error);
          this.snackBar.open('Failed to update status', 'Close', { duration: 3000 });
          return of(null);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe((result: any) => {
        if (result) {
          this.snackBar.open(`Request status updated to ${entry.status}`, 'Close', { duration: 2000 });
          this.loadEntries();
        }
      });
  }
}
