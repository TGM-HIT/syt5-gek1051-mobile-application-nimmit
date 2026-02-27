import { TestBed } from '@angular/core/testing';
import { ModalService, ModalConfig } from './modal.service';
import { Component } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Component für Tests
@Component({ selector: 'app-mock', template: '', standalone: true })
class MockComponent {}

describe('ModalService', () => {
  let service: ModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have isOpen as false initially', () => {
      expect(service.isOpen()).toBe(false);
    });

    it('should have config as null initially', () => {
      expect(service.config()).toBeNull();
    });

    it('should have hasModal as false initially', () => {
      expect(service.hasModal()).toBe(false);
    });
  });

  describe('open()', () => {
    it('should open modal and set isOpen to true', () => {
      const config: ModalConfig = { component: MockComponent };
      service.open(config);
      
      expect(service.isOpen()).toBe(true);
    });

    it('should set config when opening modal', () => {
      const config: ModalConfig = { component: MockComponent };
      service.open(config);
      
      expect(service.config()).toBeTruthy();
      expect(service.config()?.component).toBe(MockComponent);
    });

    it('should set hasModal to true when opened', () => {
      const config: ModalConfig = { component: MockComponent };
      service.open(config);
      
      expect(service.hasModal()).toBe(true);
    });

    it('should return a promise', () => {
      const config: ModalConfig = { component: MockComponent };
      const result = service.open(config);
      
      expect(result).toBeInstanceOf(Promise);
    });

    it('should set default closeOnBackdropClick to true', () => {
      const config: ModalConfig = { component: MockComponent };
      service.open(config);
      
      expect(service.config()?.closeOnBackdropClick).toBe(true);
    });

    it('should set default closeOnEscape to true', () => {
      const config: ModalConfig = { component: MockComponent };
      service.open(config);
      
      expect(service.config()?.closeOnEscape).toBe(true);
    });

    it('should allow overriding closeOnBackdropClick', () => {
      const config: ModalConfig = { component: MockComponent, closeOnBackdropClick: false };
      service.open(config);
      
      expect(service.config()?.closeOnBackdropClick).toBe(false);
    });
  });

  describe('close()', () => {
    it('should set isOpen to false', async () => {
      const config: ModalConfig = { component: MockComponent };
      service.open(config);
      service.close();
      
      expect(service.isOpen()).toBe(false);
    });

    it('should resolve promise with result', async () => {
      const config: ModalConfig = { component: MockComponent };
      const promise = service.open<unknown, string>(config);
      
      service.close('test-result');
      
      const result = await promise;
      expect(result).toBe('test-result');
    });
  });

  describe('dismiss()', () => {
    it('should set isOpen to false', () => {
      const config: ModalConfig = { component: MockComponent };
      service.open(config);
      service.dismiss();
      
      expect(service.isOpen()).toBe(false);
    });

    it('should resolve promise with undefined', async () => {
      const config: ModalConfig = { component: MockComponent };
      const promise = service.open(config);
      
      service.dismiss();
      
      const result = await promise;
      expect(result).toBeUndefined();
    });
  });

  describe('onBackdropClick()', () => {
    it('should dismiss when closeOnBackdropClick is true', () => {
      const config: ModalConfig = { component: MockComponent, closeOnBackdropClick: true };
      service.open(config);
      
      service.onBackdropClick();
      
      expect(service.isOpen()).toBe(false);
    });

    it('should not dismiss when closeOnBackdropClick is false', () => {
      const config: ModalConfig = { component: MockComponent, closeOnBackdropClick: false };
      service.open(config);
      
      service.onBackdropClick();
      
      expect(service.isOpen()).toBe(true);
    });
  });

  describe('onEscapeKey()', () => {
    it('should dismiss when closeOnEscape is true', () => {
      const config: ModalConfig = { component: MockComponent, closeOnEscape: true };
      service.open(config);
      
      service.onEscapeKey();
      
      expect(service.isOpen()).toBe(false);
    });

    it('should not dismiss when closeOnEscape is false', () => {
      const config: ModalConfig = { component: MockComponent, closeOnEscape: false };
      service.open(config);
      
      service.onEscapeKey();
      
      expect(service.isOpen()).toBe(true);
    });
  });
});
