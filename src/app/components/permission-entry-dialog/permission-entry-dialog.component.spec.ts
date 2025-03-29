import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionEntryDialogComponent } from './permission-entry-dialog.component';

describe('PermissionEntryDialogComponent', () => {
  let component: PermissionEntryDialogComponent;
  let fixture: ComponentFixture<PermissionEntryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionEntryDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermissionEntryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
