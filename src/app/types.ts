
export type Theme = 'light' | 'dark' | 'system';

export type FilterType = 'all' | 'notPurchased' | 'purchased';
// 🔹 Custom Types
export type UUID = string;
export type Timestamp = string;

// 👉 Passe das an dein echtes Enum an!
export type AmountUnit =
  | 'g'        // Gramm
  | 'dag'      // Dekagramm
  | 'kg'       // Kilogramm
  | 'ml'       // Milliliter
  | 'l'        // Liter
  | 'Flasche'
  | 'Einheit'
  | 'Kiste'
  | 'Dose';

// ----------------------------------
// 📂 Category
// ----------------------------------
export interface Category {
  c_id: number;
  created_at: Timestamp;
  name: string;
}

// ----------------------------------
// 📦 Item
// ----------------------------------
export interface Item {
  i_id: number;
  created_at: Timestamp;
  name: string;

  category: number; // FK → Category.c_id
  content: number;

  description?: string | null;

  global: boolean;
  user?: UUID | null; // null wenn global
}

// ----------------------------------
// 📋 Lists
// ----------------------------------
export interface Lists {
  li_id: number;
  created_at: Timestamp;
  name: string;
  description?: string | null;
}

// ----------------------------------
// 🧾 ListItem (Composite PK)
// ----------------------------------
export interface ListItem {
  liste: number; // FK → Lists.li_id
  item: number;  // FK → Item.i_id

  created_at: Timestamp;
  updated_at: Timestamp;

  target_amount: number;
  amount_unit: AmountUnit;
  curr_amount: number;
}

// ----------------------------------
// ⭐ UserFavorites
// ----------------------------------
export interface UserFavorites {
  f_id: number;
  created_at: Timestamp;

  user: UUID;
  item: number;
}

// ----------------------------------
// 🔗 UserLists (M:N)
// ----------------------------------
export interface UserLists {
  created_at: Timestamp;

  user: UUID;
  list: number;
}

// ----------------------------------
// 👤 Profile
// ----------------------------------

export interface UserSettings {
  theme: Theme;
  sync_interval: number;
}

export interface Profile {
  u_id: UUID;
  username: string;

  settings?: UserSettings | null;

  updated_at: Timestamp;
}