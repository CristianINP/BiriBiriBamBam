import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private searchSignal = signal('');
  
  search = this.searchSignal.asReadonly();
  
  setSearch(query: string) {
    this.searchSignal.set(query);
  }
}
