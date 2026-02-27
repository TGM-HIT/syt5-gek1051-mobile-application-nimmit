import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Navigation } from './navigation';
import { ModalService } from '../services/modal.service';
import { ShoppingListService } from '../services/shopping-list.service';
import { RouterModule } from '@angular/router';
import { AddItemModal, AddItemResult } from '../components/add-item-modal/add-item-modal';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

describe('Navigation', () => {
  let component: Navigation;
  let fixture: ComponentFixture<Navigation>;
  let mockModalService: { open: Mock };
  let mockShoppingListService: { addItem: Mock };

  beforeEach(async () => {
    mockModalService = { open: vi.fn() };
    mockShoppingListService = { addItem: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [
        Navigation,
        RouterModule.forRoot([])
      ],
      providers: [
        { provide: ModalService, useValue: mockModalService },
        { provide: ShoppingListService, useValue: mockShoppingListService }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(Navigation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('icons', () => {
    it('should have List icon defined', () => {
      expect(component.icons.List).toBeDefined();
    });

    it('should have Users icon defined', () => {
      expect(component.icons.Users).toBeDefined();
    });

    it('should have Settings icon defined', () => {
      expect(component.icons.Settings).toBeDefined();
    });

    it('should have Plus icon defined', () => {
      expect(component.icons.Plus).toBeDefined();
    });
  });

  describe('addNewItem()', () => {
    it('should open AddItemModal', async () => {
      mockModalService.open.mockResolvedValue(undefined);
      
      await component.addNewItem();
      
      expect(mockModalService.open).toHaveBeenCalledWith({
        component: AddItemModal
      });
    });

    it('should add item when modal returns result', async () => {
      const mockResult: AddItemResult = {
        name: 'Milch',
        category: 'Milchprodukte',
        quantity: 2,
        info: 'Bio'
      };
      
      mockModalService.open.mockResolvedValue(mockResult);
      
      await component.addNewItem();
      
      expect(mockShoppingListService.addItem).toHaveBeenCalledWith({
        name: 'Milch',
        category: 'Milchprodukte',
        totalQuantity: 2,
        info: 'Bio'
      });
    });

    it('should not add item when modal is dismissed', async () => {
      mockModalService.open.mockResolvedValue(undefined);
      
      await component.addNewItem();
      
      expect(mockShoppingListService.addItem).not.toHaveBeenCalled();
    });

    it('should not add item when modal returns null', async () => {
      mockModalService.open.mockResolvedValue(null);
      
      await component.addNewItem();
      
      expect(mockShoppingListService.addItem).not.toHaveBeenCalled();
    });

    it('should handle item without info', async () => {
      const mockResult: AddItemResult = {
        name: 'Brot',
        category: 'Backwaren',
        quantity: 1
        // no info
      };
      
      mockModalService.open.mockResolvedValue(mockResult);
      
      await component.addNewItem();
      
      expect(mockShoppingListService.addItem).toHaveBeenCalledWith({
        name: 'Brot',
        category: 'Backwaren',
        totalQuantity: 1,
        info: undefined
      });
    });
  });
});
