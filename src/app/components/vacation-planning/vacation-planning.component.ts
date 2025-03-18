import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VacationService } from '../../services/vacation.service';
import { VacationEntry } from '../../models/vacation-entry.model';
import { MatTableComponent } from '../common/mat-table/mat-table.component';
import { MatButtonModule } from '@angular/material/button';
import { VacationEntryDialogComponent } from '../vacation-entry-dialog/vacation-entry-dialog.component';

@Component({
  selector: 'app-vacation-planning',
  templateUrl: './vacation-planning.component.html',
  styleUrls: ['./vacation-planning.component.css'],
  standalone: true,
  imports: [MatTableComponent, MatButtonModule],
})
export class VacationPlanningComponent {
  entries: VacationEntry[] = [];
  displayedColumns: string[] = ['actions','startDate', 'endDate', 'duration', 'reason', 'status'];
  vacationDaysLeft: number = 21;

  constructor(
    private vacationService: VacationService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.entries = this.vacationService.getVacationEntries();
    this.updateVacationDaysLeft();
  }

  openModal() {
    const dialogRef = this.dialog.open(VacationEntryDialogComponent, {
      width: '300px',
      data: { existingEntries: this.entries, vacationDaysLeft: this.vacationDaysLeft } // Pass vacationDaysLeft
    });
  
    dialogRef.afterClosed().subscribe(result => {
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
          this.saveEntry(newEntry);
        }
      }
    });
  }

  calculateWeekdays(startDate: Date, endDate: Date): number {
    let count = 0;
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sundays (0) and Saturdays (6)
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  }

  saveEntry(entry: VacationEntry) {
    this.vacationService.saveVacationEntry(entry);
    this.entries = this.vacationService.getVacationEntries();
    this.updateVacationDaysLeft();
  }

  deleteEntry(entry: VacationEntry) {
    const index = this.entries.findIndex(e => e === entry);
    if (index > -1) {
      this.entries.splice(index, 1);
      localStorage.setItem('vacationEntries', JSON.stringify(this.entries));
      this.updateVacationDaysLeft();
    }
  }

  updateVacationDaysLeft() {
    const usedDays = this.entries.reduce((total, entry) => total + entry.duration, 0);
    this.vacationDaysLeft = 21 - usedDays;
  }
}