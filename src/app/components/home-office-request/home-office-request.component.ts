import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableComponent } from '../common/mat-table/mat-table.component';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { HomeOfficeRequestEntry } from '../../models/home-office-request-entry.model';
import { HomeOfficeRequestService } from '../../services/home-office-request.service';
import { HomeOfficeRequestDialogComponent } from '../home-office-request-dialog/home-office-request-dialog.component';

@Component({
  selector: 'app-home-office-request',
  templateUrl: './home-office-request.component.html',
  styleUrls: ['./home-office-request.component.css'],
  standalone: true,
  imports: [MatTableComponent, MatButtonModule, CommonModule],
})
export class HomeOfficeRequestComponent implements OnInit {
  entries: HomeOfficeRequestEntry[] = [];
  displayedColumns: string[] = ['actions', 'address', 'startDate', 'endDate', 'status'];
  homeOfficeRequestService = inject(HomeOfficeRequestService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.entries = this.homeOfficeRequestService.getEntries();
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
    this.homeOfficeRequestService.saveEntry(entry);
    this.entries = this.homeOfficeRequestService.getEntries();
    this.snackBar.open('Request saved successfully', 'Close', { duration: 2000 });
  }

  deleteEntry(entry: HomeOfficeRequestEntry) {
    this.homeOfficeRequestService.deleteEntry(entry);
    this.entries = this.homeOfficeRequestService.getEntries();
    this.snackBar.open('Request deleted successfully', 'Close', { duration: 2000 });
  }
}
