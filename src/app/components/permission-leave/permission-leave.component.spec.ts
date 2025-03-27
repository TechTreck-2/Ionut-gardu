import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionLeaveComponent } from './permission-leave.component';

describe('PermissionLeaveComponent', () => {
  let component: PermissionLeaveComponent;
  let fixture: ComponentFixture<PermissionLeaveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionLeaveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermissionLeaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
