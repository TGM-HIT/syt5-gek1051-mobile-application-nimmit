import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalContainer } from './modal-container';
import { ModalService, ModalConfig } from '../../services/modal.service';
import { Component, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

// Mock Component für Tests
@Component({ 
  selector: 'app-test-modal', 
  template: '<div>Test Modal</div>',
  standalone: true
})
class TestModalComponent {}

describe('ModalContainer', () => {
  let component: ModalContainer;
  let fixture: ComponentFixture<ModalContainer>;
  let mockConfig: ReturnType<typeof signal<ModalConfig | null>>;
  let mockModalService: { onEscapeKey: Mock, onBackdropClick: Mock, config: ReturnType<typeof signal>, isOpen: ReturnType<typeof signal>, hasModal: ReturnType<typeof signal> };

  beforeEach(async () => {
    mockConfig = signal<ModalConfig | null>(null);
    const mockIsOpen = signal(false);
    const mockHasModal = signal(false);
    
    mockModalService = {
      onEscapeKey: vi.fn(),
      onBackdropClick: vi.fn(),
      config: mockConfig,
      isOpen: mockIsOpen,
      hasModal: mockHasModal
    };

    await TestBed.configureTestingModule({
      imports: [ModalContainer, TestModalComponent],
      providers: [
        { provide: ModalService, useValue: mockModalService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('componentType', () => {
    it('should return null when no config', () => {
      expect(component.componentType).toBeNull();
    });

    it('should return component from config', () => {
      mockConfig.set({
        component: TestModalComponent
      });
      
      expect(component.componentType).toBe(TestModalComponent);
    });
  });

  describe('componentInputs', () => {
    it('should return empty object when no config', () => {
      expect(component.componentInputs).toEqual({});
    });

    it('should return empty object when config has no data', () => {
      mockConfig.set({
        component: TestModalComponent
      });
      
      expect(component.componentInputs).toEqual({});
    });

    it('should return data wrapped in data property', () => {
      mockConfig.set({
        component: TestModalComponent,
        data: { testKey: 'testValue' }
      });
      
      expect(component.componentInputs).toEqual({ data: { testKey: 'testValue' } });
    });
  });

  describe('onEscapeKey()', () => {
    it('should call modalService.onEscapeKey()', () => {
      component.onEscapeKey();
      
      expect(mockModalService.onEscapeKey).toHaveBeenCalled();
    });
  });

  describe('onBackdropClick()', () => {
    it('should call modalService.onBackdropClick when clicking backdrop', () => {
      const mockElement = document.createElement('div');
      mockElement.classList.add('modal-backdrop');
      
      const event = {
        target: mockElement
      } as unknown as MouseEvent;
      
      component.onBackdropClick(event);
      
      expect(mockModalService.onBackdropClick).toHaveBeenCalled();
    });

    it('should not call modalService.onBackdropClick when clicking content', () => {
      const mockElement = document.createElement('div');
      mockElement.classList.add('modal-content');
      
      const event = {
        target: mockElement
      } as unknown as MouseEvent;
      
      component.onBackdropClick(event);
      
      expect(mockModalService.onBackdropClick).not.toHaveBeenCalled();
    });
  });

  describe('modalService reference', () => {
    it('should have modalService accessible', () => {
      expect(component.modalService).toBeDefined();
    });
  });
});
