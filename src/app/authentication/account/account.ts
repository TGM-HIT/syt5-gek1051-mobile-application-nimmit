import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { User } from '@supabase/supabase-js';
import { SupabaseConnector } from '../../services/supabase-connector';
import { ConfirmModalService } from '../../services/confirm-modal.service';
import { Profile, Timestamp } from '../../types';

@Component({
  selector: 'app-account',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslocoModule],
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class Account implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly supabaseService = inject(SupabaseConnector);
  private readonly confirmModal = inject(ConfirmModalService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isEditMode = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly profile = signal<Profile | null>(null);
  readonly user = signal<User | null>(null);

  readonly editForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    sync_interval: [15, [Validators.required, Validators.min(1), Validators.max(60)]],
  });

  ngOnInit(): void {
    void this.loadAccountData();
  }

  toggleEditMode(): void {
    if (this.isEditMode()) {
      this.resetFormFromProfile();
    }

    this.isEditMode.set(!this.isEditMode());
  }

  async saveChanges(): Promise<void> {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const profile = this.profile();
    if (!profile?.id) {
      this.errorMessage.set(this.transloco.translate('auth.account.invalidUserId'));
      return;
    }

    this.errorMessage.set(null);
    this.isSaving.set(true);

    try {
      const { username, sync_interval } = this.editForm.getRawValue();
      const updatedProfile = await this.supabaseService.updateProfile(profile.id, {
        username,
        sync_interval,
      });

      this.profile.set(updatedProfile);
      this.resetFormFromProfile();
      this.isEditMode.set(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : this.transloco.translate('auth.account.profileUpdateFailed');
      this.errorMessage.set(message);
    } finally {
      this.isSaving.set(false);
    }
  }

  formatUpdatedAt(updatedAt?: Timestamp): string {
    if (!updatedAt) {
      return '-';
    }

    const activeLang = this.transloco.getActiveLang();
    const locale = activeLang === 'de' ? 'de-DE' : 'en-US';

    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(updatedAt));
  }

  private async loadAccountData(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const currentUser = await this.supabaseService.getCurrentUser();

      if (!currentUser) {
        void this.router.navigateByUrl('/login');
        return;
      }

      this.user.set(currentUser);

      const profile = await this.supabaseService.getProfile(currentUser.id);

      if (!profile) {
        this.errorMessage.set(this.transloco.translate('auth.account.accountLoadFailed'));
        return;
      }

      this.profile.set(profile);
      this.resetFormFromProfile();
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : this.transloco.translate('auth.account.accountLoadFailed');

      const errorCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';

      const isAuthError =
        errorMsg.includes('Auth session missing') ||
        /jwt|token|session/i.test(errorMsg) ||
        errorCode.startsWith('PGRST3');

      // Redirect to login if auth session is missing
      if (isAuthError) {
        void this.router.navigateByUrl('/login');
        return;
      }

      this.errorMessage.set(errorMsg);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async logout(): Promise<void> {
    const confirmed = await this.confirmModal.confirm({
      title: this.transloco.translate('auth.account.logoutTitle'),
      message: this.transloco.translate('auth.account.logoutMessage'),
      confirmText: this.transloco.translate('auth.account.logoutConfirm'),
      cancelText: this.transloco.translate('common.cancel'),
    });

    if (!confirmed) {
      return;
    }

    await this.supabaseService.logout();
    window.location.href = '/login';
  }

  private resetFormFromProfile(): void {
    const profile = this.profile();

    this.editForm.setValue({
      username: profile?.username ?? '',
      sync_interval: profile?.settings?.sync_interval ?? 15,
    });
  }
}

