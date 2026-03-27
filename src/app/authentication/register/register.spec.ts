import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

import { Register } from './register';
import { SupabaseConnector } from '../../services/supabase-connector';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let mockSupabaseConnector: { register: Mock };

  beforeEach(async () => {
    mockSupabaseConnector = { register: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideRouter([]),
        { provide: SupabaseConnector, useValue: mockSupabaseConnector }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have empty form fields', () => {
      expect(component.registerForm.value.email).toBe('');
      expect(component.registerForm.value.username).toBe('');
      expect(component.registerForm.value.password).toBe('');
      expect(component.registerForm.value.confirmPassword).toBe('');
    });

    it('should not be submitting', () => {
      expect(component.isSubmitting()).toBe(false);
    });

    it('should have no submit error', () => {
      expect(component.submitError()).toBeNull();
    });

    it('should not have succeeded', () => {
      expect(component.registrationSucceeded()).toBe(false);
    });

    it('should have redirect countdown at 5', () => {
      expect(component.redirectCountdown()).toBe(5);
    });
  });

  describe('form validation', () => {
    it('should be invalid when empty', () => {
      expect(component.registerForm.invalid).toBe(true);
    });

    it('should be invalid with invalid email', () => {
      component.registerForm.controls.email.setValue('not-an-email');
      component.registerForm.controls.username.setValue('user123');
      component.registerForm.controls.password.setValue('validpassword');
      component.registerForm.controls.confirmPassword.setValue('validpassword');
      expect(component.registerForm.invalid).toBe(true);
    });

    it('should be invalid when username is too short', () => {
      component.registerForm.controls.email.setValue('test@example.com');
      component.registerForm.controls.username.setValue('ab');
      component.registerForm.controls.password.setValue('validpassword');
      component.registerForm.controls.confirmPassword.setValue('validpassword');
      expect(component.registerForm.invalid).toBe(true);
    });

    it('should be invalid when password is too short', () => {
      component.registerForm.controls.email.setValue('test@example.com');
      component.registerForm.controls.username.setValue('user123');
      component.registerForm.controls.password.setValue('short');
      component.registerForm.controls.confirmPassword.setValue('short');
      expect(component.registerForm.invalid).toBe(true);
    });

    it('should be valid when all fields are correct', () => {
      component.registerForm.controls.email.setValue('test@example.com');
      component.registerForm.controls.username.setValue('user123');
      component.registerForm.controls.password.setValue('validpassword');
      component.registerForm.controls.confirmPassword.setValue('validpassword');
      expect(component.registerForm.valid).toBe(true);
    });
  });

  describe('passwordsMatch', () => {
    it('should be true when passwords match', () => {
      component.registerForm.controls.password.setValue('samepassword');
      component.registerForm.controls.confirmPassword.setValue('samepassword');
      expect(component.passwordsMatch()).toBe(true);
    });

    it('should be false when passwords differ', () => {
      component.registerForm.controls.password.setValue('password123');
      component.registerForm.controls.confirmPassword.setValue('different');
      expect(component.passwordsMatch()).toBe(false);
    });

    it('should be true when both passwords are empty', () => {
      expect(component.passwordsMatch()).toBe(true);
    });
  });

  describe('isInvalid()', () => {
    it('should return false when control is untouched', () => {
      expect(component.isInvalid('email')).toBe(false);
    });

    it('should return true when control is touched and invalid', () => {
      component.registerForm.controls.email.markAsTouched();
      expect(component.isInvalid('email')).toBe(true);
    });

    it('should return false when control is touched and valid', () => {
      component.registerForm.controls.email.setValue('test@example.com');
      component.registerForm.controls.email.markAsTouched();
      expect(component.isInvalid('email')).toBe(false);
    });
  });

  describe('onSubmit()', () => {
    it('should not call register when form is invalid', async () => {
      await component.onSubmit();
      expect(mockSupabaseConnector.register).not.toHaveBeenCalled();
    });

    it('should mark all controls as touched when form is invalid', async () => {
      await component.onSubmit();
      expect(component.registerForm.controls.email.touched).toBe(true);
      expect(component.registerForm.controls.username.touched).toBe(true);
      expect(component.registerForm.controls.password.touched).toBe(true);
      expect(component.registerForm.controls.confirmPassword.touched).toBe(true);
    });

    it('should not call register when passwords do not match', async () => {
      component.registerForm.controls.email.setValue('test@example.com');
      component.registerForm.controls.username.setValue('user123');
      component.registerForm.controls.password.setValue('validpassword');
      component.registerForm.controls.confirmPassword.setValue('differentpassword');

      await component.onSubmit();

      expect(mockSupabaseConnector.register).not.toHaveBeenCalled();
    });

    it('should set submitError when passwords do not match', async () => {
      component.registerForm.controls.email.setValue('test@example.com');
      component.registerForm.controls.username.setValue('user123');
      component.registerForm.controls.password.setValue('validpassword');
      component.registerForm.controls.confirmPassword.setValue('differentpassword');

      await component.onSubmit();

      expect(component.submitError()).toBe('Die Passwoerter stimmen nicht ueberein.');
    });

    it('should call register with email, username and password', async () => {
      mockSupabaseConnector.register.mockResolvedValue(undefined);
      component.registerForm.controls.email.setValue('test@example.com');
      component.registerForm.controls.username.setValue('user123');
      component.registerForm.controls.password.setValue('validpassword');
      component.registerForm.controls.confirmPassword.setValue('validpassword');

      await component.onSubmit();

      expect(mockSupabaseConnector.register).toHaveBeenCalledWith('test@example.com', 'user123', 'validpassword');
    });

    it('should set registrationSucceeded to true on success', async () => {
      mockSupabaseConnector.register.mockResolvedValue(undefined);
      component.registerForm.controls.email.setValue('test@example.com');
      component.registerForm.controls.username.setValue('user123');
      component.registerForm.controls.password.setValue('validpassword');
      component.registerForm.controls.confirmPassword.setValue('validpassword');

      await component.onSubmit();

      expect(component.registrationSucceeded()).toBe(true);
    });

    it('should reset form on success', async () => {
      mockSupabaseConnector.register.mockResolvedValue(undefined);
      component.registerForm.controls.email.setValue('test@example.com');
      component.registerForm.controls.username.setValue('user123');
      component.registerForm.controls.password.setValue('validpassword');
      component.registerForm.controls.confirmPassword.setValue('validpassword');

      await component.onSubmit();

      expect(component.registerForm.controls.email.value).toBe('');
      expect(component.registerForm.controls.username.value).toBe('');
      expect(component.registerForm.controls.password.value).toBe('');
      expect(component.registerForm.controls.confirmPassword.value).toBe('');
    });

    it('should set submitError on failure', async () => {
      mockSupabaseConnector.register.mockRejectedValue(new Error('Email already in use'));
      component.registerForm.controls.email.setValue('test@example.com');
      component.registerForm.controls.username.setValue('user123');
      component.registerForm.controls.password.setValue('validpassword');
      component.registerForm.controls.confirmPassword.setValue('validpassword');

      await component.onSubmit();

      expect(component.submitError()).toBe('Email already in use');
    });

    it('should set fallback error message when error is not an Error instance', async () => {
      mockSupabaseConnector.register.mockRejectedValue('unknown error');
      component.registerForm.controls.email.setValue('test@example.com');
      component.registerForm.controls.username.setValue('user123');
      component.registerForm.controls.password.setValue('validpassword');
      component.registerForm.controls.confirmPassword.setValue('validpassword');

      await component.onSubmit();

      expect(component.submitError()).toBe('Registrierung fehlgeschlagen. Bitte versuche es erneut.');
    });

    it('should clear previous error before submitting', async () => {
      component.submitError.set('Old error');
      mockSupabaseConnector.register.mockResolvedValue(undefined);
      component.registerForm.controls.email.setValue('test@example.com');
      component.registerForm.controls.username.setValue('user123');
      component.registerForm.controls.password.setValue('validpassword');
      component.registerForm.controls.confirmPassword.setValue('validpassword');

      await component.onSubmit();

      expect(component.submitError()).toBeNull();
    });

    it('should set isSubmitting to false after success', async () => {
      mockSupabaseConnector.register.mockResolvedValue(undefined);
      component.registerForm.controls.email.setValue('test@example.com');
      component.registerForm.controls.username.setValue('user123');
      component.registerForm.controls.password.setValue('validpassword');
      component.registerForm.controls.confirmPassword.setValue('validpassword');

      await component.onSubmit();

      expect(component.isSubmitting()).toBe(false);
    });

    it('should set isSubmitting to false after failure', async () => {
      mockSupabaseConnector.register.mockRejectedValue(new Error('fail'));
      component.registerForm.controls.email.setValue('test@example.com');
      component.registerForm.controls.username.setValue('user123');
      component.registerForm.controls.password.setValue('validpassword');
      component.registerForm.controls.confirmPassword.setValue('validpassword');

      await component.onSubmit();

      expect(component.isSubmitting()).toBe(false);
    });
  });
});
