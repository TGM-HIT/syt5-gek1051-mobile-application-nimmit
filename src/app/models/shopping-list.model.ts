export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  totalQuantity: number;
  purchasedQuantity: number;
  info?: string;
  createdAt: Date;
  updatedAt: Date;
  unit: Unit;
  size? : number;
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
export type Unit = 'g' | 'dag' |'kg' | 'mL' | 'L' | 'Einheit' | 'Flasche' | 'Kiste' | 'Dose' | 'Packung' ;