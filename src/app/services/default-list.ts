import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DefaultList {
  protected defaultList: bigint | null = null;

  constructor() {
    this.loadDefaultList();
  }

  private loadDefaultList(): void {
    const stored = localStorage.getItem('defaultList');
    if (stored) {
      try {
        this.defaultList = BigInt(stored);
      } catch (e) {
        console.error('Failed to parse default list ID from localStorage:', e);
      }
    }
  }

  getDefaultList(): bigint | null {
    return this.defaultList;
  }

  setDefaultList(listId: bigint | null): void {
    this.defaultList = listId;
    if (listId !== null) {
      localStorage.setItem('defaultList', listId.toString());
    } else {
      localStorage.removeItem('defaultList');
    }
  }
}
