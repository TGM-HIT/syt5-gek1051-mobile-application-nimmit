import { TestBed } from '@angular/core/testing';

import { DefaultList } from './default-list';

describe('DefaultList', () => {
  let service: DefaultList;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DefaultList);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
