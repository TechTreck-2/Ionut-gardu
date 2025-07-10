import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { of } from 'rxjs';

import { HomeOfficeRequestDialogComponent } from './home-office-request-dialog.component';
import { HomeOfficeService } from '../../services/home-office.service';
import { HomeOfficeRequestService } from '../../services/home-office-request.service';

describe('HomeOfficeRequestDialogComponent', () => {
  let component: HomeOfficeRequestDialogComponent;
  let fixture: ComponentFixture<HomeOfficeRequestDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<HomeOfficeRequestDialogComponent>>;
  let mockHomeOfficeService: jasmine.SpyObj<HomeOfficeService>;
  let mockHomeOfficeRequestService: jasmine.SpyObj<HomeOfficeRequestService>;

  beforeEach(async () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const homeOfficeServiceSpy = jasmine.createSpyObj('HomeOfficeService', ['getEntries']);
    const homeOfficeRequestServiceSpy = jasmine.createSpyObj('HomeOfficeRequestService', ['getEntries']);

    homeOfficeServiceSpy.getEntries.and.returnValue(of([]));
    homeOfficeRequestServiceSpy.getEntries.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [HomeOfficeRequestDialogComponent, BrowserAnimationsModule],
      providers: [
        FormBuilder,
        provideNativeDateAdapter(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { existingEntries: [] } },
        { provide: HomeOfficeService, useValue: homeOfficeServiceSpy },
        { provide: HomeOfficeRequestService, useValue: homeOfficeRequestServiceSpy },
      ],
    })
    .compileComponents();

    mockDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<HomeOfficeRequestDialogComponent>>;
    mockHomeOfficeService = TestBed.inject(HomeOfficeService) as jasmine.SpyObj<HomeOfficeService>;
    mockHomeOfficeRequestService = TestBed.inject(HomeOfficeRequestService) as jasmine.SpyObj<HomeOfficeRequestService>;

    fixture = TestBed.createComponent(HomeOfficeRequestDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
