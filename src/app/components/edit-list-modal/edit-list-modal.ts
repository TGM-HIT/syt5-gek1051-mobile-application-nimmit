import { Component, inject, signal, input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X } from 'lucide-angular';
import { ModalService } from '../../services/modal.service';

export interface EditListData {
  name: string;
  description: string;
}

export interface EditListResult {
  name: string;
  description: string;
}

@Component({
  selector: 'app-edit-list-modal',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './edit-list-modal.html',
  styleUrl: './edit-list-modal.scss',
})
export class EditListModal implements OnInit {
  private readonly modalService = inject(ModalService);
  
  readonly data = input<EditListData>();
  readonly icons = { X };

  readonly name = signal('');
  readonly description = signal('');

  ngOnInit(): void {
    const inputData = this.data();
    if (inputData) {
      this.name.set(inputData.name);
      this.description.set(inputData.description);
    }
  }

  close(): void {
    this.modalService.dismiss();
  }

  submit(): void {
    if (!this.name().trim()) {
      return;
    }

    const result: EditListResult = {
      name: this.name().trim(),
      description: this.description().trim()
    };

    this.modalService.close(result);
  }
}
