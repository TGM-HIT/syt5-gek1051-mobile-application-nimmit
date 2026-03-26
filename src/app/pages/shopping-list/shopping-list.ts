import { Component, OnDestroy, OnInit, computed, signal, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Search, ChevronDown, Trash2, Pencil, Check, Undo2, Plus, Minus, UserPlus } from 'lucide-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { AddItemModal, AddItemData, AddItemResult } from '../../components/add-item-modal/add-item-modal';
import { EditListModal, EditListData, EditListResult } from '../../components/edit-list-modal/edit-list-modal';
import { InviteUserModal, InviteUserData, InviteUserResult } from '../../components/invite-user-modal/invite-user-modal';
import { ModalService } from '../../services/modal.service';
import { ShoppingListDataService, ShoppingItemRow } from '../../services/shopping-list-data.service';
import { SupabaseConnector } from '../../services/supabase-connector';
import { FilterType } from '../../types';
import { PowerSyncService } from '../../services/powersync';

@Component({
  selector: 'app-shopping-list',
  imports: [FormsModule, LucideAngularModule, ReactiveFormsModule],
  templateUrl: './shopping-list.html',
  styleUrl: './shopping-list.scss',
})
export class ShoppingList implements OnInit, OnDestroy {
  private readonly shoppingListData = inject(ShoppingListDataService);
  private readonly supabase = inject(SupabaseConnector);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly modalService = inject(ModalService);
  private readonly powerSync = inject(PowerSyncService);
  private readonly items = signal<ShoppingItemRow[]>([]);
  readonly listName = signal('Meine Einkaufsliste');
  readonly listDescription = signal('Tippe auf +, um Produkte hinzuzufuegen');
  private readonly listId = signal<bigint | null>(null);
  private isDisposed = false;
  private deleted = false;
  readonly isOnline = signal<boolean>(navigator.onLine);
  private readonly handleOnlineStatusChange = () => {
    this.isOnline.set(navigator.onLine);
  };

  // Lucide Icons
  readonly icons = { Search, ChevronDown, Trash2, Pencil, Check, Undo2, Plus, Minus, UserPlus };

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
    const activeFilter = this.activeFilter();
    const search = this.searchQuery().trim().toLowerCase();
    const selectedCategories = this.selectedCategories();

