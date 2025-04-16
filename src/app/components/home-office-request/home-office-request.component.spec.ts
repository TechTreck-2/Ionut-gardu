import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeOfficeRequestComponent } from './home-office-request.component';

describe('HomeOfficeRequestComponent', () => {
  let component: HomeOfficeRequestComponent;
  let fixture: ComponentFixture<HomeOfficeRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeOfficeRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeOfficeRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
