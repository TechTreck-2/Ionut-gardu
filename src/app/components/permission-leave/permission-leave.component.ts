import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableComponent } from '../common/mat-table/mat-table.component';
import { MatButtonModule } from '@angular/material/button';
import { PermissionEntry } from '../../models/permission-entry.model';
import { PermissionLeaveService } from '../../services/permission-leave.service';
import { CommonModule } from '@angular/common';
import { PermissionEntryDialogComponent } from '../permission-entry-dialog/permission-entry-dialog.component';

@Component({
  selector: 'app-permission-leave',
  templateUrl: './permission-leave.component.html',
  styleUrls: ['./permission-leave.component.css'],
  standalone: true,
  imports: [MatTableComponent, MatButtonModule, CommonModule],
})
export class PermissionLeaveComponent implements OnInit {
  entries: PermissionEntry[] = [];
  displayedColumns: string[] = ['actions', 'date', 'startTime', 'endTime', 'leave-duration', 'status'];

  constructor(
    private permissionLeaveService: PermissionLeaveService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.entries = this.permissionLeaveService.getPermissionEntries();
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
    this.permissionLeaveService.savePermissionEntry(entry);
    this.entries = this.permissionLeaveService.getPermissionEntries();
    this.snackBar.open('Entry saved successfully', 'Close', { duration: 2000 });
  }

  deleteEntry(entry: PermissionEntry) {
    this.permissionLeaveService.deletePermissionEntry(entry);
    this.entries = this.permissionLeaveService.getPermissionEntries();
    this.snackBar.open('Entry deleted successfully', 'Close', { duration: 2000 });
  }
}