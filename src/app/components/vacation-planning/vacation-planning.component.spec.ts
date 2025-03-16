import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VacationPlanningComponent } from './vacation-planning.component';

describe('VacationPlanningComponent', () => {
  let component: VacationPlanningComponent;
  let fixture: ComponentFixture<VacationPlanningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VacationPlanningComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VacationPlanningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
