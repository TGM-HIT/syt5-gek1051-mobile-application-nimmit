import { Component, OnDestroy, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { Lists } from '../../types';
import { SupabaseConnector } from '../../services/supabase-connector';
import { PowerSyncService, USER_ID_PLACEHOLDER, USER_LIST_ID_PLACEHOLDER } from '../../services/powersync';
import { Router } from '@angular/router';
import { LucideAngularModule, ListChecks, Plus, ArrowRight, Layers } from 'lucide-angular';
import { AsyncPipe } from '@angular/common';
import { take } from 'rxjs';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

type ListWithUserCount = Lists & {
  other_users_count?: number | null;
};

@Component({
  selector: 'app-shopping-lists',
  imports: [LucideAngularModule, AsyncPipe, ReactiveFormsModule, TranslocoModule],
  templateUrl: './shopping-lists.html',
  styleUrl: './shopping-lists.scss',
})
export class ShoppingLists implements OnInit, OnDestroy {
  readonly lists = signal<ListWithUserCount[]>([]);
  userId: string | null = null;
  readonly icons = { ListChecks, Plus, ArrowRight, Layers };

  private stopListsWatch: (() => void) | null = null;
  private watchedListsQuery: { close?: () => void } | null = null;

  readonly isOnline = signal<boolean>(navigator.onLine);
  private readonly handleOnlineStatusChange = () => {
    this.isOnline.set(navigator.onLine);
    this.cdr.detectChanges();
  };

  // eslint-disable-next-line @typescript-eslint/unbound-method
  protected control = new FormControl('', [Validators.required, Validators.minLength(1)]);

  constructor(
    private supabase: SupabaseConnector,
    protected readonly powerSync: PowerSyncService,
    private readonly router: Router,
    private cdr: ChangeDetectorRef
  ) {
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async ngOnInit() {
    window.addEventListener('online', this.handleOnlineStatusChange);
    window.addEventListener('offline', this.handleOnlineStatusChange);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.powerSync.ready$.subscribe(async initialized => {
      if (initialized) {
        await this.initialize();
      }
      take(1);
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.handleOnlineStatusChange);
    window.removeEventListener('offline', this.handleOnlineStatusChange);

    this.disposeListsWatch();
  }

  private async initialize(): Promise<void> {
    this.userId = USER_ID_PLACEHOLDER;
    this.getLists();
  }

  getLists() {
    this.disposeListsWatch();
    this.lists.set([]);

    const sql = `
      SELECT l.*
      FROM "Lists" l
      INNER JOIN "UserLists" ul ON ul.list = l.id
      WHERE ul.user = ?
      ORDER BY l.created_at DESC
    `;

    const watched = this.powerSync.query<Lists>(sql, [USER_ID_PLACEHOLDER]).watch();
    this.watchedListsQuery = watched as unknown as { close?: () => void };

    this.stopListsWatch = watched.registerListener({
      onData: async (data) => {
        try {
          const rows = data as Lists[];
          const listsWithUserCount: ListWithUserCount[] = await Promise.all(rows.map(async list => ({
            ...list,
            other_users_count: list.id ? await this.supabase.getUserCountForList(list.id)-1 : null
          })));
          this.lists.set(listsWithUserCount);
          console.log('Lists set successfully!', listsWithUserCount.length);
          this.cdr.detectChanges();
        } catch (e) {
          console.error('Error updating lists in onData:', e);
          setTimeout(() => alert(`Error in onData: ${String(e)}`), 100);
        }
      },
      onError: (error) => {
        console.error('Query error:', error);
      }
    });

  }

  private disposeListsWatch(): void {
    this.stopListsWatch?.();
    this.stopListsWatch = null;
    this.watchedListsQuery?.close?.();
    this.watchedListsQuery = null;
  }

  async addList(name: string, description: string = ''): Promise<void> {
    if (!name) return;
    const parts = crypto.getRandomValues(new Uint32Array(2));
    // eslint-disable-next-line no-bitwise
    const randomBigInt: bigint = (BigInt(parts[0]) << 16n) | BigInt(parts[1]);
    void randomBigInt;

    await this.powerSync.db.execute(
      `INSERT INTO "Lists" (id, created_at, name, description) VALUES (?, datetime(), ?, ?)`,
      [String(randomBigInt), name, description]
    );
    console.log('List created with ID:', randomBigInt);

    await this.powerSync.execute(
      `INSERT INTO "UserLists" (id, created_at, user, list) VALUES (?, datetime(), ?, ?)`,
      [{user: this.userId, list: randomBigInt} as USER_LIST_ID_PLACEHOLDER, this.userId, String(randomBigInt)]
    );
  }

  async createList(input: HTMLInputElement): Promise<void> {
    const name = input.value.trim();
    if (!name) { 
      this.control.markAsTouched();
      return; 
    }

    try {
      await this.addList(name);
      input.value = '';
      // Force trigger an event just in case it's a zone issue
      window.dispatchEvent(new Event('resize')); 
      console.log('List creation succeeded');
    } catch (e) {
      console.error('List creation failed:', e);
      alert(`Error creating list: ${String(e)}`);
    }
  }

  openList(list: Lists): void {
    void this.router.navigate(['/list'], {
      queryParams: { listId: list.id }
    });
  }

  async getOtherUsersCount(listId: bigint): Promise<number> {
    const value = await this.supabase.getUserCountForList(listId);
    return value;
  }
}
