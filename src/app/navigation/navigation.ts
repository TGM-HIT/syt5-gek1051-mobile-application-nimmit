import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, List, Users, Settings, Plus } from 'lucide-angular';
import { ModalService, ShoppingListDataService } from '../services';
import { AddItemModal, AddItemResult } from '../components/add-item-modal/add-item-modal';
import { SupabaseConnector } from '../services/supabase-connector';

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './navigation.html',
  styleUrl: './navigation.scss',
})
export class Navigation {
  private readonly modalService = inject(ModalService);
  private readonly shoppingListData = inject(ShoppingListDataService);
  private readonly supabase = inject(SupabaseConnector);
  private readonly router = inject(Router);

  // Lucide Icons
  readonly icons = { List, Users, Settings, Plus };

  async addNewItem(): Promise<void> {
    const result = await this.modalService.open<undefined, AddItemResult>({
      component: AddItemModal
    });

    if (!result) {
      return;
    }

    const listId = await this.resolveListId();
    if (listId === null) {
      return;
    }

    const session = await this.supabase.getSession();
    await this.shoppingListData.addItemToList(listId, {
        name: result.name,
        category: result.category,
        quantity: result.quantity,
        info: result.info,
        size: result.size,
        unit: result.unit
      }, session?.user.id ?? null);
  }

  private async resolveListId(): Promise<bigint | null> {
    const tree = this.router.parseUrl(this.router.url);
    const rawListId = tree.queryParamMap.get('listId');
    const parsed = rawListId ? BigInt(rawListId) : BigInt(-1);

    if (parsed > -1) {
      return parsed;
    }

    const session = await this.supabase.getSession();
    const userId = session?.user.id;

    if (!userId) {
      return null;
    }

    return this.shoppingListData.getLatestListIdForUser(userId);
  }
}
