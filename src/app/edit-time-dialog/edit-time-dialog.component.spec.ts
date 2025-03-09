import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTimeDialogComponent } from './edit-time-dialog.component';

describe('EditTimeDialogComponent', () => {
  let component: EditTimeDialogComponent;
  let fixture: ComponentFixture<EditTimeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTimeDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditTimeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
