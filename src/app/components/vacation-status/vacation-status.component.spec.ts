import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VacationStatusComponent } from './vacation-status.component';

describe('VacationStatusComponent', () => {
  let component: VacationStatusComponent;
  let fixture: ComponentFixture<VacationStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VacationStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VacationStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
