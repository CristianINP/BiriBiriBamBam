import { Component, computed, signal } from '@angular/core';
import { Product } from '../../models/producto/producto';
import { ProductsService } from '../../services/productos/productos';
import { CarritoService } from '../../services/carrito/carrito/carrito';
import { ProductCard } from '../product-card/product-card/product-card';
import { CarritoComponent } from '../carrito/carrito/carrito';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [ProductCard, CarritoComponent],
  templateUrl: './catalogo.html',
  styleUrls: ['./catalogo.css'],
})
export class Catalogo {
  products = signal<Product[]>([]);
  inStockCount = computed(() => this.products().filter(p => p.inStock).length);

  constructor(
    private productsService: ProductsService,
    private carritoService: CarritoService
  ) {
    this.productsService.getAll().subscribe({
      next: (data) => this.products.set(data),
      error: (err) => console.error('Error cargando XML:', err),
    });
  }

  agregar(producto: Product) {
    this.carritoService.agregar(producto);
  }
}
