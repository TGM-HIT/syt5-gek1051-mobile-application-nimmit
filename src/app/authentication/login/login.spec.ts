import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { provideTransloco, translocoConfig, TranslocoService } from '@jsverse/transloco';
import { TranslocoAppLoader } from '../../transloco/transloco-loader';
import { firstValueFrom } from 'rxjs';

import { Login } from './login';
import { SupabaseConnector } from '../../services/supabase-connector';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let mockSupabaseConnector: { login: Mock };

  beforeEach(async () => {
    mockSupabaseConnector = { login: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideTransloco({
          config: translocoConfig({
            availableLangs: ['de', 'en'],
            defaultLang: 'de',
            reRenderOnLangChange: true,
            prodMode: true,
          }),
          loader: TranslocoAppLoader,
        }),
        { provide: SupabaseConnector, useValue: mockSupabaseConnector }
      ]
    }).compileComponents();

    const transloco = TestBed.inject(TranslocoService);
    transloco.setActiveLang('de');
    await firstValueFrom(transloco.load('de'));

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have empty email and password', () => {
      expect(component.loginForm.value.email).toBe('');
      expect(component.loginForm.value.password).toBe('');
    });

    it('should not be submitting', () => {
      expect(component.isSubmitting()).toBe(false);
    });

    it('should have no submit error', () => {
      expect(component.submitError()).toBeNull();
    });

    it('should not have succeeded', () => {
      expect(component.loginSucceeded()).toBe(false);
    });
  });

  describe('form validation', () => {
    it('should be invalid when empty', () => {
      expect(component.loginForm.invalid).toBe(true);
    });

    it('should be invalid with invalid email', () => {
      component.loginForm.controls.email.setValue('not-an-email');
      component.loginForm.controls.password.setValue('password123');
      expect(component.loginForm.invalid).toBe(true);
    });

    it('should be invalid when password is too short', () => {
      component.loginForm.controls.email.setValue('test@example.com');
      component.loginForm.controls.password.setValue('short');
      expect(component.loginForm.invalid).toBe(true);
    });

    it('should be valid with correct email and password', () => {
      component.loginForm.controls.email.setValue('test@example.com');
      component.loginForm.controls.password.setValue('validpassword');
      expect(component.loginForm.valid).toBe(true);
    });
  });

  describe('isInvalid()', () => {
    it('should return false when control is untouched', () => {
      expect(component.isInvalid('email')).toBe(false);
    });

    it('should return true when control is touched and invalid', () => {
      component.loginForm.controls.email.markAsTouched();
      expect(component.isInvalid('email')).toBe(true);
    });

    it('should return false when control is touched and valid', () => {
      component.loginForm.controls.email.setValue('test@example.com');
      component.loginForm.controls.email.markAsTouched();
      expect(component.isInvalid('email')).toBe(false);
    });
  });

  describe('onSubmit()', () => {
    it('should not call login when form is invalid', async () => {
      await component.onSubmit();
      expect(mockSupabaseConnector.login).not.toHaveBeenCalled();
    });

    it('should mark all controls as touched when form is invalid', async () => {
      await component.onSubmit();
      expect(component.loginForm.controls.email.touched).toBe(true);
      expect(component.loginForm.controls.password.touched).toBe(true);
    });

    it('should call SupabaseConnector.login with email and password', async () => {
      mockSupabaseConnector.login.mockResolvedValue(undefined);
      component.loginForm.controls.email.setValue('test@example.com');
      component.loginForm.controls.password.setValue('validpassword');

      await component.onSubmit();

      expect(mockSupabaseConnector.login).toHaveBeenCalledWith('test@example.com', 'validpassword');
    });

    it('should set loginSucceeded to true on success', async () => {
      mockSupabaseConnector.login.mockResolvedValue(undefined);
      component.loginForm.controls.email.setValue('test@example.com');
      component.loginForm.controls.password.setValue('validpassword');

      await component.onSubmit();

      expect(component.loginSucceeded()).toBe(true);
    });

    it('should reset form on success', async () => {
      mockSupabaseConnector.login.mockResolvedValue(undefined);
      component.loginForm.controls.email.setValue('test@example.com');
      component.loginForm.controls.password.setValue('validpassword');

      await component.onSubmit();

      expect(component.loginForm.controls.email.value).toBe('');
      expect(component.loginForm.controls.password.value).toBe('');
    });

    it('should set submitError on failure', async () => {
      mockSupabaseConnector.login.mockRejectedValue(new Error('Invalid credentials'));
      component.loginForm.controls.email.setValue('test@example.com');
      component.loginForm.controls.password.setValue('wrongpassword');

      await component.onSubmit();

      expect(component.submitError()).toBe('Invalid credentials');
    });

    it('should set fallback error message when error is not an Error instance', async () => {
      mockSupabaseConnector.login.mockRejectedValue('unknown error');
      component.loginForm.controls.email.setValue('test@example.com');
      component.loginForm.controls.password.setValue('validpassword');

      await component.onSubmit();

      expect(component.submitError()).toBe('Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
    });

    it('should clear previous error before submitting', async () => {
      component.submitError.set('Old error');
      mockSupabaseConnector.login.mockResolvedValue(undefined);
      component.loginForm.controls.email.setValue('test@example.com');
      component.loginForm.controls.password.setValue('validpassword');

      await component.onSubmit();

      expect(component.submitError()).toBeNull();
    });

    it('should set isSubmitting to false after success', async () => {
      mockSupabaseConnector.login.mockResolvedValue(undefined);
      component.loginForm.controls.email.setValue('test@example.com');
      component.loginForm.controls.password.setValue('validpassword');

      await component.onSubmit();

      expect(component.isSubmitting()).toBe(false);
    });

    it('should set isSubmitting to false after failure', async () => {
      mockSupabaseConnector.login.mockRejectedValue(new Error('fail'));
      component.loginForm.controls.email.setValue('test@example.com');
      component.loginForm.controls.password.setValue('validpassword');

      await component.onSubmit();

      expect(component.isSubmitting()).toBe(false);
    });
  });
});
