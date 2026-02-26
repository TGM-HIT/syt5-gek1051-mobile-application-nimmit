import { Component, inject, HostListener } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-modal-container',
  imports: [NgComponentOutlet],
  templateUrl: './modal-container.html',
  styleUrl: './modal-container.scss',
})
export class ModalContainer {
  readonly modalService = inject(ModalService);

  get componentType() {
    return this.modalService.config()?.component ?? null;
  }

  get componentInputs() {
    const config = this.modalService.config();
    return config?.data ? { data: config.data } : {};
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.modalService.onEscapeKey();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.modalService.onBackdropClick();
    }
  }
}
