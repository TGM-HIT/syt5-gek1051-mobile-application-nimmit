import { TestBed } from '@angular/core/testing';

import { SupabaseConnector } from './supabase-connector';

describe('Supabase', () => {
  let service: SupabaseConnector;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SupabaseConnector);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
