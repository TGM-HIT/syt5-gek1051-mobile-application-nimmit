import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { LanguageService, ThemeService, AppLanguage } from '../../services';
import { RouterLink } from '@angular/router';
import { Theme } from '../../types';
import { LucideAngularModule, Check, ChevronDown } from 'lucide-angular';
import { DefaultList } from '../../services/default-list';
import { PowerSyncService, USER_ID_PLACEHOLDER } from '../../services/powersync';
import { TranslocoModule } from '@jsverse/transloco';

interface ListOption {
  id: bigint;
  name: string;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  imports: [RouterLink, LucideAngularModule, TranslocoModule],
})
export class Settings implements OnDestroy {
  readonly themeService = inject(ThemeService);
  readonly languageService = inject(LanguageService);
  private readonly defaultList = inject(DefaultList);
  private readonly powerSync = inject(PowerSyncService);
  readonly icons = { Check, ChevronDown };

  private stopListsWatch: (() => void) | null = null;

  readonly lists = signal<ListOption[]>([]);
  readonly languages = this.languageService.getSupportedLanguages();
  readonly isListDropdownOpen = signal(false);
  readonly isLanguageDropdownOpen = signal(false);
  readonly selectedDefaultListId = signal<bigint | null>(this.defaultList.getDefaultList());
  readonly selectedListName = computed(() => {
    const selectedId = this.selectedDefaultListId();

    if (selectedId === null) {
      return null;
    }

    const selected = this.lists().find((list) => list.id === selectedId);
    return selected?.name ?? null;
  });

  constructor() {
    this.powerSync.ready$.subscribe((initialized) => {
      if (initialized) {
        void this.loadLists();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopListsWatch?.();
    this.stopListsWatch = null;
  }

  setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }

  toggleListDropdown(): void {
    this.isListDropdownOpen.update((open) => !open);
  }

  toggleLanguageDropdown(): void {
    this.isLanguageDropdownOpen.update((open) => !open);
  }

  isLanguageSelected(language: AppLanguage): boolean {
    return this.languageService.language() === language;
  }

  selectLanguage(language: AppLanguage): void {
    this.languageService.setLanguage(language);
    this.isLanguageDropdownOpen.set(false);
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
    this.stopListsWatch?.();
    this.stopListsWatch = null;
    this.lists.set([]);

    const userId = USER_ID_PLACEHOLDER;

    const sql = `
      SELECT l.id,
             l.name
      FROM "Lists" l
      LEFT JOIN "UserLists" ul ON l.id = ul.list
      WHERE ul.user = ?
      ORDER BY l.created_at DESC
    `;

    this.stopListsWatch = this.powerSync.watchWithCallback(sql, (result) => {
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
