import { Component, computed, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product } from '../../models/producto/producto';
import { ProductsService } from '../../services/productos/productos';
import { CarritoService } from '../../services/carrito/carrito/carrito';
import { SearchService } from '../../services/search/search';
import { ProductCard, ProductAddEvent } from '../product-card/product-card/product-card';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [ProductCard, FormsModule],
  templateUrl: './catalogo.html',
  styleUrls: ['./catalogo.css'],
})
export class Catalogo implements OnInit {
  products = signal<Product[]>([]);
  allProducts = signal<Product[]>([]);
  selectedCategory = signal<string>('all');
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  onlyInStock = signal(false);
  sortOption = signal('name-asc');
  showModal = signal(false);
  modalProductName = signal('');
  
  categories = computed(() => {
    const cats = new Set(this.allProducts().map(p => p.category));
    return ['all', ...Array.from(cats)];
  });

  filteredProducts = computed(() => {
    let result = this.allProducts();
    
    // Filter by search query from service
    const query = this.searchService.search().toLowerCase();
    if (query) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description?.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (this.selectedCategory() !== 'all') {
      result = result.filter(p => p.category === this.selectedCategory());
    }
    
    // Filter by price range
    const min = this.minPrice();
    const max = this.maxPrice();
    if (min !== null) {
      result = result.filter(p => p.price >= min);
    }
    if (max !== null) {
      result = result.filter(p => p.price <= max);
    }
    
    // Filter by stock
    if (this.onlyInStock()) {
      result = result.filter(p => p.inStock);
    }
    
    // Sort results
    const sort = this.sortOption();
    switch (sort) {
      case 'name-asc':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result = [...result].sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
    }
    
    return result;
  });

  inStockCount = computed(() => this.filteredProducts().filter(p => p.inStock).length);

  constructor(
    private productsService: ProductsService,
    public carritoService: CarritoService,
    public searchService: SearchService
  ) {}

  ngOnInit() {
    this.productsService.getAll().subscribe({
      next: (data) => {
        this.allProducts.set(data);
        this.products.set(data);
      },
      error: (err) => console.error('Error cargando XML:', err),
    });
  }

  onCategoryChange(category: string) {
    this.selectedCategory.set(category);
  }

  getCategoryCount(category: string): number {
    if (category === 'all') {
      return this.allProducts().length;
    }
    return this.allProducts().filter(p => p.category === category).length;
  }

  clearAllFilters() {
    this.selectedCategory.set('all');
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.onlyInStock.set(false);
    this.sortOption.set('name-asc');
  }

  agregar(event: ProductAddEvent) {
    this.carritoService.agregar(event.product, event.quantity);
    this.modalProductName.set(
      event.quantity > 1 
        ? `${event.quantity}x ${event.product.name}` 
        : event.product.name
    );
    this.showModal.set(true);
    setTimeout(() => this.showModal.set(false), 2500);
  }
}
