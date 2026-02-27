import { Component, computed, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, ChevronDown, Trash2, Pencil, Check, Undo2 } from 'lucide-angular';
import { ShoppingItem, FilterType } from '../../models';
import { ShoppingListService, ModalService } from '../../services';
import { AddItemModal, AddItemData, AddItemResult } from '../../components/add-item-modal/add-item-modal';
import { EditListModal, EditListData, EditListResult } from '../../components/edit-list-modal/edit-list-modal';

@Component({
  selector: 'app-shopping-list',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './shopping-list.html',
  styleUrl: './shopping-list.scss',
})
export class ShoppingList {
  private readonly shoppingListService = inject(ShoppingListService);
  private readonly modalService = inject(ModalService);

  // Lucide Icons
  readonly icons = { Search, ChevronDown, Trash2, Pencil, Check, Undo2 };

  // Liste Daten aus Service
  readonly listName = this.shoppingListService.listName;
  readonly listDescription = this.shoppingListService.listDescription;

  // Verfügbare Kategorien
  readonly categories = [
    'Getränke',
    'Obst & Gemüse',
    'Milchprodukte',
    'Fleisch & Fisch',
    'Backwaren',
    'Tiefkühl',
    'Süßigkeiten',
    'Haushalt',
    'Sonstiges'
  ];

  // Such- und Filter-State (lokal)
  readonly searchQuery = signal('');
  readonly activeFilter = signal<FilterType>('all');
  readonly expandedItemId = signal<string | null>(null);
  readonly selectedCategories = signal<string[]>([]);

  // Items aus Service
  readonly items = this.shoppingListService.items;

  // Computed: Kategorien die in der Liste existieren
  readonly categoriesInList = computed(() => {
    const items = this.items();
    return new Set(items.map(item => item.category));
  });

  // Computed: Sortierte Kategorien (existierende zuerst, dann nicht-existierende)
  readonly sortedCategories = computed(() => {
    const inList = this.categoriesInList();
    const existing = this.categories.filter(c => inList.has(c));
    const notExisting = this.categories.filter(c => !inList.has(c));
    return [...existing, ...notExisting];
  });

  // Computed: Hat Kategorie-Filter aktiv
  readonly hasCategoryFilter = computed(() => this.selectedCategories().length > 0);

  // Prüfen ob Kategorie in der Liste existiert
  isCategoryInList(category: string): boolean {
    return this.categoriesInList().has(category);
  }

  // Computed: Gefilterte Items
  readonly filteredItems = computed(() => {
    return this.shoppingListService.getFilteredItems(
      this.activeFilter(),
      this.searchQuery(),
      this.selectedCategories()
    );
  });

  // Computed: Counts für Tabs aus Service
  readonly allCount = this.shoppingListService.allCount;
  readonly notPurchasedCount = this.shoppingListService.notPurchasedCount;
  readonly purchasedCount = this.shoppingListService.purchasedCount;
  readonly progressPercentage = this.shoppingListService.progressPercentage;

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

  // Kategorie togglen
  toggleCategory(category: string): void {
    const current = this.selectedCategories();
    if (current.includes(category)) {
      this.selectedCategories.set(current.filter(c => c !== category));
    } else {
      this.selectedCategories.set([...current, category]);
    }
  }

  // Prüfen ob Kategorie ausgewählt ist
  isCategorySelected(category: string): boolean {
    return this.selectedCategories().includes(category);
  }

  // Item als gekauft markieren
  markAsPurchased(item: ShoppingItem): void {
    this.shoppingListService.markAsPurchased(item.id);
    this.expandedItemId.set(null);
  }

  // Item als nicht gekauft markieren
  markAsNotPurchased(item: ShoppingItem): void {
    this.shoppingListService.markAsNotPurchased(item.id);
    this.expandedItemId.set(null);
  }

  // Item bearbeiten
  async editItem(item: ShoppingItem): Promise<void> {
    const result = await this.modalService.open<AddItemData, AddItemResult>({
      component: AddItemModal,
      data: { editItem: item }
    });

    if (result && result.id) {
      this.shoppingListService.updateItem(result.id, {
        name: result.name,
        category: result.category,
        totalQuantity: result.quantity,
        info: result.info
      });
    }
    this.expandedItemId.set(null);
  }

  // Item löschen
  deleteItem(item: ShoppingItem): void {
    this.shoppingListService.deleteItem(item.id);
    this.expandedItemId.set(null);
  }

  // Prüfen ob Item gekauft ist
  isPurchased(item: ShoppingItem): boolean {
    return this.shoppingListService.isPurchased(item);
  }

  // Status Text generieren
  getStatusText(item: ShoppingItem): string {
    return this.shoppingListService.getStatusText(item);
  }

  // Listennamen und Beschreibung bearbeiten
  async editListInfo(): Promise<void> {
    const result = await this.modalService.open<EditListData, EditListResult>({
      component: EditListModal,
      data: {
        name: this.listName(),
        description: this.listDescription()
      }
    });

    if (result) {
      this.shoppingListService.updateListInfo(result.name, result.description);
    }
  }
}
