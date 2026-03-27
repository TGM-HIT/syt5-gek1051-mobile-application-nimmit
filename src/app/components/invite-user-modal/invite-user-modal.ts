import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X } from 'lucide-angular';
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
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './invite-user-modal.html',
  styleUrl: './invite-user-modal.scss',
})
export class InviteUserModal {
  private readonly modalService = inject(ModalService);
  private readonly supabase = inject(SupabaseConnector);

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
      this.errorMessage.set('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }
    if (email.toLowerCase() === this.inviterEmail.toLowerCase()) {
      this.errorMessage.set('Du kannst dich nicht selbst einladen.');
      return;
    }
    if (this.data()?.currentUsers.some(user => user.email.toLowerCase() === email.toLowerCase())) {
      this.errorMessage.set('Dieser Nutzer ist bereits Mitglied der Liste.');
      return;
    }

    this.isResolving.set(true);
    try {
      const resolved = await this.supabase.resolveInviteeByEmail(email);
      if (!resolved.userId) {
        this.errorMessage.set('Kein Nutzer mit dieser E-Mail gefunden.');
        return;
      }
      this.resolvedUsername.set(resolved.username);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Nutzer konnte nicht geprüft werden.');
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
      this.errorMessage.set('Liste konnte nicht ermittelt werden.');
      return;
    }
    if (this.data()?.currentUsers.some(user => user.email.toLowerCase() === this.inviteEmail().trim().toLowerCase())) {
      this.errorMessage.set('Dieser Nutzer ist bereits Mitglied der Liste.');
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
      this.errorMessage.set(error instanceof Error ? error.message : 'Einladung konnte nicht gesendet werden.');
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
