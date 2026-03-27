import { TestBed } from '@angular/core/testing';

import { PowerSyncService } from './powersync';

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

Object.defineProperty(globalThis.navigator, 'locks', {
  value: {
    request: vi.fn(() => Promise.resolve()),
    query: vi.fn(() => Promise.resolve())
  },
  configurable: true
});

describe('Powersync', () => {
  let service: PowerSyncService;

  beforeEach(() => {
    globalThis.Worker = class {
      addEventListener() { /* mock */ }
      removeEventListener() { /* mock */ }
      postMessage() { /* mock */ }
      terminate() { /* mock */ }
    } as any;
    TestBed.configureTestingModule({});
    service = TestBed.inject(PowerSyncService);
  });

  it('should be created', () => {
    console.log('localStorage in test:', typeof localStorage, localStorage);
    expect(service).toBeTruthy();
  });
});
console.log('localStorage in powersync.spec.ts:', typeof localStorage, localStorage);

