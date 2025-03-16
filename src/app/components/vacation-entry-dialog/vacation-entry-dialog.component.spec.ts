import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VacationEntryDialogComponent } from './vacation-entry-dialog.component';

describe('VacationEntryDialogComponent', () => {
  let component: VacationEntryDialogComponent;
  let fixture: ComponentFixture<VacationEntryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VacationEntryDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VacationEntryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
