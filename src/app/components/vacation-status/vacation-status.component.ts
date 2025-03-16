import { Component } from '@angular/core';
import { VacationService } from '../../services/vacation.service';
import { VacationEntry } from '../../models/vacation-entry.model';

@Component({
  selector: 'app-vacation-status',
  templateUrl: './vacation-status.component.html',
  styleUrls: ['./vacation-status.component.css']
})
export class VacationStatusComponent {
  entries: VacationEntry[] = [];
  displayedColumns: string[] = ['startDate', 'endDate', 'duration', 'reason', 'status'];

  constructor(private vacationService: VacationService) {
    this.entries = this.vacationService.getVacationEntries();
  }
}