    return this.items().filter((item) => {
      if (activeFilter === 'purchased' && !this.isPurchased(item)) {
        return false;
      }
      if (activeFilter === 'notPurchased' && this.isPurchased(item)) {
        return false;
      }

      if (selectedCategories.length > 0 && !selectedCategories.includes(item.category)) {
        return false;
      }

      if (!search) {
        return true;
      }
      return (
        item.name.toLowerCase().includes(search)
        || item.category.toLowerCase().includes(search)
        || (item.info?.toLowerCase().includes(search) ?? false)
      );
    });
  });

  // Computed: Keine Ergebnisse gefunden
  readonly hasNoResults = computed(() => {
    return this.searchQuery().trim().length > 0 && this.filteredItems().length === 0;
  });

  // Computed: Counts für Tabs aus Service
  readonly allCount = computed(() => this.items().length);
  readonly purchasedCount = computed(() => this.items().filter((item) => this.isPurchased(item)).length);
  readonly notPurchasedCount = computed(() => this.items().filter((item) => !this.isPurchased(item)).length);
  readonly progressPercentage = computed(() => {
    const total = this.allCount();
    if (total === 0) {
      return 0;
    }
    return Math.round((this.purchasedCount() / total) * 100);
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async ngOnInit() {
    window.addEventListener('online', this.handleOnlineStatusChange);
    window.addEventListener('offline', this.handleOnlineStatusChange);

    await this.resolveListId();
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.powerSync.ready$.subscribe(async initialized => {
      if (initialized) {
        await this.watchListInfo();
        this.watchItems();
      }
    });
  }

  ngOnDestroy(): void {
    this.isDisposed = true;
    window.removeEventListener('online', this.handleOnlineStatusChange);
    window.removeEventListener('offline', this.handleOnlineStatusChange);
  }

  private async resolveListId(): Promise<void> {
    const listIdParam = this.route.snapshot.queryParamMap.get('listId');
    const parsed = listIdParam ? BigInt(listIdParam) : BigInt(-1);

    if (parsed > BigInt(-1)) {
      this.listId.set(parsed);
      return;
    }

    const session = await this.supabase.getSession();
    const userId = session?.user.id;

    if (!userId) {
      return;
    }

    const latestListId = await this.shoppingListData.getLatestListIdForUser(userId);
    this.listId.set(latestListId);
  }

  private async watchListInfo(): Promise<void> {
    const listId = this.listId();

    if (!listId) {
      return;
    }

    const sql = `
      SELECT id, name, description FROM "Lists" where id = ?`;

    
    this.powerSync.watchWithCallback(sql, (result) => {
      if (this.deleted) {
        return;
      }
      // eslint-disable-next-line no-underscore-dangle
      if (result.rows?._array) {
        // eslint-disable-next-line no-underscore-dangle
        const list = result.rows._array[0] as { id: bigint, name: string, description: string };
        this.listName.set(list.name || 'Meine Einkaufsliste');
        this.listDescription.set(list.description || 'Tippe auf +, um Produkte hinzuzufuegen');
      } else {

      this.listName.set('Meine Einkaufsliste');
      this.listDescription.set('Tippe auf +, um Produkte hinzuzufuegen');
      }
    }, [listId]);
  }

  private watchItems(): void {
    const listId = this.listId();

    if (!listId) {
      this.items.set([]);
      return;
    }

    const sql = `SELECT 
        li.id,
        li.item AS itemId,
        i.name,
        COALESCE(c.name, 'Sonstiges') AS category,
        li.target_amount AS totalQuantity,
        li.curr_amount AS purchasedQuantity,
        i.description AS info,
        i.content AS size,
        li.amount_unit AS unit,
        li.created_at AS createdAt,
        li.updated_at AS updatedAt
        FROM "ListItem" li 
        JOIN "Item" i ON i.id = li.item 
        LEFT JOIN "Category" c ON c.id = i.category
        WHERE li.liste = ? ORDER BY createdAt ASC`;

    this.powerSync.watchWithCallback(sql, (result) => {
      // eslint-disable-next-line no-underscore-dangle
      if (result.rows?._array) {
        // eslint-disable-next-line no-underscore-dangle
        this.items.set(result.rows._array as ShoppingItemRow[]);
      } else {
        this.items.set([]);
      }
    }, [this.listId()]);
  }



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

  onTouchEnd(item: ShoppingItemRow): void {
    const offset = this.swipeOffset();
    
    if (Math.abs(offset) >= this.SWIPE_THRESHOLD) {
      if (this.isPurchased(item)) {
        // Für gekaufte Items: links = undo, rechts = delete
        if (offset > 0) {
          // Swipe right - delete
          void this.shoppingListData.deleteListItem(item.id);
        } else {
          // Swipe left - mark as not purchased
          void this.shoppingListData.setPurchasedQuantity(item.id, 0);
        }
      } else {
        // Für nicht gekaufte Items: links = purchased, rechts = delete
        if (offset > 0) {
          // Swipe right - delete
          void this.shoppingListData.deleteListItem(item.id);
        } else {
          // Swipe left - mark as purchased
          void this.shoppingListData.setPurchasedQuantity(item.id, item.totalQuantity);
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
  markAsPurchased(item: ShoppingItemRow): void {
    void this.shoppingListData.setPurchasedQuantity(item.id, item.totalQuantity);
    this.expandedItemId.set(null);
  }

  // Item als nicht gekauft markieren
  markAsNotPurchased(item: ShoppingItemRow): void {
    void this.shoppingListData.setPurchasedQuantity(item.id, 0);
    this.expandedItemId.set(null);
  }

  // Eingekaufte Menge erhöhen
  incrementQuantity(item: ShoppingItemRow): void {
    const nextAmount = Math.min(item.totalQuantity, item.purchasedQuantity + 1);
    void this.shoppingListData.setPurchasedQuantity(item.id, nextAmount);
  }

  // Eingekaufte Menge verringern
  decrementQuantity(item: ShoppingItemRow): void {
    const nextAmount = Math.max(0, item.purchasedQuantity - 1);
    void this.shoppingListData.setPurchasedQuantity(item.id, nextAmount);
  }

  // Neues Item hinzufügen
  async addNewItem(prefillName?: string): Promise<void> {
    const result = await this.modalService.open<AddItemData, AddItemResult>({
      component: AddItemModal,
      data: { prefillName }
    }).finally(() => {this.searchQuery.set('');});

    const listId = this.listId();
    if (result && listId !== null) {
      const user = await this.supabase.getCurrentUser();
      if (!user) {
        await this.shoppingListData.addItemToList(listId, result, null);
        return;
      }
      await this.shoppingListData.addItemToList(listId, result, user.id);
    }
  }

  // Item bearbeiten
  async editItem(item: ShoppingItemRow): Promise<void> {
    const result = await this.modalService.open<AddItemData, AddItemResult>({
      component: AddItemModal,
      data: { editItem: item }
    });

    if (result && item.itemId) {
      await this.shoppingListData.updateItemInList(item.id, item.itemId, result);
    }
    this.expandedItemId.set(null);
  }

  // Item löschen
  deleteItem(item: ShoppingItemRow): void {
    void this.shoppingListData.deleteListItem(item.id);
    this.expandedItemId.set(null);
  }

  // Prüfen ob Item gekauft ist
  isPurchased(item: ShoppingItemRow): boolean {
    return item.purchasedQuantity >= item.totalQuantity;
  }

  // Status Text generieren
  getStatusText(item: ShoppingItemRow): string {
    if (item.totalQuantity <= 1) {
      return this.isPurchased(item) ? 'Eingekauft' : 'Offen';
    }
    return `${item.purchasedQuantity}/${item.totalQuantity}`;
  }

  // Listennamen und Beschreibung bearbeiten
  async editListInfo(): Promise<void> {
    const aloneInList = await this.supabase.getUserCountForList(this.listId() ?? BigInt(-1)) === 1;

    const result = await this.modalService.open<EditListData, EditListResult>({
      component: EditListModal,
      data: {
        name: this.listName(),
        description: this.listDescription(),
        aloneInList
      }
    });

    const listId = this.listId();
    if (result?.action === 'save' && listId !== null && result.name !== undefined && result.description !== undefined) {
      await this.shoppingListData.updateListInfo(listId, result.name, result.description);
      return;
    }

    if (result?.action === 'delete' && listId !== null) {
      this.deleted = true;
      await this.router.navigate(['/lists']);
      console.warn("List deleted", listId);
      await this.shoppingListData.deleteList(listId);
    }
  }

  async openInviteModal(): Promise<void> {
    if (!this.isOnline()) {
      return;
    }

    const listId = this.listId();
    if (!listId) {
      return;
    }
    const currentUsers = await this.supabase.getUsersForList(listId);
    const inviterEmail = (await this.supabase.getSession())?.user.email ?? '';
    await this.modalService.open<InviteUserData, InviteUserResult>({
      component: InviteUserModal,
      data: {
        listId,
        inviterEmail,
        currentUsers
      },
    });
  }
}
