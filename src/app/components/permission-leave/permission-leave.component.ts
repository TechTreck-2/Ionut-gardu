import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableComponent } from '../common/mat-table/mat-table.component';
import { MatButtonModule } from '@angular/material/button';
import { PermissionEntry } from '../../models/permission-entry.model';
import { PermissionLeaveService } from '../../services/permission-leave.service';
import { CommonModule } from '@angular/common';
import { PermissionEntryDialogComponent } from '../permission-entry-dialog/permission-entry-dialog.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-permission-leave',
  templateUrl: './permission-leave.component.html',
  styleUrls: ['./permission-leave.component.css'],
  standalone: true,
  imports: [MatTableComponent, MatButtonModule, CommonModule],
})
export class PermissionLeaveComponent implements OnInit, OnDestroy {
  entries: PermissionEntry[] = [];
  isLoading = true;
  hasError = false;
  displayedColumns: string[] = ['actions', 'date', 'startTime', 'endTime', 'leave-duration', 'status'];
  permissionLeaveService = inject(PermissionLeaveService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);
  private subscriptions = new Subscription();
    ngOnInit(): void {
    // Initialize with any existing entries (already filtered for current user by the API service)
    this.entries = this.permissionLeaveService.getPermissionEntries();
    
    // Subscribe to future updates (only entries for the logged-in user will be received)
    this.isLoading = true;
    this.subscriptions.add(
      this.permissionLeaveService.getPermissionEntriesAsync().subscribe({
        next: (entries) => {
          this.entries = entries;
          this.isLoading = false;
          this.hasError = false;
        },
        error: (error) => {
          console.error('Error loading permission entries:', error);
          this.isLoading = false;
          this.hasError = true;
          this.snackBar.open('Failed to load your permission leave requests', 'Close', { duration: 5000 });
        }
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  openModal() {
    const dialogRef = this.dialog.open(PermissionEntryDialogComponent, {
      width: '300px',
      data: { existingEntries: this.entries }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newEntry: PermissionEntry = {
          date: result.date,          // Ensure this is in "YYYY-MM-DD" format
          startTime: result.startTime, // Ensure this is in "HH:mm" format
          endTime: result.endTime,     // Ensure this is in "HH:mm" format
          status: 'Pending',
        };
        this.saveEntry(newEntry);
      }
    });
  }
  saveEntry(entry: PermissionEntry) {
    this.subscriptions.add(
      this.permissionLeaveService.savePermissionEntry(entry).subscribe({
        next: () => this.snackBar.open('Entry saved successfully', 'Close', { duration: 2000 }),
        error: (err) => {
          console.error('Error saving entry:', err);
          this.snackBar.open('Failed to save entry', 'Close', { duration: 2000 });
        }
      })
    );
  }

  deleteEntry(entry: PermissionEntry) {
    this.subscriptions.add(
      this.permissionLeaveService.deletePermissionEntry(entry).subscribe({
        next: () => this.snackBar.open('Entry deleted successfully', 'Close', { duration: 2000 }),
        error: (err) => {
          console.error('Error deleting entry:', err);
          this.snackBar.open('Failed to delete entry', 'Close', { duration: 2000 });
        }
      })
    );
  }
}