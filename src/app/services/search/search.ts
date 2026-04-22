import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private searchSignal = signal('');
  private categoryFilterSignal = signal('');
  
  search = this.searchSignal.asReadonly();
  categoryFilter = this.categoryFilterSignal.asReadonly();
  
  setSearch(query: string) {
    this.searchSignal.set(query);
  }

  setCategoryFilter(category: string) {
    this.categoryFilterSignal.set(category);
  }

  clearCategoryFilter() {
    this.categoryFilterSignal.set('');
  }
}
