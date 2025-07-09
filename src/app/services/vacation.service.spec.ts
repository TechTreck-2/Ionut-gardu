import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { VacationService } from './vacation.service';

describe('VacationService', () => {
  let service: VacationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(VacationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
