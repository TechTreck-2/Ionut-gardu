import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { VacationEntryDialogComponent } from './vacation-entry-dialog.component';

describe('VacationEntryDialogComponent', () => {
  let component: VacationEntryDialogComponent;
  let fixture: ComponentFixture<VacationEntryDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<VacationEntryDialogComponent>>;

  beforeEach(async () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [VacationEntryDialogComponent, BrowserAnimationsModule],
      providers: [
        FormBuilder,
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { existingEntries: [], vacationDaysLeft: 21 } },
      ],
    })
    .compileComponents();

    mockDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<VacationEntryDialogComponent>>;

    fixture = TestBed.createComponent(VacationEntryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
