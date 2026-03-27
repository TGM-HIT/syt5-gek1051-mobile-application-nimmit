import { TestBed } from '@angular/core/testing';

import { OfflineCheckGuard } from './offline-check-guard';

describe('OfflineCheckGuard', () => {
  let service: OfflineCheckGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OfflineCheckGuard);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
