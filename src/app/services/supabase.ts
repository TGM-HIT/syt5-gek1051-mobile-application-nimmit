import { Injectable } from '@angular/core';
import {
  AuthChangeEvent,
  createClient,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Theme } from './theme.service';

export interface UserSettings {
  theme: Theme;
  sync_interval: number;
}

export interface Profile {
  u_id?: string;
  username: string;
  settings: UserSettings;
  updated_at?: Date;
}

interface ProfileRow {
  u_id: string;
  username: string;
  settings: UserSettings | null;
  updated_at: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
    return data;
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }

  async register(email: string, username: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    const userId = data.user?.id;
    if (!userId) {
      throw new Error('Registrierung erfolgreich, aber keine User-ID erhalten.');
    }

    const profile: Profile = {
      u_id: userId,
      username: username.trim(),
      settings: {
        theme: 'system',
        sync_interval: 15,
      },
    };

    const { error: profileError } = await this.supabase.from('profiles').insert(profile);

    if (profileError) {
      throw profileError;
    }

    return data;
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: sessionData, error: sessionError } = await this.supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (sessionData.session?.user) {
      return sessionData.session.user;
    }

    const { data, error } = await this.supabase.auth.getUser();

    if (error) {
      throw error;
    }

    return data.user;
  }

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('u_id, username, settings, updated_at')
      .eq('u_id', userId)
      .maybeSingle<ProfileRow>();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return this.mapProfile(data);
  }

  async updateProfile(
    userId: string,
    payload: { username: string; sync_interval: number },
  ): Promise<Profile> {
    const existingProfile = await this.getProfile(userId);

    if (!existingProfile) {
      throw new Error('Profil nicht gefunden.');
    }

    const { data, error } = await this.supabase
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
      .single<ProfileRow>();

    if (error) {
      throw error;
    }

    return this.mapProfile(data);
  }

  private mapProfile(profileRow: ProfileRow): Profile {
    return {
      u_id: profileRow.u_id,
      username: profileRow.username,
      settings: {
        theme: profileRow.settings?.theme ?? 'system',
        sync_interval: profileRow.settings?.sync_interval ?? 15,
      },
      updated_at: profileRow.updated_at ? new Date(profileRow.updated_at) : undefined,
    };
  }
}
