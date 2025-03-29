import { Component, Inject } from '@angular/core';
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
export class PermissionEntryDialogComponent {
  form: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<PermissionEntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
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

  validateTimes(): void {
    const startTime = this.form.get('startTime')?.value;
    const endTime = this.form.get('endTime')?.value;

    if (startTime && endTime) {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      const startDate = new Date();
      startDate.setHours(startHour, startMinute, 0, 0);

      const endDate = new Date();
      endDate.setHours(endHour, endMinute, 0, 0);

      if (startDate >= endDate) {
        this.errorMessage = 'Start time must be before end time.';
      } else {
        const duration =
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        if (duration > 2) {
          this.errorMessage = 'Duration must be 2 hours or less.';
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
      const formData = this.form.value;
      formData.date = this.formatDate(formData.date);
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
