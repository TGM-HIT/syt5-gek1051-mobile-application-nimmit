import { Component, OnDestroy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseConnector } from '../../services/supabase-connector';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly supabaseService = inject(SupabaseConnector);
  private readonly router = inject(Router);

  private redirectTimeoutId: number | null = null;

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly loginSucceeded = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  async onSubmit(): Promise<void> {
    this.submitError.set(null);
    this.loginSucceeded.set(false);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const { email, password } = this.loginForm.getRawValue();
      await this.supabaseService.login(email, password);
      this.loginSucceeded.set(true);
      this.loginForm.reset();
      this.redirectTimeoutId = window.setTimeout(() => {
        this.router.navigateByUrl('/account');
      }, 1500);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.';
      this.submitError.set(message);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  isInvalid(controlName: keyof typeof this.loginForm.controls): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && control.touched;
  }

  ngOnDestroy(): void {
    if (this.redirectTimeoutId !== null) {
      window.clearTimeout(this.redirectTimeoutId);
    }
  }
}
