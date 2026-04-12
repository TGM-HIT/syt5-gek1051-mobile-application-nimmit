import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditFavouriteModal } from './edit-favourite-modal';
import { ModalService } from '../../services/modal.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentRef } from '@angular/core';
import { provideTransloco, translocoConfig } from '@jsverse/transloco';
import { TranslocoAppLoader } from '../../transloco/transloco-loader';

describe('EditFavouriteModal', () => {
  let component: EditFavouriteModal;
  let fixture: ComponentFixture<EditFavouriteModal>;
  let mockModalService: any;
  let componentRef: ComponentRef<EditFavouriteModal>;

  beforeEach(async () => {
    mockModalService = {
      dismiss: vi.fn(),
      close: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [EditFavouriteModal],
      providers: [
        provideTransloco({
          config: translocoConfig({
            availableLangs: ['de', 'en'],
            defaultLang: 'de',
            reRenderOnLangChange: true,
            prodMode: true,
          }),
          loader: TranslocoAppLoader,
        }),
        { provide: ModalService, useValue: mockModalService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditFavouriteModal);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize with provided data', () => {
    // Provide inputs before initial change detection
    componentRef.setInput('data', {
      name: 'TestItem',
      category: 'Obst & Gemüse',
      unit: 'kg',
      size: 5
    });
    fixture.detectChanges();

    expect(component.name()).toBe('TestItem');
    expect(component.category()).toBe('Obst & Gemüse');
    expect(component.unit()).toBe('kg');
    expect(component.size()).toBe(5);
  });

  it('should set size correctly with setSize', () => {
    fixture.detectChanges();
    component.setSize('10.5');
    expect(component.size()).toBe(10.5);

    component.setSize('invalid');
    expect(component.size()).toBeUndefined();
  });

  it('should call dismiss on close', () => {
    fixture.detectChanges();
    component.close();
    expect(mockModalService.dismiss).toHaveBeenCalled();
  });

  it('should not call close if name is empty on submit', () => {
    fixture.detectChanges();
    component.name.set('   ');
    component.submit();
    expect(mockModalService.close).not.toHaveBeenCalled();
  });

  it('should call close with data on submit', () => {
    fixture.detectChanges();
    component.name.set('ValidName');
    component.category.set('Obst & Gemüse');
    component.unit.set('L');
    component.size.set(2);
    
    component.submit();
    
    expect(mockModalService.close).toHaveBeenCalledWith({
      name: 'ValidName',
      category: 'Obst & Gemüse',
      unit: 'L',
      size: 2
    });
  });
});
