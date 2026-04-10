import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShoppingListDataService } from './shopping-list-data.service';
import { PowerSyncService, USER_ID_PLACEHOLDER } from './powersync';

describe('ShoppingListDataService', () => {
  let service: ShoppingListDataService;
  let mockPowerSync: any;

  beforeEach(() => {
    mockPowerSync = {
      execute: vi.fn(),
      get: vi.fn(),
      db: {
        watch: vi.fn(),
        getAll: vi.fn()
      }
    };

    TestBed.configureTestingModule({
      providers: [
        ShoppingListDataService,
        { provide: PowerSyncService, useValue: mockPowerSync }
      ]
    });

    service = TestBed.inject(ShoppingListDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getLatestListIdForUser()', () => {
    it('should return list id if found', async () => {
      mockPowerSync.execute.mockResolvedValue({ rows: [{ id: 42n }] });
      const id = await service.getLatestListIdForUser('user-1');
      expect(id).toBe(42n);
      expect(mockPowerSync.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT l.id'),
        ['user-1']
      );
    });

    it('should use USER_ID_PLACEHOLDER if no userId provided', async () => {
      mockPowerSync.execute.mockResolvedValue({ rows: [] });
      const id = await service.getLatestListIdForUser(null);
      expect(id).toBeNull();
      expect(mockPowerSync.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT l.id'),
        [USER_ID_PLACEHOLDER]
      );
    });
  });

  describe('listExists()', () => {
    it('should return true if list exists', async () => {
      mockPowerSync.get.mockResolvedValue({ exists: 1 });
      const exists = await service.listExists(10n);
      expect(exists).toBe(true);
      expect(mockPowerSync.get).toHaveBeenCalledWith(
        expect.stringContaining('SELECT 1 as "exists"'),
        ['10', USER_ID_PLACEHOLDER]
      );
    });

    it('should return false if list does not exist', async () => {
      mockPowerSync.get.mockResolvedValue({ exists: 0 });
      const exists = await service.listExists(100n);
      expect(exists).toBe(false);
    });
  });

  describe('updateListInfo()', () => {
    it('should execute update sql for lists', async () => {
      mockPowerSync.execute.mockResolvedValue({});
      await service.updateListInfo(10n, 'New Name', 'New Desc');
      expect(mockPowerSync.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE "Lists"'),
        ['New Name', 'New Desc', '10']
      );
    });
  });

  describe('deleteList()', () => {
    it('should execute delete for ListItem, UserLists, and Lists tables', async () => {
      mockPowerSync.execute.mockResolvedValue({});
      await service.deleteList(5n);
      expect(mockPowerSync.execute).toHaveBeenCalledTimes(3);
      expect(mockPowerSync.execute).toHaveBeenNthCalledWith(1, expect.stringContaining('DELETE FROM "ListItem"'), ['5']);
      expect(mockPowerSync.execute).toHaveBeenNthCalledWith(2, expect.stringContaining('DELETE FROM "UserLists"'), ['5']);
      expect(mockPowerSync.execute).toHaveBeenNthCalledWith(3, expect.stringContaining('DELETE FROM "Lists"'), ['5']);
    });
  });

  describe('setPurchasedQuantity()', () => {
    it('should execute update on ListItem for curr_amount', async () => {
      mockPowerSync.execute.mockResolvedValue({});
      await service.setPurchasedQuantity('item-123', 5);
      expect(mockPowerSync.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE "ListItem"'),
        [5, 'item-123']
      );
    });
  });

  describe('deleteListItem()', () => {
    it('should execute delete on ListItem for specific id', async () => {
      mockPowerSync.execute.mockResolvedValue({});
      await service.deleteListItem('item-123');
      expect(mockPowerSync.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM "ListItem" WHERE id = ?'),
        ['item-123']
      );
    });
  });

  describe('getCategories()', () => {
    it('should retrieve categories from database', async () => {
      const mockResult = [{ id: 1, name: 'Food', created_at: 'now' }];
      mockPowerSync.db.getAll.mockResolvedValue(mockResult);
      
      const res = await service.getCategories();
      expect(res).toEqual(mockResult);
      expect(mockPowerSync.db.getAll).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, name, created_at FROM "Category"')
      );
    });
  });
});
