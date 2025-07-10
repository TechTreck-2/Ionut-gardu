import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { PermissionLeaveComponent } from './permission-leave.component';
import { PermissionService } from '../../services/permission.service';

describe('PermissionLeaveComponent', () => {
  let component: PermissionLeaveComponent;
  let fixture: ComponentFixture<PermissionLeaveComponent>;
  let mockPermissionService: jasmine.SpyObj<PermissionService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  beforeEach(async () => {
    const permissionServiceSpy = jasmine.createSpyObj('PermissionService', [
      'getPermissionEntries',
      'getPermissionEntriesAsync',
      'savePermissionEntry',
      'updatePermissionEntry',
      'deletePermissionEntry'
    ]);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    permissionServiceSpy.getPermissionEntries.and.returnValue([]);
    permissionServiceSpy.getPermissionEntriesAsync.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [PermissionLeaveComponent, BrowserAnimationsModule],
      providers: [
        { provide: PermissionService, useValue: permissionServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    })
    .compileComponents();

    mockPermissionService = TestBed.inject(PermissionService) as jasmine.SpyObj<PermissionService>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture = TestBed.createComponent(PermissionLeaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
