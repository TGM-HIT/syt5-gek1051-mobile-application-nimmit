
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
  id: bigint;
  created_at: Timestamp;
  name: string;
}

// ----------------------------------
// 📦 Item
// ----------------------------------
export interface Item {
  id: bigint;
  created_at: Timestamp;
  name: string;

  category: bigint; // FK → Category.id
  content?: number | null;

  description?: string | null;

  global: boolean;
  user?: UUID | null; // null wenn global
}

// ----------------------------------
// 📋 Lists
// ----------------------------------
export interface Lists {
  id: bigint;
  created_at: Timestamp;
  name: string;
  description?: string | null;
}

// ----------------------------------
// 🧾 ListItem (Composite PK)
// ----------------------------------
export interface ListItem {
  liste: bigint; // FK → Lists.id
  item: bigint;  // FK → Item.id

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
  id: bigint;
  created_at: Timestamp;
  user: UUID;
  item: bigint; // FK → Item.id
}

// ----------------------------------
// 🔗 UserLists (M:N)
// ----------------------------------
export interface UserLists {
  created_at: Timestamp;
  user: UUID;
  list: bigint;
}

// ----------------------------------
// 👤 Profile
// ----------------------------------

export interface UserSettings {
  theme: Theme;
  sync_interval: number;
}

export interface Profile {
  id: UUID;
  username: string;

  settings?: UserSettings | null;

  updated_at: Timestamp;
}