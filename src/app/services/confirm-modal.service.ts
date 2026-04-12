import { Injectable, inject } from '@angular/core';
import { ModalService } from './modal.service';
import { WarningModal, WarningModalData } from '../components/warning-modal/warning-modal';

export interface ConfirmModalOptions {
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmModalService {
  private readonly modalService = inject(ModalService);

  /**
   * Opens a standard warning/confirm modal and resolves to `true` only when confirmed.
   */
  async confirm(data: WarningModalData, options: ConfirmModalOptions = {}): Promise<boolean> {
    const result = await this.modalService.open<WarningModalData, boolean>({
      component: WarningModal,
      data,
      ...options,
    });

    return result === true;
  }
}
