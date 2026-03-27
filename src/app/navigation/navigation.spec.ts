import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Navigation } from './navigation';
import { ModalService } from '../services/modal.service';
import { RouterModule } from '@angular/router';
import { AddItemModal, AddItemResult } from '../components/add-item-modal/add-item-modal';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { ShoppingListDataService } from '../services';
import { DefaultList } from '../services/default-list';
import { SupabaseConnector } from '../services/supabase-connector';

describe('Navigation', () => {
  let component: Navigation;
  let fixture: ComponentFixture<Navigation>;
  let mockModalService: { open: Mock };
  let mockShoppingListService: { addItem: Mock };

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

    mockModalService = { open: vi.fn() };
    mockShoppingListService = { addItem: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [
        Navigation,
        RouterModule.forRoot([])
      ],
      providers: [
        { provide: ModalService, useValue: mockModalService },
        { provide: ShoppingListDataService, useValue: mockShoppingListService },
        { provide: DefaultList, useValue: { listId$: { subscribe: () => {} }, getDefaultList: () => 1n } },
        { provide: SupabaseConnector, useValue: { session$: { subscribe: () => {} }, profile$: { subscribe: () => {} } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Navigation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

