import { Component, computed, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Trash2, Pencil, Star, Plus } from 'lucide-angular';
import { FavouriteItem } from '../../models';
import { ShoppingListService, ModalService } from '../../services';
import { EditFavouriteModal, EditFavouriteData, EditFavouriteResult } from '../../components/edit-favourite-modal/edit-favourite-modal';
import { AddItemModal, AddItemData, AddItemResult } from '../../components/add-item-modal/add-item-modal';

@Component({
  selector: 'app-favourites',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './favourites.html',
  styleUrl: './favourites.scss',
})
export class Favourites {
  private readonly shoppingListService = inject(ShoppingListService);
  private readonly modalService = inject(ModalService);

  readonly icons = { Search, Trash2, Pencil, Star, Plus };

  readonly searchQuery = signal('');

  // Swipe State
  readonly swipingItemId = signal<string | null>(null);
  readonly swipeOffset = signal<number>(0);
  private touchStartX = 0;
  private touchStartY = 0;
  private isSwiping = false;
  private readonly SWIPE_THRESHOLD = 70;

  // Items aus Service
  readonly favourites = this.shoppingListService.favourites;

  readonly filteredFavourites = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const favs = this.favourites();
    if (!query) return favs;
    return favs.filter(fav => fav.name.toLowerCase().includes(query));
  });

  readonly hasNoResults = computed(() => {
    return this.searchQuery().trim().length > 0 && this.filteredFavourites().length === 0;
  });

  onSearchQueryChange(newQuery: string): void {
    this.searchQuery.set(newQuery);
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

    if (!this.isSwiping && Math.abs(deltaY) > Math.abs(deltaX)) {
      this.resetSwipe();
      return;
    }

    if (Math.abs(deltaX) > 10) {
      this.isSwiping = true;
    }

    if (this.isSwiping) {
      event.preventDefault();
      // Nur nach rechts swipen (für Delete)
      const offset = Math.max(0, Math.min(70, deltaX));
      this.swipeOffset.set(offset);
    }
  }

  onTouchEnd(item: FavouriteItem): void {
    const offset = this.swipeOffset();

    if (offset >= this.SWIPE_THRESHOLD) {
      this.deleteFavourite(item);
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

  isSwipingRight(itemId: string): boolean {
    return this.swipingItemId() === itemId && this.swipeOffset() > 20;
  }

  deleteFavourite(item: FavouriteItem): void {
    this.shoppingListService.removeFavourite(item.id);
  }

  async editFavourite(item: FavouriteItem): Promise<void> {
    const result = await this.modalService.open<EditFavouriteData, EditFavouriteResult>({
      component: EditFavouriteModal,
      data: {
        name: item.name,
        unit: item.unit,
        size: item.size
      }
    });

    if (result) {
      this.shoppingListService.updateFavourite(item.id, {
        name: result.name,
        unit: result.unit,
        size: result.size
      });
    }
  }
}
