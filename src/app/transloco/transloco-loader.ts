import { Injectable } from '@angular/core';
import { TranslocoLoader } from '@jsverse/transloco';

@Injectable({
  providedIn: 'root',
})
export class TranslocoAppLoader implements TranslocoLoader {
  async getTranslation(lang: string): Promise<Record<string, unknown>> {
    switch (lang) {
      case 'de':
        return (await import('../i18n/de')).default;
      case 'en':
        return (await import('../i18n/en')).default;
      default:
        return (await import('../i18n/de')).default;
    }
  }
}
