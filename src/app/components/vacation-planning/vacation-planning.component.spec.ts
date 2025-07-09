import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { VacationPlanningComponent } from './vacation-planning.component';
import { VacationService } from '../../services/vacation.service';

describe('VacationPlanningComponent', () => {
  let component: VacationPlanningComponent;
  let fixture: ComponentFixture<VacationPlanningComponent>;
  let mockVacationService: jasmine.SpyObj<VacationService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const vacationServiceSpy = jasmine.createSpyObj('VacationService', [
      'getVacationEntries',
      'getVacationDaysLeft',
      'saveVacationEntry',
      'updateVacationEntry',
      'deleteVacationEntry'
    ]);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    vacationServiceSpy.getVacationEntries.and.returnValue(of([]));
    vacationServiceSpy.getVacationDaysLeft.and.returnValue(of(21));    await TestBed.configureTestingModule({
      imports: [VacationPlanningComponent, BrowserAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: VacationService, useValue: vacationServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    })
    .compileComponents();

    mockVacationService = TestBed.inject(VacationService) as jasmine.SpyObj<VacationService>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture = TestBed.createComponent(VacationPlanningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
