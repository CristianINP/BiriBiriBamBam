import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Product } from '../../models/producto/producto';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/productos';

  private normalizeProducts(products: any[]): Product[] {
    return products.map(p => ({
      ...p,
      price: typeof p.price === 'string' ? parseFloat(p.price) : p.price
    }));
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(products => this.normalizeProducts(products)),
      catchError((error) => {
        console.error('Error al obtener productos:', error);
        return of([]);
      })
    );
  }

  getAll(): Observable<Product[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(products => this.normalizeProducts(products)),
      catchError((error) => {
        console.error('Error al obtener productos:', error);
        return of([]);
      })
    );
  }
}
