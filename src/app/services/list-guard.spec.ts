import { TestBed } from '@angular/core/testing';

import { ListGuard } from './list-guard';
import { ShoppingListDataService } from './shopping-list-data.service';
import { PowerSyncService } from './powersync';
import { Router } from '@angular/router';

describe('ListGuard', () => {
  let service: ListGuard;

  beforeEach(() => {
    
    // Mock for localStorage
    const localStorageMock = (function () {
      let store: { [key: string]: string } = {};
      return {
        getItem: function (key: string) {
          return store[key] || null;
        },
        setItem: function (key: string, value: string) {
          store[key] = value.toString();
        },
        removeItem: function (key: string) {
          delete store[key];
        },
        clear: function () {
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
          useValue: { status$: { subscribe: () => {} } }
        },
        {
          provide: Router,
          useValue: { createUrlTree: () => {} }
        }
      ]
    });
    service = TestBed.inject(ListGuard);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
