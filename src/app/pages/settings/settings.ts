import { Component, computed, inject, signal } from '@angular/core';
import { ThemeService } from '../../services';
import { RouterLink } from '@angular/router';
import { Theme } from '../../types';
import { LucideAngularModule, Check, ChevronDown } from 'lucide-angular';
import { DefaultList } from '../../services/default-list';
import { SupabaseConnector } from '../../services/supabase-connector';
import { PowerSyncService, USER_ID_PLACEHOLDER } from '../../services/powersync';

interface ListOption {
  id: bigint;
  name: string;
}

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
        <span class="setting-label">Standardliste</span>
        <div class="dropdown-container">
          <button class="dropdown-trigger" (click)="toggleListDropdown()" type="button">
            <span class="dropdown-value">{{ selectedListName() }}</span>
            <lucide-angular [img]="icons.ChevronDown" [class.open]="isListDropdownOpen()"></lucide-angular>
          </button>

          @if (isListDropdownOpen()) {
            <div class="dropdown-menu">
              <button class="dropdown-option" type="button" (click)="selectNoDefaultList()">
                <span>None</span>
                @if (isNoneSelected()) {
                  <lucide-angular class="check-icon" [img]="icons.Check"></lucide-angular>
                }
              </button>
              @for (list of lists(); track list.id.toString()) {
                <button class="dropdown-option" type="button" (click)="selectDefaultList(list.id)">
                  <span>{{ list.name }}</span>
                  @if (isListSelected(list.id)) {
                    <lucide-angular class="check-icon" [img]="icons.Check"></lucide-angular>
                  }
                </button>
              } @empty {
                <div class="dropdown-empty">Keine Listen gefunden</div>
              }
            </div>
          }
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
      .dropdown-container {
        position: relative;
      }
      .dropdown-trigger {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 12px;
        border: 1px solid var(--color-border);
        border-radius: 8px;
        background-color: var(--color-elevated);
        color: var(--color-text);
        cursor: pointer;
      }
      .dropdown-value {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      lucide-angular {
        width: 16px;
        height: 16px;
        transition: transform 0.2s ease;
      }
      lucide-angular.open {
        transform: rotate(180deg);
      }
      .dropdown-menu {
        margin-top: 8px;
        border: 1px solid var(--color-border);
        border-radius: 8px;
        overflow: hidden;
        background: var(--color-elevated);
      }
      .dropdown-option {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 12px;
        border: 0;
        border-bottom: 1px solid var(--color-border);
        background: transparent;
        color: var(--color-text);
        text-align: left;
        cursor: pointer;
      }
      .dropdown-option:last-child {
        border-bottom: 0;
      }
      .dropdown-option:hover {
        background: var(--color-surface);
      }
      .check-icon {
        color: #29b5f2;
      }
      .dropdown-empty {
        padding: 12px;
        color: var(--color-text-secondary);
      }
    `,
  ],
  imports: [RouterLink, LucideAngularModule],
})
export class Settings {
  readonly themeService = inject(ThemeService);
  private readonly defaultList = inject(DefaultList);
  private readonly powerSync = inject(PowerSyncService);
  private readonly supabase = inject(SupabaseConnector);
  readonly icons = { Check, ChevronDown };

  readonly lists = signal<ListOption[]>([]);
  readonly isListDropdownOpen = signal(false);
  readonly selectedDefaultListId = signal<bigint | null>(this.defaultList.getDefaultList());
  readonly selectedListName = computed(() => {
    const selectedId = this.selectedDefaultListId();

    if (selectedId === null) {
      return 'None';
    }

    const selected = this.lists().find((list) => list.id === selectedId);
    return selected?.name ?? 'None';
  });

  constructor() {
    this.powerSync.ready$.subscribe((initialized) => {
      if (initialized) {
        void this.loadLists();
      }
    });
  }

  setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }

  toggleListDropdown(): void {
    this.isListDropdownOpen.update((open) => !open);
  }

  isListSelected(listId: bigint): boolean {
    return this.selectedDefaultListId() === listId;
  }

  isNoneSelected(): boolean {
    return this.selectedDefaultListId() === null;
  }

  selectDefaultList(listId: bigint): void {
    this.selectedDefaultListId.set(listId);
    this.defaultList.setDefaultList(listId);
    this.isListDropdownOpen.set(false);
  }

  selectNoDefaultList(): void {
    this.selectedDefaultListId.set(null);
    this.defaultList.setDefaultList(null);
    this.isListDropdownOpen.set(false);
  }

  private async loadLists(): Promise<void> {
    const session = await this.supabase.getSession();
    const userId = session?.user.id ?? USER_ID_PLACEHOLDER;

    const sql = `
      SELECT l.id,
             l.name
      FROM "Lists" l
      LEFT JOIN "UserLists" ul ON l.id = ul.list
      WHERE ul.user = ?
      ORDER BY l.created_at DESC
    `;

    this.powerSync.watchWithCallback(sql, (result) => {
      const rows = this.toRows<{ id: bigint | number | string; name: string }>(result.rows);
      const mappedRows = rows.map((row) => ({
        id: this.toBigInt(row.id),
        name: row.name
      }));

      this.lists.set(mappedRows);

      if (!mappedRows.some((list) => list.id === this.selectedDefaultListId())) {
        this.selectedDefaultListId.set(null);
        this.defaultList.setDefaultList(null);
      }
    }, [userId]);
  }

  private toRows<T>(rows: unknown): T[] {
    if (Array.isArray(rows)) {
      return rows as T[];
    }

    if (rows && typeof rows === 'object') {
      const maybeArray = Reflect.get(rows, '_array');
      if (Array.isArray(maybeArray)) {
        return maybeArray as T[];
      }
    }

    return [];
  }

  private toBigInt(value: bigint | number | string): bigint {
    if (typeof value === 'bigint') {
      return value;
    }

    if (typeof value === 'number') {
      return BigInt(Math.trunc(value));
    }

    return BigInt(value);
  }
}
