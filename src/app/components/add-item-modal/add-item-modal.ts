import { Component, inject, signal, input, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Plus, Minus, Star } from 'lucide-angular';
import { ModalService } from '../../services/modal.service';
import { ShoppingListService } from '../../services/shopping-list.service';
import { ShoppingItem, Unit, FavouriteItem } from '../../models';

export interface AddItemData {
  editItem?: ShoppingItem;
  prefillName?: string;
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
  private readonly shoppingListService = inject(ShoppingListService);

  // Input data from modal service
  readonly data = input<AddItemData>();

  readonly icons = { X, Plus, Minus, Star };

  // Favourites
  readonly favourites = this.shoppingListService.favourites;
  readonly isCurrentFavourite = computed(() => {
    return this.shoppingListService.isCurrentFavourite(this.name(), this.unit(), this.size());
  });

  // Form State
  readonly name = signal('');
  readonly category = signal('Sonstiges');
  readonly quantity = signal(1);
  readonly info = signal('');
  readonly size = signal<number | undefined>(undefined);
  readonly unit = signal<Unit>('Einheit');

  // Edit mode
  readonly isEditMode = signal(false);
  private editItemId: string | undefined;

  // Predefined categories
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

  ngOnInit(): void {
    const inputData = this.data();
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
    } else if (inputData?.prefillName) {
      this.name.set(inputData.prefillName);
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
    if (!this.name().trim()) {
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
    if (!this.name().trim()) return;
    this.shoppingListService.toggleFavourite(this.name(), this.unit(), this.size());
  }

  selectFavourite(fav: FavouriteItem): void {
    this.name.set(fav.name);
    this.unit.set(fav.unit);
    this.size.set(fav.size);
  }
}
