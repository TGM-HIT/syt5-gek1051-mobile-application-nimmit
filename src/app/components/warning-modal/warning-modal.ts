import { Component, computed, inject, input } from '@angular/core';
import { LucideAngularModule, X } from 'lucide-angular';
import { ModalService } from '../../services/modal.service';

export interface WarningModalData {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-warning-modal',
  imports: [LucideAngularModule],
  templateUrl: './warning-modal.html',
  styleUrl: './warning-modal.scss',
})
export class WarningModal {
  private readonly modalService = inject(ModalService);

  readonly data = input<WarningModalData>();
  readonly icons = { X };

  readonly title = computed(() => this.data()?.title ?? 'Warnung');
  readonly message = computed(() => this.data()?.message ?? '');
  readonly confirmText = computed(() => this.data()?.confirmText ?? 'Bestätigen');
  readonly cancelText = computed(() => this.data()?.cancelText ?? 'Abbrechen');

  cancel(): void {
    this.modalService.dismiss();
  }

  confirm(): void {
    this.modalService.close(true);
  }
}
