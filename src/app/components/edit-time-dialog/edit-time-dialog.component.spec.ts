import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { EditTimeDialogComponent } from './edit-time-dialog.component';

describe('EditTimeDialogComponent', () => {
  let component: EditTimeDialogComponent;
  let fixture: ComponentFixture<EditTimeDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<EditTimeDialogComponent>>;

  beforeEach(async () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [EditTimeDialogComponent, BrowserAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { entry: { date: new Date(), clockInTime: '09:00', clockOutTime: '17:00' } } },
      ],
    })
    .compileComponents();

    mockDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<EditTimeDialogComponent>>;

    fixture = TestBed.createComponent(EditTimeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
