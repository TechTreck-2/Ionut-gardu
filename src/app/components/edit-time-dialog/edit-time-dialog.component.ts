import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  clockInTime: string;
  clockOutTime: string;
}

@Component({
  selector: 'app-edit-time-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule
  ],
  templateUrl: './edit-time-dialog.component.html',
  styleUrls: ['./edit-time-dialog.component.css']
})
export class EditTimeDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EditTimeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSaveClick(): void {
    this.dialogRef.close(this.data); // Pass updated data back to parent
  }
}