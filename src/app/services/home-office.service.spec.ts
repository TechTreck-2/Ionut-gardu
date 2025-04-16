import { TestBed } from '@angular/core/testing';

import { HomeOfficeService } from './home-office.service';

describe('HomeOfficeService', () => {
  let service: HomeOfficeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HomeOfficeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
