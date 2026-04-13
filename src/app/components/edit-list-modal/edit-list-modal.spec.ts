import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditListModal, EditListData, EditListResult } from './edit-list-modal';
import { ModalService } from '../../services/modal.service';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { provideTransloco, translocoConfig } from '@jsverse/transloco';
import { TranslocoAppLoader } from '../../transloco/transloco-loader';

describe('EditListModal', () => {
  let component: EditListModal;
  let fixture: ComponentFixture<EditListModal>;
  let mockModalService: { dismiss: Mock, close: Mock };

  beforeEach(async () => {
    mockModalService = {
      dismiss: vi.fn(),
      close: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [EditListModal],
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

    fixture = TestBed.createComponent(EditListModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have empty name initially', () => {
      expect(component.name()).toBe('');
    });

    it('should have empty description initially', () => {
      expect(component.description()).toBe('');
    });
  });

  describe('ngOnInit with data', () => {
    it('should populate form from input data', () => {
      const editFixture = TestBed.createComponent(EditListModal);
      const editComponent = editFixture.componentInstance;
      
      // Manually set the input and call ngOnInit
      (editComponent as any).data = () => ({
        name: 'Meine Liste',
        description: 'Beschreibung der Liste'
      } as EditListData);
      
      editComponent.ngOnInit();
      editFixture.detectChanges();

      expect(editComponent.name()).toBe('Meine Liste');
      expect(editComponent.description()).toBe('Beschreibung der Liste');
    });
  });

  describe('close()', () => {
    it('should call modalService.dismiss()', () => {
      component.close();
      
      expect(mockModalService.dismiss).toHaveBeenCalled();
    });
  });

  describe('submit()', () => {
    it('should not submit when name is empty', () => {
      component.name.set('');
      component.description.set('Test');
      
      component.submit();
      
      expect(mockModalService.close).not.toHaveBeenCalled();
    });

    it('should not submit when name is only whitespace', () => {
      component.name.set('   ');
      
      component.submit();
      
      expect(mockModalService.close).not.toHaveBeenCalled();
    });

    it('should call modalService.close with result when valid', () => {
      component.name.set('Neue Liste');
      component.description.set('Neue Beschreibung');
      
      component.submit();
      
      expect(mockModalService.close).toHaveBeenCalledWith({
        action: 'save',
        name: 'Neue Liste',
        description: 'Neue Beschreibung'
      } as EditListResult);
    });

    it('should trim name before submitting', () => {
      component.name.set('  Trimmed Name  ');
      component.description.set('Description');
      
      component.submit();
      
      expect(mockModalService.close).toHaveBeenCalledWith(expect.objectContaining({
        action: 'save',
        name: 'Trimmed Name'
      }));
    });

    it('should trim description before submitting', () => {
      component.name.set('Name');
      component.description.set('  Trimmed Description  ');
      
      component.submit();
      
      expect(mockModalService.close).toHaveBeenCalledWith(expect.objectContaining({
        action: 'save',
        description: 'Trimmed Description'
      }));
    });

    it('should allow empty description', () => {
      component.name.set('Name');
      component.description.set('');
      
      component.submit();
      
      expect(mockModalService.close).toHaveBeenCalledWith({
        action: 'save',
        name: 'Name',
        description: ''
      });
    });
  });

  describe('deleteList()', () => {
    it('should close modal with delete action when user is alone in list', () => {
      (component as any).data = () => ({
        name: 'Meine Liste',
        description: 'Beschreibung',
        aloneInList: true,
      } as EditListData);

      component.deleteList();

      expect(mockModalService.close).toHaveBeenCalledWith({ action: 'delete' });
    });

    it('should close modal with leave action when user is not alone in list', () => {
      (component as any).data = () => ({
        name: 'Meine Liste',
        description: 'Beschreibung',
        aloneInList: false,
      } as EditListData);

      component.deleteList();

      expect(mockModalService.close).toHaveBeenCalledWith({ action: 'leave' });
    });
  });

  describe('icons', () => {
    it('should have X icon defined', () => {
      expect(component.icons.X).toBeDefined();
    });
  });
});
