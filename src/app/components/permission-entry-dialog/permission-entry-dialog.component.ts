import { Component, inject, Inject, OnInit } from '@angular/core';
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
import { CommonModule } from '@angular/common';
import { PermissionEntry } from '../../models/permission-entry.model';
import { VacationEntry } from '../../models/vacation-entry.model';
import { VacationService } from '../../services/vacation.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-permission-entry-dialog',
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
  templateUrl: './permission-entry-dialog.component.html',
  styleUrls: ['./permission-entry-dialog.component.css'],
})
export class PermissionEntryDialogComponent implements OnInit {
  form: FormGroup;
  errorMessage: string = '';
  existingEntries: PermissionEntry[] = [];
  vacationEntries: VacationEntry[] = []; 
  vacationService = inject(VacationService);
  fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<PermissionEntryDialogComponent>);
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.existingEntries = data.existingEntries || [];
    this.form = this.fb.group({
      date: ['', Validators.required],
      startTime: [
        '',
        [
          Validators.required,
          Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
        ],
      ],
      endTime: [
        '',
        [
          Validators.required,
          Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
        ],
      ],
    });

    this.form.valueChanges.subscribe(() => {
      this.validateTimes();
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      this.vacationEntries = await firstValueFrom(this.vacationService.getVacationEntries());
    } catch (error) {
      console.error('Error loading vacation entries:', error);
      this.errorMessage = 'Failed to load vacation entries';
    }
  }

  dateFilter = (date: Date | null): boolean => {
    if (!date) {
      return false;
    }

    const day = date.getDay();
    if (day === 0 || day === 6) {
      return false; // Block weekends
    }

    const dateString = this.formatDate(date);

    // Block vacation days
    if (
      this.vacationEntries.some((entry) => {
        const entryStartDate = new Date(entry.startDate);
        const entryEndDate = new Date(entry.endDate);
        return (
          entry.status === 'Approved' &&
          entryStartDate <= date &&
          entryEndDate >= date
        );
      })
    ) {
      return false;
    }

    const totalDurationForDate = this.existingEntries
      .filter((entry) => entry.date === dateString)
      .reduce((total, entry) => {
        const [entryStartHour, entryStartMinute] = entry.startTime
          .split(':')
          .map(Number);
        const [entryEndHour, entryEndMinute] = entry.endTime
          .split(':')
          .map(Number);

        const entryStartDate = new Date();
        entryStartDate.setHours(entryStartHour, entryStartMinute, 0, 0);

        const entryEndDate = new Date();
        entryEndDate.setHours(entryEndHour, entryEndMinute, 0, 0);

        return (
          total +
          (entryEndDate.getTime() - entryStartDate.getTime()) / (1000 * 60 * 60)
        );
      }, 0);

    return totalDurationForDate < 2; // Allow only if less than 2 hours
  };

  validateTimes(): void {
    const startTime = this.form.get('startTime')?.value;
    const endTime = this.form.get('endTime')?.value;
    const date = this.form.get('date')?.value;

    if (startTime && endTime && date) {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate <= today) {
        this.errorMessage = 'The date must be after today.';
        return;
      }

      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      const startDate = new Date();
      startDate.setHours(startHour, startMinute, 0, 0);

      const endDate = new Date();
      endDate.setHours(endHour, endMinute, 0, 0);

      if (startDate >= endDate) {
        this.errorMessage = 'Start time must be before end time.';
      } else {
        const newEntryDuration =
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

        if (newEntryDuration < 0.25) {
          this.errorMessage = 'Duration must be at least 15 minutes.';
          return;
        }

        const totalDurationForDate = this.existingEntries
          .filter((entry) => entry.date === this.formatDate(date))
          .reduce((total, entry) => {
            const [entryStartHour, entryStartMinute] = entry.startTime
              .split(':')
              .map(Number);
            const [entryEndHour, entryEndMinute] = entry.endTime
              .split(':')
              .map(Number);

            const entryStartDate = new Date();
            entryStartDate.setHours(entryStartHour, entryStartMinute, 0, 0);

            const entryEndDate = new Date();
            entryEndDate.setHours(entryEndHour, entryEndMinute, 0, 0);

            return (
              total +
              (entryEndDate.getTime() - entryStartDate.getTime()) /
                (1000 * 60 * 60)
            );
          }, 0);

        if (totalDurationForDate + newEntryDuration > 2) {
          this.errorMessage =
            'Total duration for the day must not exceed 2 hours.';
        } else {
          this.errorMessage = '';
        }
      }
    } else {
      this.errorMessage = '';
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.valid && !this.errorMessage) {
      const formData: PermissionEntry = {
        ...this.form.value,
        date: this.formatDate(this.form.value.date),
        status: 'Pending',
      };
      this.dialogRef.close(formData);
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
