import { Component, ElementRef, HostListener, effect, inject, viewChild } from '@angular/core';
import { DOCUMENT, NgComponentOutlet } from '@angular/common';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-modal-container',
  imports: [NgComponentOutlet],
  templateUrl: './modal-container.html',
  styleUrl: './modal-container.scss',
})
export class ModalContainer {
  readonly modalService = inject(ModalService);
  private readonly document = inject(DOCUMENT);

  private readonly modalDialog = viewChild<ElementRef<HTMLElement>>('modalDialog');

  private wasOpen = false;
  private lastFocusedElement: HTMLElement | null = null;
  private previousBodyOverflow: string | null = null;
  private inertTargets: HTMLElement[] = [];

  constructor() {
    effect(() => {
      const isOpen = this.modalService.isOpen();

      if (isOpen && !this.wasOpen) {
        this.wasOpen = true;
        this.onModalOpened();
        return;
      }

      if (!isOpen && this.wasOpen) {
        this.wasOpen = false;
        this.onModalClosed();
      }
    });
  }

  get componentType() {
    return this.modalService.config()?.component ?? null;
  }

  get componentInputs() {
    const config = this.modalService.config();
    return config?.data ? { data: config.data } : {};
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.modalService.isOpen()) {
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    this.trapTabKey(event);
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

  private onModalOpened(): void {
    const activeElement = this.document.activeElement;
    this.lastFocusedElement = activeElement instanceof HTMLElement ? activeElement : null;

    this.lockBodyScroll();
    this.setBackgroundInert(true);
    this.focusFirstElementAfterRender();
  }

  private onModalClosed(): void {
    this.setBackgroundInert(false);
    this.unlockBodyScroll();

    const elementToRestore = this.lastFocusedElement;
    this.lastFocusedElement = null;
    if (elementToRestore && this.document.body.contains(elementToRestore)) {
      setTimeout(() => {
        elementToRestore.focus({ preventScroll: true });
      }, 0);
    }
  }

  private focusFirstElementAfterRender(): void {
    setTimeout(() => {
      const dialog = this.modalDialog()?.nativeElement;
      if (!dialog) {
        return;
      }

      const focusable = this.getFocusableElements(dialog);
      const target = focusable[0] ?? dialog;
      target.focus({ preventScroll: true });
    }, 0);
  }

  private trapTabKey(event: KeyboardEvent): void {
    const dialog = this.modalDialog()?.nativeElement;
    if (!dialog) {
      return;
    }

    const focusable = this.getFocusableElements(dialog);
    if (focusable.length === 0) {
      event.preventDefault();
      dialog.focus({ preventScroll: true });
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeElement = this.document.activeElement;
    const active = activeElement instanceof HTMLElement ? activeElement : null;
    const isInside = active ? dialog.contains(active) : false;

    if (event.shiftKey) {
      if (!active || !isInside || active === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      }
      return;
    }

    if (!active || !isInside || active === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }

  private getFocusableElements(root: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'area[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'iframe',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((el) => {
      if (el instanceof HTMLInputElement && el.type === 'hidden') {
        return false;
      }

      return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    });
  }

  private lockBodyScroll(): void {
    if (this.previousBodyOverflow !== null) {
      return;
    }

    this.previousBodyOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
  }

  private unlockBodyScroll(): void {
    if (this.previousBodyOverflow === null) {
      return;
    }

    this.document.body.style.overflow = this.previousBodyOverflow;
    this.previousBodyOverflow = null;
  }

  private setBackgroundInert(isInert: boolean): void {
    if (isInert) {
      this.inertTargets = this.getBackgroundTargets();
      for (const target of this.inertTargets) {
        target.setAttribute('inert', '');
        target.setAttribute('aria-hidden', 'true');
      }
      return;
    }

    for (const target of this.inertTargets) {
      target.removeAttribute('inert');
      target.removeAttribute('aria-hidden');
    }
    this.inertTargets = [];
  }

  private getBackgroundTargets(): HTMLElement[] {
    const selectors = ['main.app-content', 'app-navigation'];
    const targets = new Set<HTMLElement>();

    for (const selector of selectors) {
      const element = this.document.querySelector(selector);
      if (element instanceof HTMLElement) {
        targets.add(element);
      }
    }

    return Array.from(targets);
  }
}
