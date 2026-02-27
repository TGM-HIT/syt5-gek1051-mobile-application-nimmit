import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, List, Users, Settings, Plus } from 'lucide-angular';
import { ModalService, ShoppingListService } from '../services';
import { AddItemModal, AddItemResult } from '../components/add-item-modal/add-item-modal';

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './navigation.html',
  styleUrl: './navigation.scss',
})
export class Navigation {
  private readonly modalService = inject(ModalService);
  private readonly shoppingListService = inject(ShoppingListService);

  // Lucide Icons
  readonly icons = { List, Users, Settings, Plus };

  async addNewItem(): Promise<void> {
    const result = await this.modalService.open<undefined, AddItemResult>({
      component: AddItemModal
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
}
