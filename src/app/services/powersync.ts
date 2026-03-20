import { Injectable, signal } from '@angular/core';
import { AbstractPowerSyncDatabase, column, PowerSyncDatabase, QueryResult, Schema, Table, WASQLiteOpenFactory, WASQLiteVFS } from '@powersync/web';
import { SupabaseConnector } from './supabase-connector';
import { BehaviorSubject } from 'rxjs';

export const LISTS_TABLE = 'Lists';
export const CATEGORY_TABLE = 'Category';
export const ITEM_TABLE = 'Item';
export const FAVORITES_TABLE = 'Favorites';
export const USER_LISTS_TABLE = 'UserLists';
export const LIST_ITEMS_TABLE = 'ListItems';

const Category = new Table(
  {
    // id column (text) is automatically included
    c_id: column.integer,
    created_at: column.text,
    name: column.text
  },
  { indexes: { cid_idx: ["c_id"]} }
);

const Item = new Table(
  {
    // id column (text) is automatically included
    i_id: column.integer,
    created_at: column.text,
    name: column.text,
    category: column.integer,
    content: column.integer,
    description: column.text,
    global: column.integer,
    user: column.text
  },
  { indexes: { iid_idx: ["i_id"] } }
);

const Favorites = new Table(
  {
    // id column (text) is automatically included
    f_id: column.integer,
    created_at: column.text,
    user: column.text,
    item: column.integer
  },
  { indexes: { fid_idx: ["f_id"] } }
);

const UserLists = new Table(
  {
    // id column (text) is automatically included
    created_at: column.text,
    user: column.text,
    list: column.integer
  },
  { indexes: { user_list_idx: ["user", "list"] } }
);

const Lists = new Table(
  {
    // id column (text) is automatically included
    li_id: column.integer,
    created_at: column.text,
    name: column.text,
    description: column.text
  },
  { indexes: { liid_idx: ["li_id"] } }
);

const ListItems = new Table(
  {
    // id column (text) is automatically included
    liste: column.integer,
    item: column.integer,
    created_at: column.text,
    updated_at: column.text,
    curr_amount: column.integer,
    target_amount: column.integer,
    amount_unit: column.text
  },
  { indexes: { liste_item_idx: ["liste", "item"] } }
);

export const publicSchema = new Schema({
  Category,
  Item,
  Favorites,
  UserLists,
  Lists,
  ListItems
});

export const USER_ID_PLACEHOLDER = '__USER_ID__';

@Injectable({
  providedIn: 'root'
})
export class PowerSyncService {
  db: AbstractPowerSyncDatabase;
  currentUserId: string | null = null;
  private isReady$ = new BehaviorSubject<boolean>(false);
  public ready$ = this.isReady$.asObservable();

  constructor() {
    const factory = new WASQLiteOpenFactory({
      dbFilename: 'app.db',
      vfs: WASQLiteVFS.OPFSCoopSyncVFS,
      // Specify the path to the worker script
      worker: '@powersync/worker/WASQLiteDB.umd.js'
    });

    this.db = new PowerSyncDatabase({
      schema: publicSchema,
      database: factory,

      sync: {
        // Specify the path to the worker script
        worker: '@powersync/worker/SharedSyncImplementation.umd.js'
      }
    });

    this.currentUserId = this.getOrCreateUserId();
  }

  execute(sql: string, parameters: unknown[] = []): Promise<QueryResult> {
    const injectedParameters = parameters.map(param => param === USER_ID_PLACEHOLDER ? this.currentUserId : param);
    return this.db.execute(sql, injectedParameters);
  }

  watch(sql: string, parameters: unknown[] = []): AsyncIterable<QueryResult> {
    const injectedParameters = parameters.map(param => param === USER_ID_PLACEHOLDER ? this.currentUserId : param);
    return this.db.watch(sql, injectedParameters);
  }

  watchWithCallback(sql: string, callback: (result: QueryResult) => void, parameters: unknown[] = []) {
    const injectedParameters = parameters.map(param => param === USER_ID_PLACEHOLDER ? this.currentUserId : param);
    this.db.watchWithCallback(sql, injectedParameters, {
      onResult: callback,
      onError: (error) => console.error('Watch error:', error)
    }, {triggerImmediate: true});
  }

  getOrCreateUserId(): string {
    const localStorageKey = 'nimmit_user_id';
    let userId = localStorage.getItem(localStorageKey);
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem(localStorageKey, userId);
    }
    return userId;
  }

  setupPowerSync = async (connector: SupabaseConnector | null) => {
    try {
      await this.db.init();
      if (connector) {
        const session = await connector.getSession();
        if (!session) {
          console.warn('No active session found for PowerSync setup - database will operate in offline mode only with local user ID: ', this.currentUserId);
          this.isReady$.next(true);
          return;
        }
        this.currentUserId = session.user.id;
        await this.db.connect(connector);
        console.log('PowerSync setup complete with user ID:', this.currentUserId);
        this.isReady$.next(true);
      } else {
        console.warn('PowerSync setup called without a connector - database will operate in offline mode only with local user ID: ', this.currentUserId);
        this.isReady$.next(true);
      }
    } catch (e) {
      console.log(e);
    }
  };
}