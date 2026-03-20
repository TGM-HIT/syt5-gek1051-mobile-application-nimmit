import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Theme } from '../types';


const THEME_STORAGE_KEY = 'nimmit-theme';

/**
 * Theme Service für Dark/Light Mode Management
 *
 * Verwendung:
 *
 * ```typescript
 * // In einer Component
 * export class MyComponent {
 *   private themeService = inject(ThemeService);
 *
 *   // Aktuelles Theme lesen
 *   currentTheme = this.themeService.theme;
 *
 *   // Ob Dark Mode aktiv ist
 *   isDark = this.themeService.isDarkMode;
 *
 *   // Theme wechseln
 *   toggleTheme() {
 *     this.themeService.toggleTheme();
 *   }
 *
 *   // Bestimmtes Theme setzen
 *   setDark() {
 *     this.themeService.setTheme('dark');
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Aktuelles Theme ('light', 'dark', oder 'system') */
  readonly theme = signal<Theme>(this.getInitialTheme());

  /** Ob aktuell Dark Mode aktiv ist (auch bei 'system' Theme) */
  readonly isDarkMode = signal<boolean>(this.checkIsDarkMode());

  private mediaQuery: MediaQueryList | null = null;

  constructor() {
    if (this.isBrowser) {
      // Media Query für System-Präferenz
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      // Listener für System-Präferenz-Änderungen
      this.mediaQuery.addEventListener('change', (e) => {
        if (this.theme() === 'system') {
          this.applyTheme(e.matches ? 'dark' : 'light');
          this.isDarkMode.set(e.matches);
        }
      });

      // Effect um Theme-Änderungen zu verarbeiten
      effect(() => {
        const theme = this.theme();
        this.saveTheme(theme);
        this.updateTheme(theme);
      });

      // Initial Theme anwenden
      this.updateTheme(this.theme());
    }
  }

  /**
   * Setzt das Theme
   * @param theme 'light', 'dark', oder 'system'
   */
  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  /**
   * Wechselt zwischen Light und Dark Mode
   * (System wird zu Light wenn aktuell dunkel, sonst zu Dark)
   */
  toggleTheme(): void {
    const current = this.theme();

    if (current === 'system') {
      // Bei System: Wechsel zu entgegengesetztem Modus
      this.setTheme(this.isDarkMode() ? 'light' : 'dark');
    } else {
      this.setTheme(current === 'dark' ? 'light' : 'dark');
    }
  }

  /**
   * Zykliert durch alle Themes: light -> dark -> system -> light
   */
  cycleTheme(): void {
    const current = this.theme();
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(current);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }

  private getInitialTheme(): Theme {
    if (!this.isBrowser) {
      return 'system';
    }

    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored as Theme;
    }

    return 'system';
  }

  private saveTheme(theme: Theme): void {
    if (this.isBrowser) {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }

  private updateTheme(theme: Theme): void {
    if (!this.isBrowser) return;

    let effectiveTheme: 'light' | 'dark';

    if (theme === 'system') {
      effectiveTheme = this.mediaQuery?.matches ? 'dark' : 'light';
      // Entferne data-theme um System-Präferenz zu nutzen
      document.documentElement.removeAttribute('data-theme');
    } else {
      effectiveTheme = theme;
      document.documentElement.setAttribute('data-theme', theme);
    }

    this.isDarkMode.set(effectiveTheme === 'dark');
    this.applyTheme(effectiveTheme);
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    if (!this.isBrowser) return;

    // Für iOS/Safari: meta theme-color anpassen
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        theme === 'dark' ? '#121212' : '#ffffff'
      );
    }
  }

  private checkIsDarkMode(): boolean {
    if (!this.isBrowser) return false;

    const theme = this.getInitialTheme();
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return theme === 'dark';
  }
}
