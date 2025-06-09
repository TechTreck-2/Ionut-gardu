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
      const entries = await firstValueFrom(this.vacationService.getVacationEntries());
      this.entries = entries;
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
      await this.vacationService.saveVacationEntry(entry);
      const entries = await firstValueFrom(this.vacationService.getVacationEntries());
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
}
