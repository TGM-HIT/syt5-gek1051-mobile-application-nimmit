import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { Theme } from '../types';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

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

// Mock matchMedia
Object.defineProperty(globalThis, 'matchMedia', {
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
  writable: true,
});

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have a theme value', () => {
      expect(['light', 'dark', 'system']).toContain(service.theme());
    });

    it('should have isDarkMode as boolean', () => {
      expect(typeof service.isDarkMode()).toBe('boolean');
    });
  });

  describe('setTheme()', () => {
    it('should set theme to light', () => {
      service.setTheme('light');
      expect(service.theme()).toBe('light');
    });

    it('should set theme to dark', () => {
      service.setTheme('dark');
      expect(service.theme()).toBe('dark');
    });

    it('should set theme to system', () => {
      service.setTheme('light'); // First set to something else
      service.setTheme('system');
      expect(service.theme()).toBe('system');
    });

    it('should update isDarkMode when setting dark theme', async () => {
      service.setTheme('dark');
      // Wait for effect to run
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(service.isDarkMode()).toBe(true);
    });

    it('should update isDarkMode when setting light theme', () => {
      service.setTheme('light');
      expect(service.isDarkMode()).toBe(false);
    });
  });

  describe('toggleTheme()', () => {
    it('should toggle from light to dark', () => {
      service.setTheme('light');
      service.toggleTheme();
      expect(service.theme()).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      service.setTheme('dark');
      service.toggleTheme();
      expect(service.theme()).toBe('light');
    });

    it('should toggle from system based on current mode', () => {
      service.setTheme('system');
      const wasDark = service.isDarkMode();
      service.toggleTheme();
      
      // Should switch to the opposite of what was active
      expect(service.theme()).toBe(wasDark ? 'light' : 'dark');
    });
  });

  describe('cycleTheme()', () => {
    it('should cycle from light to dark', () => {
      service.setTheme('light');
      service.cycleTheme();
      expect(service.theme()).toBe('dark');
    });

    it('should cycle from dark to system', () => {
      service.setTheme('dark');
      service.cycleTheme();
      expect(service.theme()).toBe('system');
    });

    it('should cycle from system to light', () => {
      service.setTheme('system');
      service.cycleTheme();
      expect(service.theme()).toBe('light');
    });

    it('should complete full cycle', () => {
      service.setTheme('light');
      
      service.cycleTheme();
      expect(service.theme()).toBe('dark');
      
      service.cycleTheme();
      expect(service.theme()).toBe('system');
      
      service.cycleTheme();
      expect(service.theme()).toBe('light');
    });
  });
});
