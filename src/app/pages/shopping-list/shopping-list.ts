import { Component, OnDestroy, OnInit, computed, signal, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Search, ChevronDown, Trash2, Pencil, Check, Undo2, Plus, Minus, UserPlus, Star, Coffee, Apple, Milk, Drumstick, Croissant, Snowflake, Candy, Brush, Package  } from 'lucide-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AddItemModal, AddItemData, AddItemResult } from '../../components/add-item-modal/add-item-modal';
import { EditListModal, EditListData, EditListResult } from '../../components/edit-list-modal/edit-list-modal';
import { InviteUserModal, InviteUserData, InviteUserResult } from '../../components/invite-user-modal/invite-user-modal';
import { ModalService } from '../../services/modal.service';
import { ConfirmModalService } from '../../services/confirm-modal.service';
import { ShoppingListDataService, ShoppingItemRow } from '../../services/shopping-list-data.service';
import { SupabaseConnector } from '../../services/supabase-connector';
import { FilterType } from '../../types';
import { PowerSyncService } from '../../services/powersync';
import { CurrencyService } from '../../services/currency.service';
import { FavouriteItem } from '../../models';
import { ShoppingListService } from '../../services/shopping-list.service';

@Component({
  selector: 'app-shopping-list',
  imports: [FormsModule, LucideAngularModule, ReactiveFormsModule, TranslocoModule],
  templateUrl: './shopping-list.html',
  styleUrl: './shopping-list.scss',
})
export class ShoppingList implements OnInit, OnDestroy {
  private readonly shoppingListData = inject(ShoppingListDataService);
  private readonly shoppingListService = inject(ShoppingListService);
  private readonly supabase = inject(SupabaseConnector);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly modalService = inject(ModalService);
  private readonly confirmModal = inject(ConfirmModalService);
  private readonly powerSync = inject(PowerSyncService);
  readonly currencyService = inject(CurrencyService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly transloco = inject(TranslocoService);
  private readonly items = signal<ShoppingItemRow[]>([]);
  readonly itemsLoaded = signal(false);
  readonly listName = signal(this.transloco.translate('shoppingList.defaultListName'));
  readonly listDescription = signal(this.transloco.translate('shoppingList.defaultListDescription'));
  private readonly listId = signal<bigint | null>(null);
  private isDisposed = false;
  private deleted = false;
  private stopListInfoWatch: (() => void) | null = null;
  private stopItemsWatch: (() => void) | null = null;
  readonly isOnline = signal<boolean>(navigator.onLine);

  private readonly desktopMql = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(min-width: 768px)')
    : null;
  readonly isDesktop = signal<boolean>(this.desktopMql?.matches ?? false);

  private readonly handleDesktopMediaQueryChange = (event: MediaQueryListEvent): void => {
    if (this.isDisposed) {
      return;
    }
    this.isDesktop.set(event.matches);
    if (event.matches) {
      this.expandedItemId.set(null);
    }
    this.cdr.detectChanges();
  };
  private readonly handleOnlineStatusChange = () => {
    if (this.isDisposed) {
      return;
    }
    this.isOnline.set(navigator.onLine);
    this.cdr.detectChanges();
  };

  // Lucide Icons
  readonly icons = { Search, ChevronDown, Trash2, Pencil, Check, Undo2, Plus, Minus, UserPlus, Star, Coffee, Apple, Milk, Drumstick, Croissant, Snowflake, Candy, Brush, Package };

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
  readonly showAutocomplete = signal(false);
  readonly activeFilter = signal<FilterType>('all');
  readonly expandedItemId = signal<string | null>(null);
  readonly selectedCategories = signal<string[]>([]);

  // Swipe State
  readonly swipingItemId = signal<string | null>(null);
  readonly swipeOffset = signal(0);
  private touchStartX = 0;
  private touchStartY = 0;
  private isSwiping = false;
  private readonly SWIPE_THRESHOLD = 70;

  // Category visual mapping
  getCategoryIcon(category: string): any {
    switch (category) {
      case 'Getränke': return this.icons.Coffee;
      case 'Obst & Gemüse': return this.icons.Apple;
      case 'Milchprodukte': return this.icons.Milk;
      case 'Fleisch & Fisch': return this.icons.Drumstick;
      case 'Backwaren': return this.icons.Croissant;
      case 'Tiefkühl': return this.icons.Snowflake;
      case 'Süßigkeiten': return this.icons.Candy;
      case 'Haushalt': return this.icons.Brush;
      case 'Sonstiges': return this.icons.Package;
      default: return this.icons.Package;
    }
  }

  getCategoryColor(category: string): string {
    switch (category) {
      case 'Getränke': return '#3498db'; // blue
      case 'Obst & Gemüse': return '#2ecc71'; // green
      case 'Milchprodukte': return '#f1c40f'; // yellow
      case 'Fleisch & Fisch': return '#e74c3c'; // red
      case 'Backwaren': return '#e67e22'; // orange
      case 'Tiefkühl': return '#00cec9'; // cyan
      case 'Süßigkeiten': return '#9b59b6'; // purple
      case 'Haushalt': return '#95a5a6'; // gray
      case 'Sonstiges': return '#34495e'; // dark gray
      default: return '#34495e';
    }
  }

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

  // Autocomplete und Favourites
  readonly favourites = this.shoppingListService.favourites;
  readonly isQueryEmpty = computed(() => !this.searchQuery().trim());

  readonly filteredFavourites = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const favs = this.favourites();
    if (!query) return [];
    return favs.filter((fav: FavouriteItem) => fav.name.toLowerCase().includes(query));
  });

  readonly shouldShowAutocomplete = computed(() =>
    this.showAutocomplete() && !this.isQueryEmpty() && this.filteredFavourites().length > 0
  );

  onSearchQueryChange(newQuery: string): void {
    this.searchQuery.set(newQuery);
    this.showAutocomplete.set(true);
  }

  onSearchEnter(event: Event): void {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }

    if (event.repeat) {
      return;
    }

    if (!this.hasNoResults()) {
      return;
    }

    event.preventDefault();
    this.showAutocomplete.set(false);
    void this.addNewItem(this.searchQuery());
  }

  hideAutocomplete(): void {
    this.showAutocomplete.set(false);
  }

  getFavouriteDetails(fav: FavouriteItem): string {
    const sizeStr = fav.size ? `${fav.size} ` : '';
    const unitStr = fav.unit !== 'Einheit' ? this.transloco.translate(`units.${fav.unit}`) : '';
    return `${sizeStr}${unitStr}`;
  }

  hasFavouriteDetails(fav: FavouriteItem): boolean {
    return !!(fav.size || fav.unit !== 'Einheit');
  }

  async addFavouriteItem(fav: FavouriteItem): Promise<void> {
    this.showAutocomplete.set(false);
    this.searchQuery.set('');

    const result = await this.modalService.open<AddItemData, AddItemResult>({
      component: AddItemModal,
      data: {
        prefillName: fav.name,
        prefillUnit: fav.unit,
        prefillSize: fav.size
      }
    });

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

    if (this.desktopMql) {
      this.isDesktop.set(this.desktopMql.matches);
      if (typeof this.desktopMql.addEventListener === 'function') {
        this.desktopMql.addEventListener('change', this.handleDesktopMediaQueryChange);
      } else if (typeof (this.desktopMql as unknown as { addListener?: (listener: (ev: MediaQueryListEvent) => void) => void }).addListener === 'function') {
        (this.desktopMql as unknown as { addListener: (listener: (ev: MediaQueryListEvent) => void) => void }).addListener(this.handleDesktopMediaQueryChange);
      }
    }

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
    this.stopListInfoWatch?.();
    this.stopListInfoWatch = null;
    this.stopItemsWatch?.();
    this.stopItemsWatch = null;
    window.removeEventListener('online', this.handleOnlineStatusChange);
    window.removeEventListener('offline', this.handleOnlineStatusChange);

    if (this.desktopMql) {
      if (typeof this.desktopMql.removeEventListener === 'function') {
        this.desktopMql.removeEventListener('change', this.handleDesktopMediaQueryChange);
      } else if (typeof (this.desktopMql as unknown as { removeListener?: (listener: (ev: MediaQueryListEvent) => void) => void }).removeListener === 'function') {
        (this.desktopMql as unknown as { removeListener: (listener: (ev: MediaQueryListEvent) => void) => void }).removeListener(this.handleDesktopMediaQueryChange);
      }
    }
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

    this.stopListInfoWatch?.();
    this.stopListInfoWatch = this.powerSync.watchWithCallback(sql, (result) => {
      if (this.isDisposed || this.deleted) {
        return;
      }

      const defaultName = this.transloco.translate('shoppingList.defaultListName');
      const defaultDescription = this.transloco.translate('shoppingList.defaultListDescription');

      const rows = this.toRows<{ id: bigint; name: string; description: string | null }>(result.rows);
      const list = rows[0];
      if (list) {
        this.listName.set(list.name || defaultName);
        this.listDescription.set(list.description || defaultDescription);
        this.cdr.detectChanges();
        return;
      }

      this.listName.set(defaultName);
      this.listDescription.set(defaultDescription);
      this.cdr.detectChanges();
    }, [String(listId)]);
  }

  private watchItems(): void {
    const listId = this.listId();

    this.itemsLoaded.set(false);

    if (!listId) {
      this.items.set([]);
      this.itemsLoaded.set(true);
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
        li.price_usd AS price,
        li.created_at AS createdAt,
        li.updated_at AS updatedAt
        FROM "ListItem" li 
        JOIN "Item" i ON i.id = li.item 
        LEFT JOIN "Category" c ON c.id = i.category
        WHERE li.liste = ? ORDER BY createdAt ASC`;

    this.stopItemsWatch?.();
    this.stopItemsWatch = this.powerSync.watchWithCallback(sql, (result) => {
      if (this.isDisposed || this.deleted) {
        return;
      }
      const rows = this.toRows<ShoppingItemRow>(result.rows);
      this.items.set(rows);
      this.itemsLoaded.set(true);
      this.cdr.detectChanges();
    }, [String(this.listId())]);
  }

  private toRows<T>(rows: unknown): T[] {
    if (Array.isArray(rows)) {
      return rows as T[];
    }

    if (rows && typeof rows === 'object') {
      const maybeRowList = rows as { length?: unknown; item?: unknown };
      if (typeof maybeRowList.length === 'number' && typeof maybeRowList.item === 'function') {
        const result: T[] = [];
        for (let i = 0; i < maybeRowList.length; i += 1) {
          result.push((maybeRowList.item as (index: number) => T)(i));
        }
        return result;
      }

      const maybeArray = Reflect.get(rows, '_array');
      if (Array.isArray(maybeArray)) {
        return maybeArray as T[];
      }
    }

    return [];
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
      if (result.price !== undefined && result.currency) {
        result.price = this.currencyService.convertToUsd(result.price, result.currency);
      }
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
    const editItemDisplay = {
      ...item,
      price: item.price !== undefined && item.price !== null ? this.currencyService.convertFromUsd(item.price) : undefined,
      currency: this.currencyService.currentCurrency()
    };
    const result = await this.modalService.open<AddItemData, AddItemResult>({
      component: AddItemModal,
      data: { editItem: editItemDisplay }
    });

    if (result && item.itemId) {
      if (result.price !== undefined && result.currency) {
        result.price = this.currencyService.convertToUsd(result.price, result.currency);
      }
      await this.shoppingListData.updateItemInList(item.id, item.itemId, result);
    }
    this.expandedItemId.set(null);
  }

  // Item löschen
  async deleteItem(item: ShoppingItemRow): Promise<void> {
    this.expandedItemId.set(null);

    const confirmed = await this.confirmModal.confirm({
      title: this.transloco.translate('shoppingList.confirmDeleteItemTitle'),
      message: this.transloco.translate('shoppingList.confirmDeleteItemMessage', { name: item.name }),
      confirmText: this.transloco.translate('common.delete'),
      cancelText: this.transloco.translate('common.cancel'),
    });

    if (!confirmed) {
      return;
    }

    await this.shoppingListData.deleteListItem(item.id);
  }

  // Prüfen ob Item gekauft ist
  isPurchased(item: ShoppingItemRow): boolean {
    return item.purchasedQuantity >= item.totalQuantity;
  }

  // Status Text generieren
  getStatusText(item: ShoppingItemRow): string {
    if (item.totalQuantity <= 1) {
      return this.isPurchased(item)
        ? this.transloco.translate('shoppingList.status.purchased')
        : this.transloco.translate('shoppingList.status.open');
    }
    return `${item.purchasedQuantity}/${item.totalQuantity}`;
  }

  // Listennamen und Beschreibung bearbeiten
  async editListInfo(): Promise<void> {
    const listId = this.listId();
    if (listId === null) {
      return;
    }

    const aloneInList = await this.supabase.getUserCountForList(listId) === 1;

    const result = await this.modalService.open<EditListData, EditListResult>({
      component: EditListModal,
      data: {
        name: this.listName(),
        description: this.listDescription(),
        aloneInList
      }
    });

    if (result?.action === 'save' && result.name !== undefined && result.description !== undefined) {
      await this.shoppingListData.updateListInfo(listId, result.name, result.description);
      return;
    }

    if (result?.action === 'delete' || result?.action === 'leave') {
      const confirmed = await this.confirmModal.confirm(
        result.action === 'delete'
          ? {
              title: this.transloco.translate('shoppingList.confirmDeleteListTitle'),
              message: this.transloco.translate('shoppingList.confirmDeleteListMessage', { name: this.listName() }),
              confirmText: this.transloco.translate('common.delete'),
              cancelText: this.transloco.translate('common.cancel'),
            }
          : {
              title: this.transloco.translate('shoppingList.confirmLeaveListTitle'),
              message: this.transloco.translate('shoppingList.confirmLeaveListMessage', { name: this.listName() }),
              confirmText: this.transloco.translate('shoppingList.leave'),
              cancelText: this.transloco.translate('common.cancel'),
            }
      );

      if (!confirmed) {
        return;
      }

      this.deleted = true;
      await this.router.navigate(['/lists']);

      if (result.action === 'delete') {
        console.warn('List deleted', listId);
        await this.shoppingListData.deleteList(listId);
        return;
      }

      console.warn('Left list', listId);
      await this.shoppingListData.leaveList(listId);
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
