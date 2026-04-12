import { Component, inject, input } from '@angular/core';
import { LucideAngularModule, X } from 'lucide-angular';
import { ModalService } from '../../services/modal.service';
import { TranslocoModule } from '@jsverse/transloco';

export interface WarningModalData {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-warning-modal',
  imports: [LucideAngularModule, TranslocoModule],
  templateUrl: './warning-modal.html',
  styleUrl: './warning-modal.scss',
})
export class WarningModal {
  private readonly modalService = inject(ModalService);

  readonly data = input<WarningModalData>();
  readonly icons = { X };

  cancel(): void {
    this.modalService.dismiss();
  }

  confirm(): void {
    this.modalService.close(true);
  }
}
