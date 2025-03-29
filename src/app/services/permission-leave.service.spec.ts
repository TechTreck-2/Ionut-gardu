import { TestBed } from '@angular/core/testing';

import { PermissionLeaveService } from './permission-leave.service';

describe('PermissionLeaveService', () => {
  let service: PermissionLeaveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PermissionLeaveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
