import { Component, computed, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, ChevronDown, Trash2, Pencil, Check, Undo2, Plus, Minus } from 'lucide-angular';
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
  readonly icons = { Search, ChevronDown, Trash2, Pencil, Check, Undo2, Plus, Minus };

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

  // Swipe State
  readonly swipingItemId = signal<string | null>(null);
  readonly swipeOffset = signal<number>(0);
  private touchStartX = 0;
  private touchStartY = 0;
  private isSwiping = false;
  private readonly SWIPE_THRESHOLD = 70;

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

  // Computed: Keine Ergebnisse gefunden
  readonly hasNoResults = computed(() => {
    return this.searchQuery().trim().length > 0 && this.filteredItems().length === 0;
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

  // Swipe Handling
  onTouchStart(event: TouchEvent, itemId: string): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.isSwiping = false;
    this.swipingItemId.set(itemId);
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.swipingItemId()) return;

    const deltaX = event.touches[0].clientX - this.touchStartX;
    const deltaY = event.touches[0].clientY - this.touchStartY;

    // Wenn vertikales Scrollen stärker ist, abbrechen
    if (!this.isSwiping && Math.abs(deltaY) > Math.abs(deltaX)) {
      this.resetSwipe();
      return;
    }

    // Horizontales Swipen aktivieren
    if (Math.abs(deltaX) > 10) {
      this.isSwiping = true;
    }

    if (this.isSwiping) {
      event.preventDefault();
      // Limit swipe offset
      const maxOffset = 70;
      const offset = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
      this.swipeOffset.set(offset);
    }
  }

  onTouchEnd(item: ShoppingItem): void {
    const offset = this.swipeOffset();
    
    if (Math.abs(offset) >= this.SWIPE_THRESHOLD) {
      if (this.isPurchased(item)) {
        // Für gekaufte Items: links = undo, rechts = delete
        if (offset > 0) {
          // Swipe right - delete
          this.shoppingListService.deleteItem(item.id);
        } else {
          // Swipe left - mark as not purchased
          this.shoppingListService.markAsNotPurchased(item.id);
        }
      } else {
        // Für nicht gekaufte Items: links = purchased, rechts = delete
        if (offset > 0) {
          // Swipe right - delete
          this.shoppingListService.deleteItem(item.id);
        } else {
          // Swipe left - mark as purchased
          this.shoppingListService.markAsPurchased(item.id);
        }
      }
    }
    
    this.resetSwipe();
  }

  private resetSwipe(): void {
    this.swipingItemId.set(null);
    this.swipeOffset.set(0);
    this.isSwiping = false;
  }

  getSwipeTransform(itemId: string): string {
    if (this.swipingItemId() === itemId) {
      return `translateX(${this.swipeOffset()}px)`;
    }
    return 'translateX(0)';
  }

  isSwipingLeft(itemId: string): boolean {
    return this.swipingItemId() === itemId && this.swipeOffset() < -20;
  }

  isSwipingRight(itemId: string): boolean {
    return this.swipingItemId() === itemId && this.swipeOffset() > 20;
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

  // Eingekaufte Menge erhöhen
  incrementQuantity(item: ShoppingItem): void {
    this.shoppingListService.incrementPurchasedQuantity(item.id);
  }

  // Eingekaufte Menge verringern
  decrementQuantity(item: ShoppingItem): void {
    this.shoppingListService.decrementPurchasedQuantity(item.id);
  }

  // Neues Item hinzufügen
  async addNewItem(prefillName?: string): Promise<void> {
    const result = await this.modalService.open<AddItemData, AddItemResult>({
      component: AddItemModal,
      data: { prefillName }
    });

    if (result) {
      this.shoppingListService.addItem({
        name: result.name,
        category: result.category,
        totalQuantity: result.quantity,
        info: result.info,
        size: result.size,
        unit: result.unit
      });
    }
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
        info: result.info,
        size: result.size,
        unit: result.unit
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
