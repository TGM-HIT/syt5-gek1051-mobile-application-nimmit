import { Component, computed, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Trash2, Pencil, Star, Plus, Coffee, Apple, Milk, Drumstick, Croissant, Snowflake, Candy, Brush, Package } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { FavouriteItem } from '../../models';
import { ShoppingListService, ModalService } from '../../services';
import { EditFavouriteModal, EditFavouriteData, EditFavouriteResult } from '../../components/edit-favourite-modal/edit-favourite-modal';
import { AddItemModal, AddItemData, AddItemResult } from '../../components/add-item-modal/add-item-modal';

@Component({
  selector: 'app-favourites',
  imports: [FormsModule, LucideAngularModule, TranslocoModule],
  templateUrl: './favourites.html',
  styleUrl: './favourites.scss',
})
export class Favourites {
  private readonly shoppingListService = inject(ShoppingListService);
  private readonly modalService = inject(ModalService);

  readonly icons = { Search, Trash2, Pencil, Star, Plus, Coffee, Apple, Milk, Drumstick, Croissant, Snowflake, Candy, Brush, Package };

  readonly searchQuery = signal('');

  // Swipe State
  readonly swipingItemId = signal<string | null>(null);
  readonly swipeOffset = signal<number>(0);
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

  // Items aus Service
  readonly favourites = this.shoppingListService.favourites;
  readonly favouritesLoaded = computed(() => this.shoppingListService.loaded?.() ?? true);

  readonly filteredFavourites = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const favs = this.favourites();
    if (!query) return favs;
    return favs.filter((fav: FavouriteItem) => fav.name.toLowerCase().includes(query));
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
        category: item.category,
        unit: item.unit,
        size: item.size
      }
    });

    if (result) {
      this.shoppingListService.updateFavourite(item.id, {
        name: result.name,
        category: result.category,
        unit: result.unit,
        size: result.size
      });
    }
  }
}
