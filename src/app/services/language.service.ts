import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export type AppLanguage = 'de' | 'en';

const LANGUAGE_STORAGE_KEY = 'nimmit-language';
const SUPPORTED_LANGUAGES: readonly AppLanguage[] = ['de', 'en'] as const;

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);

  readonly language = signal<AppLanguage>(this.getInitialLanguage());

  init(): void {
    this.applyLanguage(this.language());
  }

  setLanguage(language: AppLanguage): void {
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return;
    }

    this.language.set(language);
    this.applyLanguage(language);
  }

  getSupportedLanguages(): readonly AppLanguage[] {
    return SUPPORTED_LANGUAGES;
  }

  getLocale(): string {
    return this.language() === 'de' ? 'de-DE' : 'en-US';
  }

  private applyLanguage(language: AppLanguage): void {
    this.transloco.setActiveLang(language);

    if (this.isBrowser) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }

    this.document.documentElement.lang = language;
  }

  private getInitialLanguage(): AppLanguage {
    if (this.isBrowser) {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === 'de' || stored === 'en') {
        return stored;
      }

      const browserLang = navigator.language?.toLowerCase() ?? '';
      if (browserLang.startsWith('de')) {
        return 'de';
      }
      if (browserLang.startsWith('en')) {
        return 'en';
      }
    }

    return 'de';
  }
}
