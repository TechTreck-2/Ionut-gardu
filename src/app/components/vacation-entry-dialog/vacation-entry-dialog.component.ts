import { Component, inject, Inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { VacationEntry } from '../../models/vacation-entry.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vacation-entry-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CommonModule,
  ],
  templateUrl: './vacation-entry-dialog.component.html',
  styleUrls: ['./vacation-entry-dialog.component.css'],
})
export class VacationEntryDialogComponent {
  vacationForm: FormGroup;
  errorMessage: string = '';
  existingEntries: VacationEntry[] = [];
  vacationDaysLeft: number;
  fb = inject (FormBuilder);
  dialogRef = inject (MatDialogRef<VacationEntryDialogComponent>);
  
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { existingEntries: VacationEntry[]; vacationDaysLeft: number }
  ) {
    this.existingEntries = data.existingEntries;
    this.vacationDaysLeft = data.vacationDaysLeft;

    this.vacationForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      reason: [''],
    });

    
    this.vacationForm.valueChanges.subscribe(() => {
      this.validateDates();
    });
  }

  validateDates() {
    const startDate = new Date(this.vacationForm.get('startDate')?.value);
    const endDate = new Date(this.vacationForm.get('endDate')?.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
  
    if (startDate && endDate) {
      if (startDate <= today) {
        this.errorMessage = 'Start date must be after today.';
      } else if (startDate > endDate) {
        this.errorMessage = 'Start date must be before or the same as the end date.';
      } else {
        const duration = this.calculateWeekdays(startDate, endDate);
        if (duration > this.vacationDaysLeft) {
          this.errorMessage = `You only have ${this.vacationDaysLeft} vacation days left.`;
        } else {
          this.errorMessage = ''; 
        }
      }
    } else {
      this.errorMessage = ''; 
    }
  }

  calculateWeekdays(startDate: Date, endDate: Date): number {
    let count = 0;
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  submitForm(): void {
    if (this.vacationForm.valid && !this.errorMessage) {
      this.dialogRef.close(this.vacationForm.value);
    }
  }

  dateFilter = (date: Date | null): boolean => {
    if (!date) {
      return false;
    }
  
    const day = date.getDay();
    if (day === 0 || day === 6) {
      return false;
    }
  
    const time = date.getTime();
    return !this.existingEntries.some((entry) => {
      const start = new Date(entry.startDate).getTime();
      const end = new Date(entry.endDate).getTime();
      return time >= start && time <= end;
    });
  };
}
