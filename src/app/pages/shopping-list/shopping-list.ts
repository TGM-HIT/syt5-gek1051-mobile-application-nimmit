import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, ChevronDown, Trash2, Pencil, Check } from 'lucide-angular';
import { ShoppingItem, FilterType } from '../../models';

@Component({
  selector: 'app-shopping-list',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './shopping-list.html',
  styleUrl: './shopping-list.scss',
})
export class ShoppingList {
  // Lucide Icons
  readonly icons = { Search, ChevronDown, Trash2, Pencil, Check };

  // Liste Daten
  readonly listName = signal('Franz Geburtstagsfreier');
  readonly ownerName = signal('Franz Geburtstagsfreier');

  // Such- und Filter-State
  readonly searchQuery = signal('');
  readonly activeFilter = signal<FilterType>('all');
  readonly expandedItemId = signal<string | null>(null);

  // Mock-Daten für die Einkaufsliste
  readonly items = signal<ShoppingItem[]>([
    {
      id: '1',
      name: 'Stiegl Alkoholfrei',
      category: 'Getränke',
      totalQuantity: 6,
      purchasedQuantity: 0,
      info: 'Bitte das grüne kaufen ty.',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Baccardi Razz',
      category: 'Getränke',
      totalQuantity: 3,
      purchasedQuantity: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      name: 'Stiegl Alkoholfrei',
      category: 'Getränke',
      totalQuantity: 6,
      purchasedQuantity: 6,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // Computed: Gefilterte Items
  readonly filteredItems = computed(() => {
    let result = this.items();
    const query = this.searchQuery().toLowerCase();

    // Suchfilter
    if (query) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    // Tab-Filter
    const filter = this.activeFilter();
    if (filter === 'notPurchased') {
      result = result.filter((item) => item.purchasedQuantity < item.totalQuantity);
    } else if (filter === 'purchased') {
      result = result.filter((item) => item.purchasedQuantity >= item.totalQuantity);
    }

    return result;
  });

  // Computed: Counts für Tabs
  readonly allCount = computed(() => this.items().length);

  readonly notPurchasedCount = computed(
    () => this.items().filter((item) => item.purchasedQuantity < item.totalQuantity).length
  );

  readonly purchasedCount = computed(
    () => this.items().filter((item) => item.purchasedQuantity >= item.totalQuantity).length
  );

  // Computed: Progress Bar Werte
  readonly progressPercentage = computed(() => {
    const total = this.allCount();
    if (total === 0) return 0;
    return (this.purchasedCount() / total) * 100;
  });

  // Item expandieren/kollabieren
  toggleExpand(itemId: string): void {
    if (this.expandedItemId() === itemId) {
      this.expandedItemId.set(null);
    } else {
      this.expandedItemId.set(itemId);
    }
  }

  isExpanded(itemId: string): boolean {
    return this.expandedItemId() === itemId;
  }

  // Filter setzen
  setFilter(filter: FilterType): void {
    this.activeFilter.set(filter);
  }

  // Item als gekauft markieren
  markAsPurchased(item: ShoppingItem): void {
    this.items.update((items) =>
      items.map((i) =>
        i.id === item.id ? { ...i, purchasedQuantity: i.totalQuantity, updatedAt: new Date() } : i
      )
    );
    this.expandedItemId.set(null);
  }

  // Item bearbeiten (placeholder)
  editItem(item: ShoppingItem): void {
    console.log('Edit item:', item);
    // TODO: Implement edit modal/page
  }

  // Item löschen
  deleteItem(item: ShoppingItem): void {
    this.items.update((items) => items.filter((i) => i.id !== item.id));
    this.expandedItemId.set(null);
  }

  // Prüfen ob Item gekauft ist
  isPurchased(item: ShoppingItem): boolean {
    return item.purchasedQuantity >= item.totalQuantity;
  }

  // Status Text generieren
  getStatusText(item: ShoppingItem): string {
    return `${item.purchasedQuantity} von ${item.totalQuantity} gekauft`;
  }
}
