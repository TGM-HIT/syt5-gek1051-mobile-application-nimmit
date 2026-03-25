import { Component, OnInit, signal } from '@angular/core';
import { Lists } from '../../types';
import { SupabaseConnector } from '../../services/supabase-connector';
import { LISTS_TABLE, PowerSyncService, USER_ID_PLACEHOLDER, USER_LIST_ID_PLACEHOLDER } from '../../services/powersync';
import { Router } from '@angular/router';
import { LucideAngularModule, ListChecks, Plus, ArrowRight, Layers, ThermometerSnowflake, Form } from 'lucide-angular';
import { AsyncPipe } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

type ListWithUserCount = Lists & {
  other_users_count?: number | null;
};

@Component({
  selector: 'app-shopping-lists',
  imports: [LucideAngularModule, AsyncPipe, ReactiveFormsModule],
  templateUrl: './shopping-lists.html',
  styleUrl: './shopping-lists.scss',
})
export class ShoppingLists implements OnInit {
  readonly lists = signal<ListWithUserCount[]>([]);
  userId: string | null = null;
  readonly icons = { ListChecks, Plus, ArrowRight, Layers };

  // eslint-disable-next-line @typescript-eslint/unbound-method
  protected control = new FormControl('', [Validators.required, Validators.minLength(1)]);

  constructor(
    private supabase: SupabaseConnector,
    protected readonly powerSync: PowerSyncService,
    private readonly router: Router
  ) {
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async ngOnInit() {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.powerSync.ready$.subscribe(async initialized => {
      if (initialized) {
        await this.initialize();
      }
    });
  }

  private async initialize(): Promise<void> {
    const session = await this.supabase.getSession();
    if (session) {
      this.userId = session.user.id;
    } else {
      this.userId = USER_ID_PLACEHOLDER;
    };
    this.getLists();
  }

  getLists() {
    const sql = `SELECT * FROM "Lists"`;
    const pendingLists = this.powerSync.query<Lists>(sql, [this.userId]).watch();
    
    const dispose = pendingLists.registerListener({
      onData: async (data) => {
        const rows = data as Lists[];
        const listsWithUserCount: ListWithUserCount[] = await Promise.all(rows.map(async list => ({
          ...list,
          other_users_count: list.id ? await this.supabase.getUserCountForList(list.id)-1 : null
        })));
        this.lists.set(listsWithUserCount);
        console.log('Data updated:', data);
      },
      onError: (error) => {
        console.error('Query error:', error);
      }
    });
  
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
    if (!name) this.control.markAsTouched();

    await this.addList(name);
    input.value = '';
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
