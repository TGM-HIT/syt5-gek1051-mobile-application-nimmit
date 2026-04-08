import { Injectable, signal } from '@angular/core';
import { AbstractPowerSyncDatabase, Column, column, createBaseLogger, LogLevel, PowerSyncDatabase, Query, QueryResult, Schema, SyncStream, SyncStreamSubscription, Table, WASQLiteOpenFactory, WASQLiteVFS } from '@powersync/web';
import { SupabaseConnector } from './supabase-connector';
import { BehaviorSubject, filter, firstValueFrom, take } from 'rxjs';
import { Session } from '@supabase/supabase-js';

export const LISTS_TABLE = 'Lists';
export const CATEGORY_TABLE = 'Category';
export const ITEM_TABLE = 'Item';
export const FAVORITES_TABLE = 'Favorites';
export const USER_LISTS_TABLE = 'UserLists';
export const LIST_ITEMS_TABLE = 'ListItem';

const Category = new Table(
  {
    created_at: column.text,
    name: column.text
  },
  { indexes: { cid_idx: ["id"]} }
);

const Item = new Table(
  {
    created_at: column.text,
    name: column.text,
    category: column.integer,
    content: column.integer,
    description: column.text,
    global: column.integer,
    user: column.text
  },
  { indexes: { iid_idx: ["id"] } }
);

const Favorites = new Table(
  {
    created_at: column.text,
    user: column.text,
    item: column.integer
  },
  { indexes: { fid_idx: ["id"] } }
);

const UserLists = new Table(
  {
    created_at: column.text,
    user: column.text,
    list: column.integer
  },
  { indexes: { user_list_idx: ["user", "list"] } }
);

const Lists = new Table(
  {
    created_at: column.text,
    name: column.text,
    description: column.text
  },
  { indexes: { lists_idx: ["id"] } }

);

const ListItem = new Table(
  {
    liste: column.integer,
    item: column.integer,
    created_at: column.text,
    updated_at: column.text,
    curr_amount: column.integer,
    target_amount: column.integer,
    amount_unit: column.text,
    price: column.real,
    currency: column.text
  },
  { indexes: { liste_item_idx: ["liste", "item"] } }
);

export const publicSchema = new Schema({
  Category,
  Item,
  Favorites,
  UserLists,
  Lists,
  ListItem
});

export const USER_ID_PLACEHOLDER = '__USER_ID__';
export interface USER_LIST_ID_PLACEHOLDER {
  user: string, 
  list: bigint
};


@Injectable({
  providedIn: 'root'
})
export class PowerSyncService {
  db: AbstractPowerSyncDatabase;
  currentUserId!: string;
  private isReady$ = new BehaviorSubject<boolean>(false);
  public ready$ = this.isReady$.asObservable();
  public readonly error = signal<boolean>(false);

