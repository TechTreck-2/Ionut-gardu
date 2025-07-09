import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { HomeOfficeRequestComponent } from './home-office-request.component';
import { HomeOfficeRequestService } from '../../services/home-office-request.service';

describe('HomeOfficeRequestComponent', () => {
  let component: HomeOfficeRequestComponent;
  let fixture: ComponentFixture<HomeOfficeRequestComponent>;
  let mockHomeOfficeRequestService: jasmine.SpyObj<HomeOfficeRequestService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const homeOfficeRequestServiceSpy = jasmine.createSpyObj('HomeOfficeRequestService', [
      'getEntries',
      'saveEntry',
      'updateEntry',
      'deleteEntry'
    ]);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    homeOfficeRequestServiceSpy.getEntries.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [HomeOfficeRequestComponent, BrowserAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: HomeOfficeRequestService, useValue: homeOfficeRequestServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    })
    .compileComponents();

    mockHomeOfficeRequestService = TestBed.inject(HomeOfficeRequestService) as jasmine.SpyObj<HomeOfficeRequestService>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture = TestBed.createComponent(HomeOfficeRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
