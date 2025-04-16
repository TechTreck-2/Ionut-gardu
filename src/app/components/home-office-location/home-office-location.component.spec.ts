import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeOfficeLocationComponent } from './home-office-location.component';

describe('HomeOfficeLocationComponent', () => {
  let component: HomeOfficeLocationComponent;
  let fixture: ComponentFixture<HomeOfficeLocationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeOfficeLocationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeOfficeLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
