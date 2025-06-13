import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VacationService } from '../../services/vacation.service';
import { VacationEntry } from '../../models/vacation-entry.model';
import { MatTableComponent } from '../common/mat-table/mat-table.component';
import { MatButtonModule } from '@angular/material/button';
import { VacationEntryDialogComponent } from '../vacation-entry-dialog/vacation-entry-dialog.component';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-vacation-planning',
  templateUrl: './vacation-planning.component.html',
  styleUrls: ['./vacation-planning.component.css'],
  standalone: true,
  imports: [MatTableComponent, MatButtonModule, CommonModule],
})
export class VacationPlanningComponent implements OnInit {
  entries: VacationEntry[] = [];
  displayedColumns: string[] = [
    'actions',
    'startDate',
    'endDate',
    'duration',
    'reason',
    'status',
  ];
  vacationDaysLeft: number = 21; // Default value, will be updated from service
  vacationService = inject(VacationService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);
  async ngOnInit(): Promise<void> {
    try {
      // Load entries via the service
      const entries = await firstValueFrom(this.vacationService.getVacationEntries());
      this.entries = entries;
      //console.log('Vacation entries loaded from Strapi:', entries);
      //console.log('Number of entries:', entries.length);
      //console.log('First entry details:', entries.length > 0 ? entries[0] : 'No entries available');
      //console.log('Raw Strapi response data:', JSON.stringify(entries, null, 2));
      
      // Load a separate instance of entries directly for comparison and debugging
      //console.log('----- Loading separate instance of vacation entries for verification -----');
      const separateEntriesObservable = this.vacationService.getVacationEntries();
      const separateEntries = await firstValueFrom(separateEntriesObservable);
      
      //console.log('Separate instance - Vacation entries from Strapi:', separateEntries);
      //console.log('Separate instance - Number of entries:', separateEntries.length);
      if (separateEntries.length > 0) {
        //console.log('Separate instance - First entry details:', separateEntries[0]);
        
      }
      
      // Verify that both instances have entries with string documentIds
      if (entries.length > 0 && separateEntries.length > 0) {
        
      }
      
      await this.updateVacationDaysLeft();
    } catch (error) {
      console.error('Error loading vacation entries:', error);
      this.snackBar.open('Error loading vacation entries', 'Close', { duration: 3000 });
    }
  }

  async ngOnChanges(): Promise<void> {
    try {
      const entries = await firstValueFrom(this.vacationService.getVacationEntries());
      this.entries = entries;
      //console.log('Vacation entries reloaded from Strapi:', entries);
      //console.log('Number of entries after change:', entries.length);
      //console.log('Entries data structure:', JSON.stringify(entries, null, 2));
      await this.updateVacationDaysLeft();
    } catch (error) {
      console.error('Error reloading vacation entries:', error);
      this.snackBar.open('Error reloading vacation entries', 'Close', { duration: 3000 });
    }
  }

  openModal() {
    const dialogRef = this.dialog.open(VacationEntryDialogComponent, {
      width: '300px',
      data: {
        existingEntries: this.entries,
        vacationDaysLeft: this.vacationDaysLeft,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        const startDate = new Date(result.startDate);
        const endDate = new Date(result.endDate);

        if (startDate <= endDate) {
          const duration = this.calculateWeekdays(startDate, endDate);
          const newEntry: VacationEntry = {
            startDate,
            endDate,
            duration,
            reason: result.reason,
            status: 'Pending',
          };

          try {
            await this.saveEntry(newEntry);
            this.snackBar.open('Vacation request submitted successfully', 'Close', { duration: 3000 });
          } catch (error) {
            console.error('Error saving vacation entry:', error);
            this.snackBar.open('Error saving vacation request', 'Close', { duration: 3000 });
          }
        }
      }
    });
  }

  calculateWeekdays(startDate: Date, endDate: Date): number {
    let count = 0;
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Exclude Sundays (0) and Saturdays (6)
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  }

  async saveEntry(entry: VacationEntry): Promise<void> {
    try {
      //console.log('Sending entry to Strapi:', entry);
      await this.vacationService.saveVacationEntry(entry);
      //console.log('Entry saved successfully to Strapi');
      
      const entries = await firstValueFrom(this.vacationService.getVacationEntries());
      //console.log('Updated entries from Strapi after save:', entries);
      this.entries = entries;
      await this.updateVacationDaysLeft();
    } catch (error) {
      console.error('Error in saveEntry:', error);
      throw error;
    }
  }
  
  async updateVacationDaysLeft(): Promise<void> {
    try {
      await this.vacationService.updateVacationDaysLeft();
      this.vacationDaysLeft = this.vacationService.getVacationDaysLeft();
    } catch (error) {
      console.error('Error updating vacation days left:', error);
      throw error;
    }
  }
  // Event handlers for mat-table events
  onEntryDeleted(entry: VacationEntry): void {
    //console.log('Entry deleted with documentId:', entry.documentId);
    
    if (entry && (entry.documentId || entry.id)) {
      const documentId = entry.documentId || entry.id!.toString();
      
      this.vacationService.deleteVacationEntry(documentId)
        .then(() => {
          this.snackBar.open('Vacation request deleted successfully', 'Close', { duration: 3000 });
          this.updateVacationDaysLeft();
        })
        .catch((error) => {
          console.error('Error deleting vacation entry:', error);
          this.snackBar.open('Error deleting vacation request', 'Close', { duration: 3000 });
        });
    } else {
      console.error('Cannot delete entry: Missing documentId', entry);
      this.snackBar.open('Error: Missing entry ID', 'Close', { duration: 3000 });
      this.updateVacationDaysLeft();
    }
  }
  onEntryApproved(entry: VacationEntry): void {
    //console.log('Entry approved with documentId:', entry.documentId);
    
    // Update the status in the backend
    if (entry) {
      // Make sure the entry has a valid documentId
      if (!entry.documentId && entry.id) {
        entry.documentId = entry.id.toString();
      }
      
      this.vacationService.updateVacationEntry(entry)
        .then(() => {
          this.snackBar.open('Vacation request approved successfully', 'Close', { duration: 3000 });
          this.updateVacationDaysLeft();
        })
        .catch((error) => {
          console.error('Error approving vacation entry:', error);
          this.snackBar.open('Error approving vacation request', 'Close', { duration: 3000 });
        });
    } else {
      console.error('Cannot approve entry: Invalid entry data', entry);
      this.snackBar.open('Error: Invalid entry data', 'Close', { duration: 3000 });
    }
  }
  onEntryCancelled(entry: VacationEntry): void {
    //console.log('Entry cancelled with documentId:', entry.documentId);
    
    // Update the status in the backend
    if (entry) {
      // Make sure the entry has a valid documentId
      if (!entry.documentId && entry.id) {
        entry.documentId = entry.id.toString();
      }
      
      this.vacationService.updateVacationEntry(entry)
        .then(() => {
          this.snackBar.open('Vacation request cancelled successfully', 'Close', { duration: 3000 });
          this.updateVacationDaysLeft();
        })
        .catch((error) => {
          console.error('Error cancelling vacation entry:', error);
          this.snackBar.open('Error cancelling vacation request', 'Close', { duration: 3000 });
        });
    } else {
      console.error('Cannot cancel entry: Invalid entry data', entry);
      this.snackBar.open('Error: Invalid entry data', 'Close', { duration: 3000 });
    }
  }
}
