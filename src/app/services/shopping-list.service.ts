import { Injectable, signal, computed, effect } from '@angular/core';
import { ShoppingItem, FilterType, FavouriteItem, Unit } from '../models';
import Fuse from 'fuse.js';

interface StoredListData {
  items: ShoppingItem[];
  listName: string;
  listDescription: string;
  favourites?: FavouriteItem[];
}

const STORAGE_KEY = 'nimmit-shopping-list';

@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {
  // Haupt-Daten
  private readonly _items = signal<ShoppingItem[]>([]);
  private readonly _listName = signal('Meine Einkaufsliste');
  private readonly _listDescription = signal('Tippe auf +, um Produkte hinzuzufügen');
  private readonly _favourites = signal<FavouriteItem[]>([]);

  // Public readonly signals
  readonly items = this._items.asReadonly();
  readonly listName = this._listName.asReadonly();
  readonly listDescription = this._listDescription.asReadonly();
  readonly favourites = this._favourites.asReadonly();

  constructor() {
    this.loadFromStorage();

    // Auto-save bei Änderungen
    effect(() => {
      const data: StoredListData = {
        items: this._items(),
        listName: this._listName(),
        listDescription: this._listDescription(),
        favourites: this._favourites()
      };
      this.saveToStorage(data);
    });
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredListData = JSON.parse(stored);
        // Dates wiederherstellen
        const items = data.items.map(item => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt)
        }));
        this._items.set(items);
        this._listName.set(data.listName || 'Meine Einkaufsliste');
        this._listDescription.set(data.listDescription || 'Tippe auf +, um Produkte hinzuzufügen');
        if (data.favourites) {
          this._favourites.set(data.favourites);
        }
      }
    } catch (e) {
      console.error('Fehler beim Laden der Daten:', e);
    }
  }

  private saveToStorage(data: StoredListData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Fehler beim Speichern der Daten:', e);
    }
  }

  // Computed values
  readonly allCount = computed(() => this._items().length);

  readonly notPurchasedCount = computed(
    () => this._items().filter((item) => item.purchasedQuantity < item.totalQuantity).length
  );

  readonly purchasedCount = computed(
    () => this._items().filter((item) => item.purchasedQuantity >= item.totalQuantity).length
  );

  readonly progressPercentage = computed(() => {
    const total = this.allCount();
    if (total === 0) return 0;
    return (this.purchasedCount() / total) * 100;
  });

  /**
   * Fügt ein neues Item zur Liste hinzu
   */
  addItem(item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt' | 'purchasedQuantity'>): void {
    const newItem: ShoppingItem = {
      ...item,
      id: crypto.randomUUID(),
      purchasedQuantity: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this._items.update(items => [...items, newItem]);
  }

  /**
   * Markiert ein Item als gekauft
   */
  markAsPurchased(itemId: string): void {
    this._items.update(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, purchasedQuantity: item.totalQuantity, updatedAt: new Date() }
          : item
      )
    );
  }

  /**
   * Markiert ein Item als nicht gekauft
   */
  markAsNotPurchased(itemId: string): void {
    this._items.update(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, purchasedQuantity: 0, updatedAt: new Date() }
          : item
      )
    );
  }

  /**
   * Erhöht die eingekaufte Menge um 1
   */
  incrementPurchasedQuantity(itemId: string): void {
    this._items.update(items =>
      items.map(item =>
        item.id === itemId && item.purchasedQuantity < item.totalQuantity
          ? { ...item, purchasedQuantity: item.purchasedQuantity + 1, updatedAt: new Date() }
          : item
      )
    );
  }

  /**
   * Verringert die eingekaufte Menge um 1
   */
  decrementPurchasedQuantity(itemId: string): void {
    this._items.update(items =>
      items.map(item =>
        item.id === itemId && item.purchasedQuantity > 0
          ? { ...item, purchasedQuantity: item.purchasedQuantity - 1, updatedAt: new Date() }
          : item
      )
    );
  }

  /**
   * Aktualisiert ein Item
   */
  updateItem(itemId: string, updates: Partial<ShoppingItem>): void {
    this._items.update(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, ...updates, updatedAt: new Date() }
          : item
      )
    );
  }

  /**
   * Löscht ein Item
   */
  deleteItem(itemId: string): void {
    this._items.update(items => items.filter(item => item.id !== itemId));
  }

  /**
   * Filtert Items basierend auf Filter-Typ, Suchbegriff und Kategorien
   */

  getFilteredItems(filter: FilterType, searchQuery: string, selectedCategories: string[] = []): ShoppingItem[] {
    const fuse = new Fuse<ShoppingItem>(this._items(), {
      keys: ['name', 'category'],
      threshold: 0.4,
    });

    let result: ShoppingItem[] = searchQuery
      ? fuse.search(searchQuery).map(r => r.item)
      : this._items();

    // Kategorie-Filter
    if (selectedCategories.length > 0) {
      result = result.filter((item: ShoppingItem) => selectedCategories.includes(item.category));
    }

    // Tab-Filter
    if (filter === 'notPurchased') {
      result = result.filter((item: ShoppingItem) => item.purchasedQuantity < item.totalQuantity);
    } else if (filter === 'purchased') {
      result = result.filter((item: ShoppingItem) => item.purchasedQuantity >= item.totalQuantity);
    }

    return result;
  }

  /**
   * Prüft ob ein Item gekauft ist
   */
  isPurchased(item: ShoppingItem): boolean {
    return item.purchasedQuantity >= item.totalQuantity;
  }

  /**
   * Generiert den Status-Text
   */
  getStatusText(item: ShoppingItem): string {
    return `${item.purchasedQuantity} von ${item.totalQuantity} gekauft`;
  }

  /**
   * Aktualisiert Listennamen und Beschreibung
   */
  updateListInfo(name: string, description: string): void {
    this._listName.set(name);
    this._listDescription.set(description);
  }

  // --- Favourites ---

  /**
   * Toggles a favourite item. If it exists, removes it. If it doesn't, adds it.
   */
  toggleFavourite(name: string, category: string, unit: Unit, size?: number): void {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const existingId = this.findFavouriteId(trimmedName, unit, size);

    if (existingId) {
      this.removeFavourite(existingId);
    } else {
      this.addFavourite(trimmedName, category, unit, size);
    }
  }

  addFavourite(name: string, category: string, unit: Unit, size?: number): void {
    const newFav: FavouriteItem = {
      id: crypto.randomUUID(),
      name,
      category,
      unit,
      size
    };
    this._favourites.update(favs => [...favs, newFav]);
  }

  removeFavourite(id: string): void {
    this._favourites.update(favs => favs.filter(f => f.id !== id));
  }

  updateFavourite(id: string, updates: Partial<FavouriteItem>): void {
    this._favourites.update(favs =>
      favs.map(fav => (fav.id === id ? { ...fav, ...updates } : fav))
    );
  }

  /**
   * Helper to find if a specific combination of name/unit/size is already a favourite
   */
  findFavouriteId(name: string, unit: Unit, size?: number): string | undefined {
    const trimmedName = name.trim().toLowerCase();
    const existing = this._favourites().find(f =>
      f.name.toLowerCase() === trimmedName &&
      f.unit === unit &&
      f.size === size
    );
    return existing?.id;
  }

  isCurrentFavourite(name: string, unit: Unit, size?: number): boolean {
    return !!this.findFavouriteId(name, unit, size);
  }
}
