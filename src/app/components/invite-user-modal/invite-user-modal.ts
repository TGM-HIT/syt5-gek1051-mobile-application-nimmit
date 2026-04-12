import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X } from 'lucide-angular';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ModalService } from '../../services/modal.service';
import { SupabaseConnector } from '../../services/supabase-connector';

export interface InviteUserData {
  listId: bigint;
  inviterEmail: string;
  currentUsers: { email: string; username: string | null }[];
}

export interface InviteUserResult {
  invitedEmail: string;
  invitedUsername: string | null;
}

@Component({
  selector: 'app-invite-user-modal',
  imports: [FormsModule, LucideAngularModule, TranslocoModule],
  templateUrl: './invite-user-modal.html',
  styleUrl: './invite-user-modal.scss',
})
export class InviteUserModal {
  private readonly modalService = inject(ModalService);
  private readonly supabase = inject(SupabaseConnector);
  private readonly transloco = inject(TranslocoService);

  readonly data = input<InviteUserData>();
  readonly icons = { X };

  readonly inviteEmail = signal('');
  readonly resolvedUsername = signal<string | null>(null);
  readonly isResolving = signal(false);
  readonly isSubmitting = signal(false);
  readonly hasChecked = signal(false);
  readonly errorMessage = signal<string | null>(null);

  get inviterEmail(): string {
    return this.data()?.inviterEmail ?? '';
  }

  get canSubmit(): boolean {
    return this.isValidEmail(this.inviteEmail()) && !this.isSubmitting();
  }

  close(): void {
    this.modalService.dismiss();
  }

  onEmailChange(value: string): void {
    this.inviteEmail.set(value);
    this.hasChecked.set(false);
    this.resolvedUsername.set(null);
    this.errorMessage.set(null);
  }

  async resolveUsername(): Promise<void> {
    const email = this.inviteEmail().trim();
    this.hasChecked.set(true);
    this.errorMessage.set(null);
    this.resolvedUsername.set(null);

    if (!this.isValidEmail(email)) {
      this.errorMessage.set(this.transloco.translate('modals.inviteUser.errors.invalidEmail'));
      return;
    }
    if (email.toLowerCase() === this.inviterEmail.toLowerCase()) {
      this.errorMessage.set(this.transloco.translate('modals.inviteUser.errors.selfInvite'));
      return;
    }
    if (this.data()?.currentUsers.some(user => user.email.toLowerCase() === email.toLowerCase())) {
      this.errorMessage.set(this.transloco.translate('modals.inviteUser.errors.alreadyMember'));
      return;
    }

    this.isResolving.set(true);
    try {
      const resolved = await this.supabase.resolveInviteeByEmail(email);
      if (!resolved.userId) {
        this.errorMessage.set(this.transloco.translate('modals.inviteUser.errors.userNotFound'));
        return;
      }
      this.resolvedUsername.set(resolved.username);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : this.transloco.translate('modals.inviteUser.errors.checkFailed')
      );
    } finally {
      this.isResolving.set(false);
    }
  }

  async submit(): Promise<void> {
    if (!this.canSubmit) {
      return;
    }

    const listId = this.data()?.listId;
    if (!listId) {
      this.errorMessage.set(this.transloco.translate('modals.inviteUser.errors.listNotFound'));
      return;
    }
    if (this.data()?.currentUsers.some(user => user.email.toLowerCase() === this.inviteEmail().trim().toLowerCase())) {
      this.errorMessage.set(this.transloco.translate('modals.inviteUser.errors.alreadyMember'));
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    try {
      const result = await this.supabase.inviteUserToListByEmail(listId, this.inviteEmail());
      this.modalService.close<InviteUserResult>({
        invitedEmail: this.inviteEmail().trim().toLowerCase(),
        invitedUsername: result.username,
      });
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : this.transloco.translate('modals.inviteUser.errors.sendFailed')
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private isValidEmail(value: string): boolean {
    const email = value.trim();
    if (!email) {
      return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
