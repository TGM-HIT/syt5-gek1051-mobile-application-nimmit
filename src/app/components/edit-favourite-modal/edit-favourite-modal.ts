import { Component, inject, signal, input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { ModalService } from '../../services/modal.service';
import { Unit } from '../../models/shopping-list.model';

export interface EditFavouriteData {
  name: string;
  category: string;
  unit: Unit;
  size?: number;
}

export interface EditFavouriteResult {
  name: string;
  category: string;
  unit: Unit;
  size?: number;
}

@Component({
  selector: 'app-edit-favourite-modal',
  imports: [FormsModule, LucideAngularModule, TranslocoModule],
  templateUrl: './edit-favourite-modal.html',
  styleUrl: './edit-favourite-modal.scss',
})
export class EditFavouriteModal implements OnInit {
  private readonly modalService = inject(ModalService);
  
  readonly data = input<EditFavouriteData>();
  readonly icons = { X };

  readonly name = signal('');
  readonly category = signal<string>('Sonstiges');
  readonly unit = signal<Unit>('Einheit');
  readonly size = signal<number | undefined>(undefined);
  
  readonly categories = [
    'Obst & Gemüse',
    'Backwaren',
    'Milchprodukte',
    'Fleisch & Fisch',
    'Getränke',
    'Snacks',
    'Tiefkühl',
    'Konserven',
    'Drogerie',
    'Tierbedarf',
    'Sonstiges'
  ];

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
    if (inputData) {
      this.name.set(inputData.name);
      if (inputData.category) {
        this.category.set(inputData.category);
      }
      this.unit.set(inputData.unit);
      this.size.set(inputData.size);
    }
  }

  setCategory(val: string): void {
    this.category.set(val);
  }

  setSize(val: string): void {
    const num = parseFloat(val);
    this.size.set(Number.isNaN(num) ? undefined : num);
  }

  setUnit(val: string): void {
    this.unit.set(val as Unit);
  }

  close(): void {
    this.modalService.dismiss();
  }

  submit(): void {
    if (!this.name().trim()) {
      return;
    }

    const result: EditFavouriteResult = {
      name: this.name().trim(),
      category: this.category(),
      unit: this.unit(),
      size: this.size()
    };

    this.modalService.close(result);
  }
}
