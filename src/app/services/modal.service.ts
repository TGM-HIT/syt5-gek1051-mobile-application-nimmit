import { Injectable, signal, computed, Type, ComponentRef } from '@angular/core';

export interface ModalConfig<T = unknown> {
  component: Type<unknown>;
  data?: T;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

export interface ModalRef<R = unknown> {
  close: (result?: R) => void;
  dismiss: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private readonly _isOpen = signal(false);
  private readonly _config = signal<ModalConfig | null>(null);
  private _resolvePromise: ((value: unknown) => void) | null = null;
  private _cleanupTimer: ReturnType<typeof setTimeout> | null = null;

  // Public readonly signals
  readonly isOpen = this._isOpen.asReadonly();
  readonly config = this._config.asReadonly();
  readonly hasModal = computed(() => this._config() !== null);

  /**
   * Öffnet ein Modal mit der angegebenen Konfiguration
   * @returns Promise das resolved wenn das Modal geschlossen wird
   */
  open<T, R = unknown>(config: ModalConfig<T>): Promise<R | undefined> {
    this.clearCleanupTimer();

    const fullConfig: ModalConfig<T> = {
      closeOnBackdropClick: true,
      closeOnEscape: true,
      ...config
    };

    this._config.set(fullConfig as ModalConfig);
    this._isOpen.set(true);

    return new Promise<R | undefined>((resolve) => {
      this._resolvePromise = resolve as (value: unknown) => void;
    });
  }

  /**
   * Schließt das aktuelle Modal mit einem optionalen Result
   */
  close<R>(result?: R): void {
    if (this._resolvePromise) {
      this._resolvePromise(result);
      this._resolvePromise = null;
    }
    this._cleanup();
  }

  /**
   * Schließt das Modal ohne Result (abbrechen)
   */
  dismiss(): void {
    if (this._resolvePromise) {
      this._resolvePromise(undefined);
      this._resolvePromise = null;
    }
    this._cleanup();
  }

  /**
   * Handler für Backdrop-Click
   */
  onBackdropClick(): void {
    const config = this._config();
    if (config?.closeOnBackdropClick) {
      this.dismiss();
    }
  }

  /**
   * Handler für Escape-Taste
   */
  onEscapeKey(): void {
    const config = this._config();
    if (config?.closeOnEscape) {
      this.dismiss();
    }
  }

  private _cleanup(): void {
    this._isOpen.set(false);
    // Kurze Verzögerung für Animation (aber sicher für direktes Re-Open)
    this.clearCleanupTimer();
    this._cleanupTimer = setTimeout(() => {
      if (!this._isOpen()) {
        this._config.set(null);
      }
      this._cleanupTimer = null;
    }, 200);
  }

  private clearCleanupTimer(): void {
    if (this._cleanupTimer === null) {
      return;
    }

    clearTimeout(this._cleanupTimer);
    this._cleanupTimer = null;
  }
}

