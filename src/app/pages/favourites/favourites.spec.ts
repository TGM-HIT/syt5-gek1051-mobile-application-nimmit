import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Favourites } from './favourites';
import { ShoppingListService } from '../../services/shopping-list.service';
import { ModalService } from '../../services/modal.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';

describe('Favourites', () => {
  let component: Favourites;
  let fixture: ComponentFixture<Favourites>;
  let mockShoppingListService: any;
  let mockModalService: any;

  beforeEach(async () => {
    mockShoppingListService = {
      favourites: signal([
        { id: '1', name: 'Apfel', unit: 'kg', size: 1 },
        { id: '2', name: 'Brot', unit: 'Einheit' }
      ]),
      removeFavourite: vi.fn(),
      updateFavourite: vi.fn(),
    };

    mockModalService = {
      open: vi.fn().mockResolvedValue(null)
    };

    await TestBed.configureTestingModule({
      imports: [Favourites],
      providers: [
        { provide: ShoppingListService, useValue: mockShoppingListService },
        { provide: ModalService, useValue: mockModalService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Favourites);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter favourites based on search query', () => {
    component.searchQuery.set('apf');
    const filtered = component.filteredFavourites();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Apfel');
  });

  it('should correctly determine if there are no search results', () => {
    component.searchQuery.set('xyz');
    expect(component.hasNoResults()).toBe(true);

    component.searchQuery.set('apf');
    expect(component.hasNoResults()).toBe(false);
  });

  it('should call removeFavourite when deleteFavourite is called', () => {
    component.deleteFavourite({ id: '1', name: 'Apfel', category: 'Obst & Gemüse', unit: 'kg', size: 1 });
    expect(mockShoppingListService.removeFavourite).toHaveBeenCalledWith('1');
  });

  it('should open modal and update favourite on editFavourite', async () => {
    const editData = { name: 'Birne', category: 'Obst & Gemüse', unit: 'kg', size: 2 };
    mockModalService.open.mockResolvedValue(editData);

    await component.editFavourite({ id: '1', name: 'Apfel', category: 'Obst & Gemüse', unit: 'kg', size: 1 });

    expect(mockModalService.open).toHaveBeenCalled();
    expect(mockShoppingListService.updateFavourite).toHaveBeenCalledWith('1', editData);
  });
});
