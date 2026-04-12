import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { LucideAngularModule, List, Users, Settings, Plus, Star, Menu } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { ModalService, ShoppingListDataService } from '../services';
import { AddItemModal, AddItemResult } from '../components/add-item-modal/add-item-modal';
import { SupabaseConnector } from '../services/supabase-connector';
import { DefaultList } from '../services/default-list';

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule, TranslocoModule],
  templateUrl: './navigation.html',
  styleUrl: './navigation.scss',
})
export class Navigation {
  private readonly modalService = inject(ModalService);
  private readonly shoppingListData = inject(ShoppingListDataService);
  private readonly supabase = inject(SupabaseConnector);
  private readonly router = inject(Router);
  private readonly defaultList = inject(DefaultList);
  private readonly document = inject(DOCUMENT);

  // Lucide Icons
  readonly icons = { List, Users, Star, Settings, Plus, Menu };

  readonly isSidebarOpen = signal(true);
  private readonly sidebarWidthExpanded = '240px';
  private readonly sidebarWidthCollapsed = '56px';

  constructor() {
    effect(() => {
      const width = this.isSidebarOpen() ? this.sidebarWidthExpanded : this.sidebarWidthCollapsed;
      this.document.documentElement.style.setProperty('--nav-sidebar-width', width);
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update((open) => !open);
  }

  async addNewItem(): Promise<void> {
    const result = await this.modalService.open<undefined, AddItemResult>({
      component: AddItemModal
    });

    if (!result) {
      return;
    }

    const listId = this.resolveListId();
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

  isListSectionActive(): boolean {
    return this.router.url.startsWith('/list');
  }

  isSettingsSectionActive(): boolean {
    return this.router.url.startsWith('/settings') || this.router.url.startsWith('/account');
  }

  protected resolveListId(): bigint | null {
    const tree = this.router.parseUrl(this.router.url);
    const rawListId = tree.queryParamMap.get('listId');
    const parsed = rawListId ? BigInt(rawListId) : BigInt(-1);

    if (parsed > -1) {
      return parsed;
    }
    return this.defaultList.getDefaultList();
  }
}
