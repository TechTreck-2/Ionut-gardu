import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HomeOfficeService } from '../../services/home-office.service';
import { HomeOfficeEntry } from '../../models/home-office-entry.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  selector: 'app-home-office-request-dialog',
  templateUrl: './home-office-request-dialog.component.html',
  styleUrl: './home-office-request-dialog.component.css',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule, CommonModule, MatDatepickerModule],
})
export class HomeOfficeRequestDialogComponent {
  form: FormGroup;
  locations: HomeOfficeEntry[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<HomeOfficeRequestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private homeOfficeService: HomeOfficeService
  ) {
    this.locations = this.homeOfficeService.getEntries();
    this.form = this.fb.group({
      address: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    });
  }

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  close() {
    this.dialogRef.close();
  }
}
