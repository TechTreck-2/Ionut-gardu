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
import { HomeOfficeRequestEntry } from '../../models/home-office-request-entry.model';
import { HomeOfficeRequestService } from '../../services/home-office-request.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-home-office-request-dialog',
  templateUrl: './home-office-request-dialog.component.html',
  styleUrl: './home-office-request-dialog.component.css',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatSelectModule, 
    MatInputModule, 
    MatButtonModule, 
    CommonModule, 
    MatDatepickerModule,
    MatProgressSpinnerModule
  ],
})
export class HomeOfficeRequestDialogComponent {
  form: FormGroup;
  locations: HomeOfficeEntry[] = [];
  requests: HomeOfficeRequestEntry[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<HomeOfficeRequestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private homeOfficeService: HomeOfficeService,
    private homeOfficeRequestService: HomeOfficeRequestService
  ) {
    // Initialize form
    this.form = this.fb.group({
      address: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    });
    
    this.loading = true;
    
    // Load locations from Strapi
    this.homeOfficeService.getEntries().subscribe({
      next: (locations) => {
        this.locations = locations;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading locations:', error);
        this.loading = false;
      }
    });
    
    // Load requests from Strapi
    this.homeOfficeRequestService.getEntries().subscribe({
      next: (requests) => {
        this.requests = requests;
      },
      error: (error) => {
        console.error('Error loading requests:', error);
      }
    });
  }

  dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
    if (isWeekend) return false;

    // Check if the date falls within any existing request period
    for (let request of this.requests) {
      const requestStartDate = new Date(request.startDate);
      const requestEndDate = new Date(request.endDate);
      if (date >= requestStartDate && date <= requestEndDate) {
        return false; // Disable this date if it overlaps with an existing request
      }
    }

    return true;
  };

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  close() {
    this.dialogRef.close();
  }
}
