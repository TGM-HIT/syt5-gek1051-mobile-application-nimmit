export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  totalQuantity: number;
  purchasedQuantity: number;
  info?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingList {
  id: string;
  name: string;
  owner: string;
  items: ShoppingItem[];
  createdAt: Date;
  updatedAt: Date;
}

export type FilterType = 'all' | 'notPurchased' | 'purchased';
