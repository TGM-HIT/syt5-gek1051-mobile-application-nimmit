import { Component, inject, signal, input, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Plus, Minus, Star } from 'lucide-angular';
import { ModalService } from '../../services/modal.service';
import { ShoppingItemRow, ShoppingListDataService, Unit } from '../../services/shopping-list-data.service';
import { Category } from '../../types';
import { PowerSyncService } from '../../services/powersync';
import { ShoppingListService } from '../../services/shopping-list.service';
import { FavouriteItem } from '../../models';

type EditableShoppingItem = Pick<ShoppingItemRow, 'id' | 'name' | 'category' | 'totalQuantity' | 'info' | 'size' | 'unit'>;

export interface AddItemData {
  editItem?: EditableShoppingItem;
  prefillName?: string;
  prefillUnit?: Unit;
  prefillSize?: number;
}

export interface AddItemResult {
  id?: string; // Falls wir ein existierendes Item bearbeiten
  name: string;
  category: string;
  quantity: number;
  info?: string;
  size?: number;
  unit: Unit;
}

@Component({
  selector: 'app-add-item-modal',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './add-item-modal.html',
  styleUrl: './add-item-modal.scss',
})
export class AddItemModal implements OnInit {
  private readonly modalService = inject(ModalService);

  private readonly shoppingListDataService = inject(ShoppingListDataService);
  private readonly shoppingListService = inject(ShoppingListService);
  // Input data from modal service
  readonly data = input<AddItemData>();

  readonly icons = { X, Plus, Minus, Star };

  // Favourites
  readonly favourites = this.shoppingListService.favourites;
  readonly isCurrentFavourite = computed(() => {
    return this.shoppingListService.isCurrentFavourite(this.name(), this.unit(), this.size());
  });

  readonly filteredFavourites = computed(() => {
    const query = this.name().toLowerCase().trim();
    const favs = this.favourites();
    if (!query) {
      return favs;
    }
    return favs.filter((fav: FavouriteItem) => fav.name.toLowerCase().includes(query));
  });

  // Form State
  readonly name = signal('');
  readonly showAutocomplete = signal(false);
  readonly isNameEmpty = computed(() => !this.name().trim());

  readonly shouldShowAutocomplete = computed(() =>
    this.showAutocomplete() && !this.isNameEmpty() && this.filteredFavourites().length > 0
  );

  readonly shouldShowFavouritesList = computed(() =>
    this.isNameEmpty() && this.favourites().length > 0
  );

  readonly category = signal('Sonstiges');
  readonly quantity = signal(1);
  readonly info = signal('');
  readonly size = signal<number | undefined>(undefined);
  readonly unit = signal<Unit>('Einheit');

  // Edit mode
  readonly isEditMode = signal(false);
  private editItemId: string | undefined;

  readonly modalTitle = computed(() => this.isEditMode() ? 'Produkt bearbeiten' : 'Produkt hinzufügen');
  readonly submitButtonText = computed(() => this.isEditMode() ? 'Speichern' : 'Hinzufügen');

  // Predefined categories
  readonly categories = signal<Category[]>([{id: BigInt(9), name: 'Sonstiges', created_at: new Date().toISOString()}]);

  // Verfügbare Units
  readonly units: Unit[] = [
    'Einheit',
    'g',
    'dag',
    'kg',
    'mL',
    'L',
    'Flasche',
    'Kiste',
    'Dose',
    'Packung'
  ];

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async ngOnInit(): Promise<void> {
    const inputData = this.data();
    this.categories.set(await this.shoppingListDataService.getCategories()); 
    if (inputData?.editItem) {
      const item = inputData.editItem;
      this.isEditMode.set(true);
      this.editItemId = item.id;
      this.name.set(item.name);
      this.category.set(item.category);
      this.quantity.set(item.totalQuantity);
      this.info.set(item.info || '');
      this.size.set(item.size);
      this.unit.set(item.unit || 'Einheit');
    } else if (inputData) {
      if (inputData.prefillName) {
        this.name.set(inputData.prefillName);
      }
      if (inputData.prefillUnit) {
        this.unit.set(inputData.prefillUnit);
      }
      if (inputData.prefillSize !== undefined) {
        this.size.set(inputData.prefillSize);
      }
    }
  }

  close(): void {
    this.modalService.dismiss();
  }

  incrementQuantity(): void {
    this.quantity.update(q => q + 1);
  }

  decrementQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  submit(): void {
    if (this.isNameEmpty()) {
      return;
    }

    const result: AddItemResult = {
      id: this.editItemId,
      name: this.name().trim(),
      category: this.category(),
      quantity: this.quantity(),
      info: this.info().trim() || undefined,
      size: this.size() || undefined,
      unit: this.unit()
    };

    this.modalService.close(result);
  }

  toggleFavourite(): void {
    if (this.isNameEmpty()) return;
    this.shoppingListService.toggleFavourite(this.name(), this.category(), this.unit(), this.size());
  }

  getFavouriteDetails(fav: FavouriteItem): string {
    const sizeStr = fav.size ? `${fav.size} ` : '';
    const unitStr = fav.unit !== 'Einheit' ? fav.unit : '';
    return `${sizeStr}${unitStr}`;
  }

  hasFavouriteDetails(fav: FavouriteItem): boolean {
    return !!(fav.size || fav.unit !== 'Einheit');
  }

  selectFavourite(fav: FavouriteItem): void {
    this.name.set(fav.name);
    this.unit.set(fav.unit);
    this.size.set(fav.size);
    this.showAutocomplete.set(false);
  }

  onNameChange(newName: string): void {
    this.name.set(newName);
    this.showAutocomplete.set(true);
  }

  hideAutocomplete(): void {
    this.showAutocomplete.set(false);
  }
}
