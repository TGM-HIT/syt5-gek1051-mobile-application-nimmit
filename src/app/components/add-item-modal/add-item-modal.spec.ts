import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddItemModal, AddItemData, AddItemResult } from './add-item-modal';
import { ModalService } from '../../services/modal.service';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

describe('AddItemModal', () => {
  let component: AddItemModal;
  let fixture: ComponentFixture<AddItemModal>;
  let mockModalService: { dismiss: Mock, close: Mock };

  beforeEach(async () => {
    mockModalService = {
      dismiss: vi.fn(),
      close: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AddItemModal],
      providers: [
        { provide: ModalService, useValue: mockModalService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddItemModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state (add mode)', () => {
    it('should have empty name', () => {
      expect(component.name()).toBe('');
    });

    it('should have default category "Sonstiges"', () => {
      expect(component.category()).toBe('Sonstiges');
    });

    it('should have quantity of 1', () => {
      expect(component.quantity()).toBe(1);
    });

    it('should have empty info', () => {
      expect(component.info()).toBe('');
    });

    it('should not be in edit mode', () => {
      expect(component.isEditMode()).toBe(false);
    });

    it('should have predefined categories', () => {
      expect(component.categories.length).toBeGreaterThan(0);
      expect(component.categories).toContain('Getränke');
      expect(component.categories).toContain('Obst & Gemüse');
      expect(component.categories).toContain('Sonstiges');
    });
  });

  describe('edit mode', () => {
    it('should populate form from editItem data', () => {
      // Create new fixture with edit data
      const editFixture = TestBed.createComponent(AddItemModal);
      const editComponent = editFixture.componentInstance;
      
      // Manually set the input and call ngOnInit
      (editComponent as any).data = () => ({
        editItem: {
          id: 'test-id',
          name: 'Milch',
          category: 'Milchprodukte',
          totalQuantity: 3,
          purchasedQuantity: 0,
          info: 'Bio',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as AddItemData);
      
      editComponent.ngOnInit();
      editFixture.detectChanges();

      expect(editComponent.isEditMode()).toBe(true);
      expect(editComponent.name()).toBe('Milch');
      expect(editComponent.category()).toBe('Milchprodukte');
      expect(editComponent.quantity()).toBe(3);
      expect(editComponent.info()).toBe('Bio');
    });
  });

  describe('incrementQuantity()', () => {
    it('should increase quantity by 1', () => {
      expect(component.quantity()).toBe(1);
      
      component.incrementQuantity();
      
      expect(component.quantity()).toBe(2);
    });

    it('should increase multiple times', () => {
      component.incrementQuantity();
      component.incrementQuantity();
      component.incrementQuantity();
      
      expect(component.quantity()).toBe(4);
    });
  });

  describe('decrementQuantity()', () => {
    it('should decrease quantity by 1', () => {
      component.incrementQuantity(); // Now 2
      
      component.decrementQuantity();
      
      expect(component.quantity()).toBe(1);
    });

    it('should not go below 1', () => {
      expect(component.quantity()).toBe(1);
      
      component.decrementQuantity();
      
      expect(component.quantity()).toBe(1);
    });

    it('should stop at 1 when decrementing multiple times', () => {
      component.incrementQuantity(); // 2
      component.incrementQuantity(); // 3
      
      component.decrementQuantity(); // 2
      component.decrementQuantity(); // 1
      component.decrementQuantity(); // Still 1
      component.decrementQuantity(); // Still 1
      
      expect(component.quantity()).toBe(1);
    });
  });

  describe('close()', () => {
    it('should call modalService.dismiss()', () => {
      component.close();
      
      expect(mockModalService.dismiss).toHaveBeenCalled();
    });
  });

  describe('submit()', () => {
    it('should not submit when name is empty', () => {
      component.name.set('');
      
      component.submit();
      
      expect(mockModalService.close).not.toHaveBeenCalled();
    });

    it('should not submit when name is only whitespace', () => {
      component.name.set('   ');
      
      component.submit();
      
      expect(mockModalService.close).not.toHaveBeenCalled();
    });

    it('should call modalService.close with result when valid', () => {
      component.name.set('Milch');
      component.category.set('Milchprodukte');
      component.quantity.set(2);
      
      component.submit();
      
      expect(mockModalService.close).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Milch',
        category: 'Milchprodukte',
        quantity: 2
      }));
    });

    it('should trim name before submitting', () => {
      component.name.set('  Milch  ');
      
      component.submit();
      
      expect(mockModalService.close).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Milch'
      }));
    });

    it('should include info when provided', () => {
      component.name.set('Milch');
      component.info.set('Bio');
      
      component.submit();
      
      expect(mockModalService.close).toHaveBeenCalledWith(expect.objectContaining({
        info: 'Bio'
      }));
    });

    it('should set info to undefined when empty', () => {
      component.name.set('Milch');
      component.info.set('');
      
      component.submit();
      
      const callArg = mockModalService.close.mock.calls[0][0] as AddItemResult;
      expect(callArg.info).toBeUndefined();
    });
  });

  describe('icons', () => {
    it('should have required icons defined', () => {
      expect(component.icons.X).toBeDefined();
      expect(component.icons.Plus).toBeDefined();
      expect(component.icons.Minus).toBeDefined();
    });
  });
});
