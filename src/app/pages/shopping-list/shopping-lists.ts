import { describe } from 'vitest';
import { Component, OnInit, signal } from '@angular/core';
import { Lists } from '../../types';
import { SupabaseConnector } from '../../services/supabase-connector';
import { LISTS_TABLE, PowerSyncService, USER_ID_PLACEHOLDER } from '../../services/powersync';
import { Router } from '@angular/router';
import { LucideAngularModule, ListChecks, Plus, ArrowRight, Layers, ThermometerSnowflake } from 'lucide-angular';
import { AsyncPipe } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

type ListWithUserCount = Lists & {
  other_users_count?: number | string | null;
};

@Component({
  selector: 'app-shopping-lists',
  imports: [LucideAngularModule, AsyncPipe],
  templateUrl: './shopping-lists.html',
  styleUrl: './shopping-lists.scss',
})
export class ShoppingLists implements OnInit {
  readonly lists = signal<ListWithUserCount[]>([]);
  userId: string | null = null;
  readonly icons = { ListChecks, Plus, ArrowRight, Layers };


  constructor(
    private supabase: SupabaseConnector,
    protected readonly powerSync: PowerSyncService,
    private readonly router: Router
  ) {
  }

  ngOnInit(): void {
    this.powerSync.ready$.subscribe(initialized => {
      if (initialized) {
        void this.initialize();
      }
    });
  }

  private async initialize(): Promise<void> {
    const session = await this.supabase.getSession();
    if (session) {
      this.userId = session.user.id;
    } else {
      this.userId = USER_ID_PLACEHOLDER;
    }
    this.getLists();
  }

  getLists() {

    const sql = `
      SELECT l.li_id,
             l.created_at,
             l.name,
             l.description
      FROM "Lists" l LEFT JOIN "UserLists" ul ON l.li_id = ul.list
      WHERE ul.user = ?
      ORDER BY l.created_at DESC
    `;
    this.powerSync.watchWithCallback(sql, (result) => {
      // eslint-disable-next-line no-underscore-dangle
      if (result.rows?._array) {
        // eslint-disable-next-line no-underscore-dangle
        this.lists.set(result.rows._array as ListWithUserCount[]);
      } else {
        this.lists.set([]);
      }
    }, [this.userId]);
  }

  async addList(name: string, description: string = ''): Promise<void> {
    if (!name) return;

    const rowId = crypto.randomUUID();
    const listMembershipRowId = crypto.randomUUID();

    const listData = await this.powerSync.execute(
      `INSERT INTO ${LISTS_TABLE} (id, li_id, created_at, name, description) VALUES (?, ABS(RANDOM()), datetime(), ?, ?) RETURNING li_id`,
      [rowId, name, description]
    );

    const ulistData = await this.powerSync.execute(
      `INSERT INTO "UserLists" (id, created_at, user, list) VALUES (?, datetime(), ?, ?) RETURNING list, user`,
      // eslint-disable-next-line no-underscore-dangle
      [listMembershipRowId, this.userId, listData.rows?._array[0].li_id]
    );
  }

  async createList(input: HTMLInputElement): Promise<void> {
    const name = input.value.trim();
    if (!name) return;

    await this.addList(name);
    input.value = '';
  }

  openList(list: Lists): void {
    void this.router.navigate(['/list'], {
      queryParams: { listId: list.li_id }
    });
  }

  getOtherUsersCount(list: ListWithUserCount): number {
    const value = Number(list.other_users_count ?? 0);
    return Number.isFinite(value) ? value : 0;
  }
}
