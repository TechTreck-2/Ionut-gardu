import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeOfficeRequestDialogComponent } from './home-office-request-dialog.component';

describe('HomeOfficeRequestDialogComponent', () => {
  let component: HomeOfficeRequestDialogComponent;
  let fixture: ComponentFixture<HomeOfficeRequestDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeOfficeRequestDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeOfficeRequestDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
