import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TimeEntryService } from './time-entry.service';

describe('TimeEntryService', () => {
  let service: TimeEntryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(TimeEntryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});