import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services';
import { RouterLink } from '@angular/router';
import { Theme } from '../../types';

@Component({
  selector: 'app-settings',
  template: `
    <div class="page-container">
      <h1>Einstellungen</h1>

      <div class="setting-item">
        <span class="setting-label">Theme</span>
        <div class="theme-buttons">
          <button
            class="theme-btn"
            [class.active]="themeService.theme() === 'light'"
            (click)="setTheme('light')"
          >
            Hell
          </button>
          <button
            class="theme-btn"
            [class.active]="themeService.theme() === 'dark'"
            (click)="setTheme('dark')"
          >
            Dunkel
          </button>
          <button
            class="theme-btn"
            [class.active]="themeService.theme() === 'system'"
            (click)="setTheme('system')"
          >
            System
          </button>
        </div>
      </div>

      <div class="setting-item">
        <span class="setting-label">Account</span>
        <a class="theme-btn" routerLink="/account">Accounteinstellungen</a>
      </div>
    </div>
  `,
  styles: [
    `
      .page-container {
        padding: 16px;
        padding-bottom: 100px;
      }
      h1 {
        color: var(--color-text);
        margin-bottom: 24px;
      }
      .setting-item {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
        background-color: var(--color-surface);
        border-radius: 12px;
        border: 1px solid var(--color-border);
      }
      .setting-label {
        font-weight: 600;
        color: var(--color-text);
      }
      .theme-buttons {
        display: flex;
        gap: 8px;
      }
      .theme-btn {
        flex: 1;
        padding: 12px;
        border: 1px solid var(--color-border);
        border-radius: 8px;
        background-color: var(--color-elevated);
        color: var(--color-text-secondary);
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .theme-btn:hover {
        background-color: var(--color-surface);
        color: var(--color-text);
      }
      .theme-btn.active {
        background-color: #29b5f2;
        border-color: #29b5f2;
        color: white;
      }
    `,
  ],
  imports: [RouterLink],
})
export class Settings {
  readonly themeService = inject(ThemeService);

  setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }
}
