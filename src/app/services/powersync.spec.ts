import { TestBed } from '@angular/core/testing';

import { PowerSyncService } from './powersync';

describe('Powersync', () => {
  let service: PowerSyncService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PowerSyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
