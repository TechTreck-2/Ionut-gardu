import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { HomeOfficeService } from './home-office.service';

describe('HomeOfficeService', () => {
  let service: HomeOfficeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(HomeOfficeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
