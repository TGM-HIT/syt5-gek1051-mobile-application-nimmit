import { TestBed } from '@angular/core/testing';

import { ListGuard } from './list-guard';
import { ShoppingListDataService } from './shopping-list-data.service';
import { PowerSyncService } from './powersync';
import { Router } from '@angular/router';

describe('ListGuard', () => {
  let service: ListGuard;

  beforeEach(() => {
    
    // Mock for localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem(key: string) {
          return store[key] || null;
        },
        setItem(key: string, value: string) {
          store[key] = value;
        },
        removeItem(key: string) {
          delete store[key];
        },
        clear() {
          store = {};
        }
      };
    })();

    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
    });
    
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ShoppingListDataService,
          useValue: { listExists: () => true }
        },
        {
          provide: PowerSyncService,
          useValue: { status$: { subscribe: () => { /* mock */ } } }
        },
        {
          provide: Router,
          useValue: { createUrlTree: () => { /* mock */ } }
        }
      ]
    });
    service = TestBed.inject(ListGuard);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
