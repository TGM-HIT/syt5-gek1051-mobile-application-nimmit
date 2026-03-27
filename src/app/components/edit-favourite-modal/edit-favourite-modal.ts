import { Component, inject, signal, input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X } from 'lucide-angular';
import { ModalService } from '../../services/modal.service';
import { Unit } from '../../models/shopping-list.model';

export interface EditFavouriteData {
  name: string;
  unit: Unit;
  size?: number;
}

export interface EditFavouriteResult {
  name: string;
  unit: Unit;
  size?: number;
}

@Component({
  selector: 'app-edit-favourite-modal',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './edit-favourite-modal.html',
  styleUrl: './edit-favourite-modal.scss',
})
export class EditFavouriteModal implements OnInit {
  private readonly modalService = inject(ModalService);
  
  readonly data = input<EditFavouriteData>();
  readonly icons = { X };

  readonly name = signal('');
  readonly unit = signal<Unit>('Einheit');
  readonly size = signal<number | undefined>(undefined);
  
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
      this.unit.set(inputData.unit);
      this.size.set(inputData.size);
    }
  }

  setSize(val: string): void {
    const num = parseFloat(val);
    this.size.set(isNaN(num) ? undefined : num);
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
      unit: this.unit(),
      size: this.size()
    };

    this.modalService.close(result);
  }
}