  private dbConnected = false;
  private subscribed = false;
  private syncStreamNames = ['watch_lists', 'watch_categories', "watch_items"];
  private syncStreams: SyncStreamSubscription[] = []
  private connector: SupabaseConnector | null = null;


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
    const injectedParameters = parameters.map(param => {
      if (param === USER_ID_PLACEHOLDER) {
        return this.currentUserId;
      } else if (typeof param === 'object' && param !== null && 'user' in param && 'list' in param) {
        const placeholder = param as USER_LIST_ID_PLACEHOLDER;
        if (placeholder.user === USER_ID_PLACEHOLDER) {
          return `${this.currentUserId}|${placeholder.list}`;
        } 
        return `${placeholder.user}|${placeholder.list}`;
      } 
      return param;
    });
    return this.db.execute(sql, injectedParameters);
  }

  get<T>(sql: string, parameters: unknown[] = []): Promise<T> {
    const injectedParameters = parameters.map(param => param === USER_ID_PLACEHOLDER ? this.currentUserId : param);
    return this.db.get<T>(sql, injectedParameters);
  }

  watch(sql: string, parameters: unknown[] = []): AsyncIterable<QueryResult> {
    const injectedParameters = parameters.map(param => param === USER_ID_PLACEHOLDER ? this.currentUserId : param);
    return this.db.watch(sql, injectedParameters);
  }

  query<T>(sql: string, parameters: unknown[] = []): Query<T> {
    const injectedParameters: string[] = parameters.map(param => param === USER_ID_PLACEHOLDER ? this.currentUserId : String(param));
    return this.db.query<T>({sql, parameters: injectedParameters});
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

  async subscibeAllSyncStreams() {
    if (this.subscribed) return;
    for (const streamName of this.syncStreamNames) {
      const sub = await this.db.syncStream(streamName).subscribe();
      this.syncStreams.push(sub);
    }
    this.subscribed = true;
  }

  async unsubscribeAllSyncStreams() {
    if (!this.subscribed) return;
    for (const sub of this.syncStreams) {
      sub.unsubscribe();
      this.syncStreams = this.syncStreams.filter(s => s !== sub);
    }
    this.subscribed = false;
  }

  async migrateUserIid(oldId: string, newId: string) {
    const criticalTables = ["Item", "Favorites", "UserLists"];
    for (const table of criticalTables) {
      const updateColumn = "user";
      const sql = `
        UPDATE ${table} set ${updateColumn} = ?
        Where ${updateColumn} = ?
      `;
      await this.db.execute(sql, [newId, oldId]);
    }
  }

  async connectDb(session: Session | null) {
    if (this.dbConnected) return;
    if (!this.connector) {
      console.warn('Attempted to connect Supabase database without a connector - aborting connection.');
      return;
    }
    if (!session) {
      // eslint-disable-next-line no-param-reassign
      session = await this.connector.getSession();
      if (!session) {
        console.warn('No active session found for PowerSync database connection - aborting connection.');
        return;
      }
    }
    if (this.currentUserId !== session.user.id) {
      if (this.currentUserId === null) {
        this.currentUserId = this.getOrCreateUserId();
      } else {
        this.migrateUserIid(this.currentUserId, session.user.id)
      }
    }
    await this.db.connect(this.connector);
    await this.subscibeAllSyncStreams();
    await this.db.waitForFirstSync();
    this.dbConnected = true;
  }

  async disconnectDb() {
    if (!this.dbConnected) return;
    await this.db.disconnect();
    await this.unsubscribeAllSyncStreams();
    this.dbConnected = false;
  }

  async waitForPowerSyncReady(): Promise<void> {
    await firstValueFrom(
      this.ready$.pipe(
        filter((isReady) => isReady),
        take(1)
      )
    );
  }

  toggleSignInWatcher() {
    if (!this.connector) {
      console.warn('Attempted to toggle PowerSync database connection without a connector - aborting.');
      return;
    }

    this.connector.client.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN") {
        if (!this.dbConnected) {
          if (session) {
            this.isReady$.next(false);
            await this.connectDb(session);
            this.isReady$.next(true);
          } else {            
            console.warn('Received SIGNED_IN event without a session - cannot connect to database.');
          }
        }
      } else if (event === "SIGNED_OUT") {
        if (this.dbConnected) {
          await this.disconnectDb();
        }
      }
    });
  }

  setupPowerSync = async (connector: SupabaseConnector | null) => {
    try {
      await this.db.init();
      if (connector) {
        this.connector = connector;
        const session = await connector.getSession();
        if (!session) {
          console.warn('No active session found for PowerSync setup - database will operate in offline mode only with local user ID: ', this.currentUserId);
          this.toggleSignInWatcher();
          this.isReady$.next(true);
          return;
        }
        this.currentUserId = session.user.id;
        if (navigator.onLine) {
          await this.connectDb(session);
        }
        console.log('PowerSync setup complete with user ID:', this.currentUserId);
        this.isReady$.next(true);
      } else {
        console.warn('PowerSync setup called without a connector - database will operate in offline mode only with local user ID: ', this.currentUserId);
        this.toggleSignInWatcher();
        this.isReady$.next(true);
      }
    } catch (e) {
      console.error('Error during PowerSync setup:', e); 
      this.isReady$.next(true); 
      this.error.set(true);
    }
  };
}