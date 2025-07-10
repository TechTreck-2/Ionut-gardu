import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { HomeOfficeRequestService } from './home-office-request.service';

describe('HomeOfficeRequestService', () => {
  let service: HomeOfficeRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(HomeOfficeRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});