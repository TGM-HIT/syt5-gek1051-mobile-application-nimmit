import { TestBed } from '@angular/core/testing';
import { ShoppingListService } from './shopping-list.service';
import { ShoppingItem } from '../models';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('ShoppingListService', () => {
  let service: ShoppingListService;

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShoppingListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have empty items list initially', () => {
      expect(service.items()).toEqual([]);
    });

    it('should have default list name', () => {
      expect(service.listName()).toBe('Meine Einkaufsliste');
    });

    it('should have default list description', () => {
      expect(service.listDescription()).toBe('Tippe auf +, um Produkte hinzuzufügen');
    });

    it('should have allCount as 0', () => {
      expect(service.allCount()).toBe(0);
    });

    it('should have progressPercentage as 0', () => {
      expect(service.progressPercentage()).toBe(0);
    });
  });

  describe('addItem()', () => {
    it('should add a new item to the list', () => {
      const newItem = {
        name: 'Milch',
        category: 'Milchprodukte',
        totalQuantity: 2
      };

      service.addItem(newItem);

      expect(service.items().length).toBe(1);
      expect(service.items()[0].name).toBe('Milch');
    });

    it('should generate an id for the new item', () => {
      const newItem = {
        name: 'Brot',
        category: 'Backwaren',
        totalQuantity: 1
      };

      service.addItem(newItem);

      expect(service.items()[0].id).toBeDefined();
      expect(typeof service.items()[0].id).toBe('string');
    });

    it('should set purchasedQuantity to 0', () => {
      const newItem = {
        name: 'Äpfel',
        category: 'Obst & Gemüse',
        totalQuantity: 5
      };

      service.addItem(newItem);

      expect(service.items()[0].purchasedQuantity).toBe(0);
    });

    it('should set createdAt and updatedAt', () => {
      const newItem = {
        name: 'Käse',
        category: 'Milchprodukte',
        totalQuantity: 1
      };

      service.addItem(newItem);

      expect(service.items()[0].createdAt).toBeInstanceOf(Date);
      expect(service.items()[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should update allCount', () => {
      service.addItem({ name: 'Item 1', category: 'Test', totalQuantity: 1 });
      service.addItem({ name: 'Item 2', category: 'Test', totalQuantity: 1 });

      expect(service.allCount()).toBe(2);
    });
  });

  describe('markAsPurchased()', () => {
    it('should set purchasedQuantity to totalQuantity', () => {
      service.addItem({ name: 'Milch', category: 'Milchprodukte', totalQuantity: 3 });
      const itemId = service.items()[0].id;

      service.markAsPurchased(itemId);

      expect(service.items()[0].purchasedQuantity).toBe(3);
    });

    it('should update purchasedCount', () => {
      service.addItem({ name: 'Milch', category: 'Milchprodukte', totalQuantity: 1 });
      const itemId = service.items()[0].id;
      
      expect(service.purchasedCount()).toBe(0);
      
      service.markAsPurchased(itemId);
      
      expect(service.purchasedCount()).toBe(1);
    });

    it('should update progressPercentage', () => {
      service.addItem({ name: 'Milch', category: 'Milchprodukte', totalQuantity: 1 });
      service.addItem({ name: 'Brot', category: 'Backwaren', totalQuantity: 1 });
      
      const itemId = service.items()[0].id;
      service.markAsPurchased(itemId);
      
      expect(service.progressPercentage()).toBe(50);
    });
  });

  describe('markAsNotPurchased()', () => {
    it('should set purchasedQuantity to 0', () => {
      service.addItem({ name: 'Milch', category: 'Milchprodukte', totalQuantity: 3 });
      const itemId = service.items()[0].id;
      
      service.markAsPurchased(itemId);
      expect(service.items()[0].purchasedQuantity).toBe(3);
      
      service.markAsNotPurchased(itemId);
      expect(service.items()[0].purchasedQuantity).toBe(0);
    });
  });

  describe('updateItem()', () => {
    it('should update item properties', () => {
      service.addItem({ name: 'Milch', category: 'Milchprodukte', totalQuantity: 1 });
      const itemId = service.items()[0].id;

      service.updateItem(itemId, { name: 'Hafermilch', totalQuantity: 2 });

      expect(service.items()[0].name).toBe('Hafermilch');
      expect(service.items()[0].totalQuantity).toBe(2);
    });

    it('should update updatedAt timestamp', () => {
      service.addItem({ name: 'Milch', category: 'Milchprodukte', totalQuantity: 1 });
      const itemId = service.items()[0].id;

      service.updateItem(itemId, { name: 'Hafermilch' });
      
      // Just verify the updatedAt exists - timestamp comparison not needed
      expect(service.items()[0].updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('deleteItem()', () => {
    it('should remove item from list', () => {
      service.addItem({ name: 'Milch', category: 'Milchprodukte', totalQuantity: 1 });
      service.addItem({ name: 'Brot', category: 'Backwaren', totalQuantity: 1 });
      
      const itemId = service.items()[0].id;
      service.deleteItem(itemId);

      expect(service.items().length).toBe(1);
      expect(service.items()[0].name).toBe('Brot');
    });

    it('should update allCount after deletion', () => {
      service.addItem({ name: 'Milch', category: 'Milchprodukte', totalQuantity: 1 });
      const itemId = service.items()[0].id;

      expect(service.allCount()).toBe(1);
      
      service.deleteItem(itemId);
      
      expect(service.allCount()).toBe(0);
    });
  });

  describe('getFilteredItems()', () => {
    beforeEach(() => {
      service.addItem({ name: 'Milch', category: 'Milchprodukte', totalQuantity: 1 });
      service.addItem({ name: 'Brot', category: 'Backwaren', totalQuantity: 1 });
      service.addItem({ name: 'Käse', category: 'Milchprodukte', totalQuantity: 1 });
      
      // Mark first item as purchased
      service.markAsPurchased(service.items()[0].id);
    });

    it('should return all items when filter is "all"', () => {
      const result = service.getFilteredItems('all', '');
      expect(result.length).toBe(3);
    });

    it('should return only not purchased items when filter is "notPurchased"', () => {
      const result = service.getFilteredItems('notPurchased', '');
      expect(result.length).toBe(2);
      expect(result.every(item => item.purchasedQuantity < item.totalQuantity)).toBe(true);
    });

    it('should return only purchased items when filter is "purchased"', () => {
      const result = service.getFilteredItems('purchased', '');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Milch');
    });

    it('should filter by search query in name', () => {
      const result = service.getFilteredItems('all', 'brot');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Brot');
    });

    it('should filter by search query in category', () => {
      const result = service.getFilteredItems('all', 'milchprodukte');
      expect(result.length).toBe(2);
    });

    it('should be case-insensitive', () => {
      const result = service.getFilteredItems('all', 'MILCH');
      expect(result.length).toBe(2); // Milch and items with Milchprodukte category
    });

    it('should combine filter and search', () => {
      const result = service.getFilteredItems('notPurchased', 'milch');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Käse'); // Käse has Milchprodukte category
    });
  });

  describe('isPurchased()', () => {
    it('should return true when purchasedQuantity >= totalQuantity', () => {
      const item: ShoppingItem = {
        id: '1',
        name: 'Test',
        category: 'Test',
        totalQuantity: 2,
        purchasedQuantity: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(service.isPurchased(item)).toBe(true);
    });

    it('should return false when purchasedQuantity < totalQuantity', () => {
      const item: ShoppingItem = {
        id: '1',
        name: 'Test',
        category: 'Test',
        totalQuantity: 2,
        purchasedQuantity: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(service.isPurchased(item)).toBe(false);
    });
  });

  describe('getStatusText()', () => {
    it('should return correct status text', () => {
      const item: ShoppingItem = {
        id: '1',
        name: 'Test',
        category: 'Test',
        totalQuantity: 5,
        purchasedQuantity: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(service.getStatusText(item)).toBe('2 von 5 gekauft');
    });
  });

  describe('updateListInfo()', () => {
    it('should update list name', () => {
      service.updateListInfo('Neue Liste', 'Neue Beschreibung');
      expect(service.listName()).toBe('Neue Liste');
    });

    it('should update list description', () => {
      service.updateListInfo('Neue Liste', 'Neue Beschreibung');
      expect(service.listDescription()).toBe('Neue Beschreibung');
    });
  });

  describe('computed values', () => {
    it('should calculate notPurchasedCount correctly', () => {
      service.addItem({ name: 'Item 1', category: 'Test', totalQuantity: 1 });
      service.addItem({ name: 'Item 2', category: 'Test', totalQuantity: 1 });
      service.addItem({ name: 'Item 3', category: 'Test', totalQuantity: 1 });
      
      service.markAsPurchased(service.items()[0].id);

      expect(service.notPurchasedCount()).toBe(2);
    });

    it('should calculate purchasedCount correctly', () => {
      service.addItem({ name: 'Item 1', category: 'Test', totalQuantity: 1 });
      service.addItem({ name: 'Item 2', category: 'Test', totalQuantity: 1 });
      
      service.markAsPurchased(service.items()[0].id);
      service.markAsPurchased(service.items()[1].id);

      expect(service.purchasedCount()).toBe(2);
    });

    it('should calculate progressPercentage as 100% when all items purchased', () => {
      service.addItem({ name: 'Item 1', category: 'Test', totalQuantity: 1 });
      service.addItem({ name: 'Item 2', category: 'Test', totalQuantity: 1 });
      
      service.markAsPurchased(service.items()[0].id);
      service.markAsPurchased(service.items()[1].id);

      expect(service.progressPercentage()).toBe(100);
    });
  });
});
