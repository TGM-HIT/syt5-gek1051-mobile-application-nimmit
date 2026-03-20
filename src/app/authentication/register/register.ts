import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);

  private redirectTimeoutId: number | null = null;
  private redirectIntervalId: number | null = null;

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly registrationSucceeded = signal(false);
  readonly redirectCountdown = signal(5);

  readonly registerForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  passwordsMatch(): boolean {
    return (
      this.registerForm.controls.password.value ===
      this.registerForm.controls.confirmPassword.value
    );
  }

  async onSubmit(): Promise<void> {
    this.clearRedirectTimers();
    this.submitError.set(null);
    this.registrationSucceeded.set(false);
    this.redirectCountdown.set(5);

    if (this.registerForm.invalid || !this.passwordsMatch()) {
      this.registerForm.markAllAsTouched();
      if (!this.passwordsMatch()) {
        this.submitError.set('Die Passwoerter stimmen nicht ueberein.');
      }
      return;
    }

    this.isSubmitting.set(true);

    try {
      const { email, username, password } = this.registerForm.getRawValue();
      await this.supabaseService.register(email, username, password);
      this.registrationSucceeded.set(true);
      this.registerForm.reset();
      this.startRedirectCountdown();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Registrierung fehlgeschlagen. Bitte versuche es erneut.';
      this.submitError.set(message);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  isInvalid(controlName: keyof typeof this.registerForm.controls): boolean {
    const control = this.registerForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private startRedirectCountdown(): void {
    this.redirectIntervalId = window.setInterval(() => {
      const next = this.redirectCountdown() - 1;
      if (next >= 0) {
        this.redirectCountdown.set(next);
      }
    }, 1000);

    this.redirectTimeoutId = window.setTimeout(() => {
      this.clearRedirectTimers();
      this.router.navigateByUrl('/');
    }, 5000);
  }

  private clearRedirectTimers(): void {
    if (this.redirectIntervalId !== null) {
      window.clearInterval(this.redirectIntervalId);
      this.redirectIntervalId = null;
    }

    if (this.redirectTimeoutId !== null) {
      window.clearTimeout(this.redirectTimeoutId);
      this.redirectTimeoutId = null;
    }
  }

  ngOnDestroy(): void {
    this.clearRedirectTimers();
  }
}
