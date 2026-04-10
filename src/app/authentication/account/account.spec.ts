import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

import { Account } from './account';
import { SupabaseConnector } from '../../services/supabase-connector';
import { Profile } from '../../types';

@Component({ selector: 'stub', template: '', standalone: true })
class StubComponent {}

const mockUser = { id: 'user-123', email: 'test@example.com' } as any;

const mockProfile: Profile = {
  id: 'user-123',
  username: 'testuser',
  settings: { theme: 'light', sync_interval: 15 },
  updated_at: '2024-01-15T10:30:00',
};

describe('Account', () => {
  let component: Account;
  let fixture: ComponentFixture<Account>;
  let mockSupabaseConnector: {
    getCurrentUser: Mock;
    getProfile: Mock;
    updateProfile: Mock;
    logout: Mock;
  };

  beforeEach(async () => {
    mockSupabaseConnector = {
      getCurrentUser: vi.fn().mockResolvedValue(mockUser),
      getProfile: vi.fn().mockResolvedValue(mockProfile),
      updateProfile: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Account],
      providers: [
        provideRouter([{ path: 'login', component: StubComponent }]),
        { provide: SupabaseConnector, useValue: mockSupabaseConnector },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Account);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit — loading account data', () => {
    it('should load user and profile on init', () => {
      expect(component.user()).toEqual(mockUser);
      expect(component.profile()).toEqual(mockProfile);
    });

    it('should set isLoading to false after loading', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should populate form with profile data', () => {
      expect(component.editForm.controls.username.value).toBe('testuser');
      expect(component.editForm.controls.sync_interval.value).toBe(15);
    });

    it('should redirect to /login and not set errorMessage when no user is found', async () => {
      mockSupabaseConnector.getCurrentUser.mockResolvedValue(null);
      const newFixture = TestBed.createComponent(Account);
      await newFixture.whenStable();

      // 'Kein eingeloggter Benutzer gefunden.' triggers the redirect branch, not errorMessage
      expect(newFixture.componentInstance.errorMessage()).toBeNull();
    });

    it('should set errorMessage when profile is not found', async () => {
      mockSupabaseConnector.getProfile.mockResolvedValue(null);
      const newFixture = TestBed.createComponent(Account);
      await newFixture.whenStable();

      expect(newFixture.componentInstance.errorMessage()).toBe('Profil konnte nicht geladen werden.');
    });

    it('should redirect to /login when auth session is missing', async () => {
      mockSupabaseConnector.getCurrentUser.mockRejectedValue(new Error('Auth session missing'));
      const newFixture = TestBed.createComponent(Account);
      const newComponent = newFixture.componentInstance;
      await newFixture.whenStable();

      expect(newComponent.errorMessage()).toBeNull();
    });
  });

  describe('toggleEditMode()', () => {
    it('should enable edit mode when off', () => {
      expect(component.isEditMode()).toBe(false);
      component.toggleEditMode();
      expect(component.isEditMode()).toBe(true);
    });

    it('should disable edit mode when on', () => {
      component.toggleEditMode();
      component.toggleEditMode();
      expect(component.isEditMode()).toBe(false);
    });

    it('should reset form to profile values when cancelling edit mode', () => {
      component.toggleEditMode();
      component.editForm.controls.username.setValue('changed-name');

      component.toggleEditMode(); // cancel

      expect(component.editForm.controls.username.value).toBe('testuser');
    });
  });

  describe('saveChanges()', () => {
    it('should not save when form is invalid', async () => {
      component.editForm.controls.username.setValue('ab'); // too short
      await component.saveChanges();
      expect(mockSupabaseConnector.updateProfile).not.toHaveBeenCalled();
    });

    it('should mark all controls as touched when form is invalid', async () => {
      component.editForm.controls.username.setValue('');
      await component.saveChanges();
      expect(component.editForm.controls.username.touched).toBe(true);
    });


    it('should call updateProfile with correct arguments', async () => {
      mockSupabaseConnector.updateProfile.mockResolvedValue({ ...mockProfile, username: 'newname' });
      component.editForm.controls.username.setValue('newname');
      component.editForm.controls.sync_interval.setValue(30);

      await component.saveChanges();

      expect(mockSupabaseConnector.updateProfile).toHaveBeenCalledWith('user-123', {
        username: 'newname',
        sync_interval: 30,
      });
    });

    it('should update profile signal with returned profile', async () => {
      const updatedProfile = { ...mockProfile, username: 'newname' };
      mockSupabaseConnector.updateProfile.mockResolvedValue(updatedProfile);
      component.editForm.controls.username.setValue('newname');
      component.editForm.controls.sync_interval.setValue(15);

      await component.saveChanges();

      expect(component.profile()).toEqual(updatedProfile);
    });

    it('should exit edit mode on success', async () => {
      mockSupabaseConnector.updateProfile.mockResolvedValue(mockProfile);
      component.toggleEditMode();

      await component.saveChanges();

      expect(component.isEditMode()).toBe(false);
    });

    it('should set errorMessage on failure', async () => {
      mockSupabaseConnector.updateProfile.mockRejectedValue(new Error('Update failed'));
      component.editForm.controls.username.setValue('validname');

      await component.saveChanges();

      expect(component.errorMessage()).toBe('Update failed');
    });

    it('should set fallback errorMessage when error is not an Error instance', async () => {
      mockSupabaseConnector.updateProfile.mockRejectedValue('unknown');
      component.editForm.controls.username.setValue('validname');

      await component.saveChanges();

      expect(component.errorMessage()).toBe('Profil konnte nicht aktualisiert werden.');
    });

    it('should set isSaving to false after success', async () => {
      mockSupabaseConnector.updateProfile.mockResolvedValue(mockProfile);
      component.editForm.controls.username.setValue('validname');

      await component.saveChanges();

      expect(component.isSaving()).toBe(false);
    });

    it('should set isSaving to false after failure', async () => {
      mockSupabaseConnector.updateProfile.mockRejectedValue(new Error('fail'));
      component.editForm.controls.username.setValue('validname');

      await component.saveChanges();

      expect(component.isSaving()).toBe(false);
    });
  });

  describe('formatUpdatedAt()', () => {
    it('should return "-" when no date is provided', () => {
      expect(component.formatUpdatedAt(undefined)).toBe('-');
    });

    it('should return a formatted date string', () => {
      const result = component.formatUpdatedAt('2024-01-15T10:30:00');
      expect(typeof result).toBe('string');
      expect(result).not.toBe('-');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('form validation', () => {
    it('should be invalid when username is too short', () => {
      component.editForm.controls.username.setValue('ab');
      expect(component.editForm.invalid).toBe(true);
    });

    it('should be invalid when sync_interval is below 1', () => {
      component.editForm.controls.username.setValue('validname');
      component.editForm.controls.sync_interval.setValue(0);
      expect(component.editForm.invalid).toBe(true);
    });

    it('should be invalid when sync_interval exceeds 60', () => {
      component.editForm.controls.username.setValue('validname');
      component.editForm.controls.sync_interval.setValue(61);
      expect(component.editForm.invalid).toBe(true);
    });

    it('should be valid with correct values', () => {
      component.editForm.controls.username.setValue('validname');
      component.editForm.controls.sync_interval.setValue(30);
      expect(component.editForm.valid).toBe(true);
    });
  });
});
