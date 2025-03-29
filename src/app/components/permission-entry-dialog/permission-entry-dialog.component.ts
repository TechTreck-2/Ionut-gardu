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
import { VacationEntry } from '../../models/vacation-entry.model';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-permission-entry-dialog',
  imports: [ ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CommonModule, ],
  templateUrl: './permission-entry-dialog.component.html',
  styleUrl: './permission-entry-dialog.component.css'
})
export class PermissionEntryDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<PermissionEntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      status: ['', Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.valid) {
      const formData = this.form.value;
      formData.startTime = new Date(formData.startTime).getTime();
      formData.endTime = new Date(formData.endTime).getTime();
      this.dialogRef.close(formData);
    }
  }
}
