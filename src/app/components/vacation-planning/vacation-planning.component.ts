import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { VacationService } from '../../services/vacation.service';
import { VacationEntry } from '../../models/vacation-entry.model';
import { MatTableComponent } from '../common/mat-table/mat-table.component';
import { MatButtonModule } from '@angular/material/button';
import { VacationEntryDialogComponent } from '../vacation-entry-dialog/vacation-entry-dialog.component';

@Component({
  selector: 'app-vacation-planning',
  templateUrl: './vacation-planning.component.html',
  styleUrls: ['./vacation-planning.component.css'],
  imports: [MatTableComponent, MatButtonModule],
})
export class VacationPlanningComponent {
  entries: VacationEntry[] = [];
  displayedColumns: string[] = ['startDate', 'endDate', 'duration', 'reason', 'status'];

  constructor(private vacationService: VacationService, public dialog: MatDialog) {
    this.entries = this.vacationService.getVacationEntries();
  }

  openModal() {
    const dialogRef = this.dialog.open(VacationEntryDialogComponent, {
      width: '300px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const startDate = new Date(result.startDate);
        const endDate = new Date(result.endDate);
        const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const newEntry: VacationEntry = {
          startDate,
          endDate,
          duration,
          reason: result.reason,
          status: 'pending',
        };
        this.saveEntry(newEntry);
      }
    });
  }

  saveEntry(entry: VacationEntry) {
    this.vacationService.saveVacationEntry(entry);
    this.entries = this.vacationService.getVacationEntries();
  }
}