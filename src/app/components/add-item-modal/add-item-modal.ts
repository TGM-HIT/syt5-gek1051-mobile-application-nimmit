import { Component, inject, signal, input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Plus, Minus } from 'lucide-angular';
import { ModalService } from '../../services/modal.service';
import { Currency, ShoppingItemRow, ShoppingListDataService, Unit } from '../../services/shopping-list-data.service';
import { Category } from '../../types';
import { PowerSyncService } from '../../services/powersync';

type EditableShoppingItem = Pick<ShoppingItemRow, 'id' | 'name' | 'category' | 'totalQuantity' | 'info' | 'size' | 'unit' | 'price' | 'currency'>;

export interface AddItemData {
  editItem?: EditableShoppingItem;
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
  price?: number;
  currency?: Currency;
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

  // Input data from modal service
  readonly data = input<AddItemData>();

  readonly icons = { X, Plus, Minus };

  // Form State
  readonly name = signal('');
  readonly category = signal('Sonstiges');
  readonly quantity = signal(1);
  readonly info = signal('');
  readonly size = signal<number | undefined>(undefined);
  readonly unit = signal<Unit>('Einheit');
  readonly currency = signal<Currency>('Euro');
  readonly price = signal<number | undefined>(undefined);

  // Edit mode
  readonly isEditMode = signal(false);
  private editItemId: string | undefined;

  // Predefined categories
  readonly categories = signal<Category[]>([{ id: BigInt(9), name: 'Sonstiges', created_at: new Date().toISOString() }]);

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

  //Verfuegbare Waehrungen
  readonly currencies: Currency[] = [
    'Euro',
    'CHF',
    'USD'
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
      unit: this.unit(),
      currency: this.currency()
    };

    this.modalService.close(result);
  }
}
