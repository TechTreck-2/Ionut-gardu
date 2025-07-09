import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { PermissionEntryDialogComponent } from './permission-entry-dialog.component';
import { VacationService } from '../../services/vacation.service';

describe('PermissionEntryDialogComponent', () => {
  let component: PermissionEntryDialogComponent;
  let fixture: ComponentFixture<PermissionEntryDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<PermissionEntryDialogComponent>>;
  let mockVacationService: jasmine.SpyObj<VacationService>;

  beforeEach(async () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const vacationServiceSpy = jasmine.createSpyObj('VacationService', ['getVacationEntries']);

    vacationServiceSpy.getVacationEntries.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [PermissionEntryDialogComponent, BrowserAnimationsModule],
      providers: [
        FormBuilder,
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { existingEntries: [] } },
        { provide: VacationService, useValue: vacationServiceSpy },
      ],
    })
    .compileComponents();

    mockDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<PermissionEntryDialogComponent>>;
    mockVacationService = TestBed.inject(VacationService) as jasmine.SpyObj<VacationService>;

    fixture = TestBed.createComponent(PermissionEntryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
