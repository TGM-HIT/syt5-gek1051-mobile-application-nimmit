import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Profile, SupabaseService } from '../../services/supabase';
import { User } from '@supabase/supabase-js';

@Component({
  selector: 'app-account',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class Account implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);

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
    if (!profile?.u_id) {
      this.errorMessage.set('Keine gueltige User-ID gefunden.');
      return;
    }

    this.errorMessage.set(null);
    this.isSaving.set(true);

    try {
      const { username, sync_interval } = this.editForm.getRawValue();
      const updatedProfile = await this.supabaseService.updateProfile(profile.u_id, {
        username,
        sync_interval,
      });

      this.profile.set(updatedProfile);
      this.resetFormFromProfile();
      this.isEditMode.set(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Profil konnte nicht aktualisiert werden.';
      this.errorMessage.set(message);
    } finally {
      this.isSaving.set(false);
    }
  }

  formatUpdatedAt(updatedAt?: Date): string {
    if (!updatedAt) {
      return '-';
    }

    return new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(updatedAt);
  }

  private async loadAccountData(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const currentUser = await this.supabaseService.getCurrentUser();

      if (!currentUser) {
        throw new Error('Kein eingeloggter Benutzer gefunden.');
      }

      this.user.set(currentUser);

      const profile = await this.supabaseService.getProfile(currentUser.id);

      if (!profile) {
        throw new Error('Profil konnte nicht geladen werden.');
      }

      this.profile.set(profile);
      this.resetFormFromProfile();
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Account-Daten konnten nicht geladen werden.';

      // Redirect to login if auth session is missing
      if (
        errorMsg.includes('Auth session missing') ||
        errorMsg.includes('Kein eingeloggter Benutzer')
      ) {
        void this.router.navigateByUrl('/login');
        return;
      }

      this.errorMessage.set(errorMsg);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected logout(): void {
    this.supabaseService.logout().then(() => {
      window.location.href = '/login';
    });
  }

  private resetFormFromProfile(): void {
    const profile = this.profile();

    this.editForm.setValue({
      username: profile?.username ?? '',
      sync_interval: profile?.settings.sync_interval ?? 15,
    });
  }
}
