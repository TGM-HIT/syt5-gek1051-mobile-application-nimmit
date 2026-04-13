import { TestBed } from '@angular/core/testing';

import { DefaultList } from './default-list';
import { vi } from 'vitest';

const localStorageMock = {
  getItem: vi.fn((key: string) => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

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
