import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { TimeTrackingComponent } from './timetable.component';
import { TimerService } from '../../services/timer.service';
import { TimeEntryService } from '../../services/time-entry.service';
import { PermissionService } from '../../services/permission.service';
import { VacationService } from '../../services/vacation.service';

describe('TimetableComponent', () => {
  let component: TimeTrackingComponent;
  let fixture: ComponentFixture<TimeTrackingComponent>;
  let mockTimerService: jasmine.SpyObj<TimerService>;
  let mockTimeEntryService: jasmine.SpyObj<TimeEntryService>;
  let mockPermissionService: jasmine.SpyObj<PermissionService>;
  let mockVacationService: jasmine.SpyObj<VacationService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;  beforeEach(async () => {
    const timerServiceSpy = jasmine.createSpyObj('TimerService', [
      'getTimeEntries', 
      'getFirstClockIn', 
      'getClockOutTime',
      'isWeekend',
      'isVacationDay'
    ], {
      time$: of(0),
      vacationService: jasmine.createSpyObj('VacationService', ['getVacationEntries'])
    });
    const timeEntryServiceSpy = jasmine.createSpyObj('TimeEntryService', ['getTimeEntries', 'updateTimeEntry']);
    const permissionServiceSpy = jasmine.createSpyObj('PermissionService', ['getPermissionEntries']);
    const vacationServiceSpy = jasmine.createSpyObj('VacationService', ['getVacationEntries', 'isVacationDay']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);    timerServiceSpy.getTimeEntries.and.returnValue(of([]));
    timerServiceSpy.getFirstClockIn.and.returnValue(null);
    timerServiceSpy.getClockOutTime.and.returnValue(null);
    timerServiceSpy.isWeekend.and.returnValue(false);
    timerServiceSpy.isVacationDay.and.returnValue(Promise.resolve(false));
    timerServiceSpy.vacationService.getVacationEntries.and.returnValue(of([]));
    timeEntryServiceSpy.getTimeEntries.and.returnValue(of([]));
    permissionServiceSpy.getPermissionEntries.and.returnValue(of([]));
    vacationServiceSpy.getVacationEntries.and.returnValue(of([]));
    vacationServiceSpy.isVacationDay.and.returnValue(Promise.resolve(false));

    await TestBed.configureTestingModule({
      imports: [TimeTrackingComponent, BrowserAnimationsModule],
      providers: [
        { provide: TimerService, useValue: timerServiceSpy },
        { provide: TimeEntryService, useValue: timeEntryServiceSpy },
        { provide: PermissionService, useValue: permissionServiceSpy },
        { provide: VacationService, useValue: vacationServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    })
    .compileComponents();

    mockTimerService = TestBed.inject(TimerService) as jasmine.SpyObj<TimerService>;
    mockTimeEntryService = TestBed.inject(TimeEntryService) as jasmine.SpyObj<TimeEntryService>;
    mockPermissionService = TestBed.inject(PermissionService) as jasmine.SpyObj<PermissionService>;
    mockVacationService = TestBed.inject(VacationService) as jasmine.SpyObj<VacationService>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture = TestBed.createComponent(TimeTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
