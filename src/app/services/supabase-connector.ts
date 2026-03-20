import { Injectable } from '@angular/core';
import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
  UpdateType,
  type PowerSyncCredentials
} from '@powersync/web';

import { Session, SupabaseClient, User, createClient } from '@supabase/supabase-js';
import { Profile } from '../types';
import { environment } from '../../environments/environment';

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  powersyncUrl: string;
};

/// Postgres Response codes that we cannot recover from by retrying.
const FATAL_RESPONSE_CODES = [
  // Class 22 — Data Exception
  // Examples include data type mismatch.
  /^22...$/,
  // Class 23 — Integrity Constraint Violation.
  // Examples include NOT NULL, FOREIGN KEY and UNIQUE violations.
  /^23...$/,
  // INSUFFICIENT PRIVILEGE - typically a row-level security violation
  /^42501$/
];


@Injectable({
  providedIn: 'root'
})
export class SupabaseConnector implements PowerSyncBackendConnector {
  readonly client: SupabaseClient;
  readonly config: SupabaseConfig;

  constructor() {
    this.config = {
      supabaseUrl: environment.supabaseUrl,
      powersyncUrl: environment.powersyncUrl,
      supabaseAnonKey: environment.supabaseKey
    };

    this.client = createClient(this.config.supabaseUrl, this.config.supabaseAnonKey);
  }

  async getSession(): Promise<Session | null> {
    const { data, error } = await this.client.auth.getSession();
    if (!error && data.session && data.session.user.id) {
      return data.session;
    }
    return null;
  }


  async getCurrentUser(): Promise<User | null> {
    const data = await this.getSession()
    if (!data) {
      console.log('No active session found returning null');
      return null;
    }
    if (!data.user) {
      console.log('No user is currently authenticated');
      return null;
    }
    return data.user;
  }

  async login(email: string, password: string) {
    const result = await this.client.auth.signInWithPassword({ email, password });
    if (result.error) {
      throw new Error(result.error.message);
    }

    return !!result.data.session?.access_token;
  }

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('u_id', userId)
      .maybeSingle<Profile>();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return data;
  }

  async register(email: string, username: string, password: string): Promise<User | null> {
    const { data, error } = await this.client.auth.signUp({
      email,
      password
    });

    if (error) {
      throw error;
    }
    const userId = data.user?.id;

    if (!userId) {
      throw new Error('User ID not found after registration.');
    }

    const profile: Profile = {
      u_id: userId,
      username: username.trim(),
      settings: {
        theme: 'system',
        sync_interval: 15,
      },
      updated_at: new Date().toISOString()
    };

    const { error: profileError } = await this.client.from('profiles').insert(profile);

    if (profileError) {
      throw profileError;
    }

    return data.user;
  }

  async updateProfile(
    userId: string,
    payload: { username: string; sync_interval: number },
  ): Promise<Profile> {
    const existingProfile = await this.getProfile(userId);

    if (!existingProfile) {
      throw new Error('Profil nicht gefunden.');
    }

    const { data, error } = await this.client
      .from('profiles')
      .update({
        username: payload.username.trim(),
        settings: {
          ...existingProfile.settings,
          sync_interval: payload.sync_interval,
        },
      })
      .eq('u_id', userId)
      .select('u_id, username, settings, updated_at')
      .single<Profile>();

    if (error) {
      throw error;
    }

    return data;
  }

  async logout() {
    await this.client.auth.signOut();
  }

  async fetchCredentials() {
    const {
      data: { session },
      error
    } = await this.client.auth.getSession();

    if (!session || error) {
      throw new Error(`Could not fetch Supabase credentials: ${error}`);
    }

    console.debug('session expires at', session.expires_at);

    return {
      endpoint: this.config.powersyncUrl,
      token: session.access_token ?? ''
    } satisfies PowerSyncCredentials;
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) {
      return;
    }

    let lastOp: CrudEntry | null = null;
    try {
      // Note: If transactional consistency is important, use database functions
      // or edge functions to process the entire transaction in a single call.
      for (const op of transaction.crud) {
        lastOp = op;
        const table = this.client.from(op.table);
        let result: any;
        switch (op.op) {
          case UpdateType.PUT:
            { const record = { ...op.opData, id: op.id };
            result = await table.upsert(record);
            break; }
          case UpdateType.PATCH:
            result = await table.update(op.opData).eq('id', op.id);
            break;
          case UpdateType.DELETE:
            result = await table.delete().eq('id', op.id);
            break;
        }

        if (result.error) {
          console.error(result.error);
          result.error.message = `Could not update Supabase. Received error: ${result.error.message}`;
          throw result.error;
        }
      }

      await transaction.complete();
    } catch (ex: any) {
      console.debug(ex);
      if (typeof ex.code === 'string' && FATAL_RESPONSE_CODES.some((regex) => regex.test(ex.code))) {
        /**
         * Instead of blocking the queue with these errors,
         * discard the (rest of the) transaction.
         *
         * Note that these errors typically indicate a bug in the application.
         * If protecting against data loss is important, save the failing records
         * elsewhere instead of discarding, and/or notify the user.
         */
        console.error('Data upload error - discarding:', lastOp, ex);
        await transaction.complete();
      } else {
        // Error may be retryable - e.g. network error or temporary server error.
        // Throwing an error here causes this call to be retried after a delay.
        throw ex;
      }
    }
  }

}