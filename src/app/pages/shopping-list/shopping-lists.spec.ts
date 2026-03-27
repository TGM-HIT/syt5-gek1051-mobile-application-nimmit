import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ShoppingLists } from './shopping-lists';
import { SupabaseConnector } from '../../services/supabase-connector';
import { PowerSyncService } from '../../services/powersync';
import { of } from 'rxjs';

describe('ShoppingLists', () => {
  let component: ShoppingLists;
  let fixture: ComponentFixture<ShoppingLists>;

  beforeEach(async () => {
    // Mock for localStorage
    const localStorageMock = (function () {
      let store: { [key: string]: string } = {};
      return {
        getItem: function (key: string) { return store[key] || null; },
        setItem: function (key: string, value: string) { store[key] = value.toString(); },
        removeItem: function (key: string) { delete store[key]; },
        clear: function () { store = {}; }
      };
    })();

    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
    });

    await TestBed.configureTestingModule({
      imports: [ShoppingLists],
      providers: [
        provideRouter([]),
        { provide: SupabaseConnector, useValue: { session$: of(null), profile$: of(null) } },
        { provide: PowerSyncService, useValue: { status$: of(null), ready$: of(false) } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShoppingLists);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

