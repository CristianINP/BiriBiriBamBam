import { Component, computed, signal, OnInit } from '@angular/core';
import { Product } from '../../models/producto/producto';
import { ProductsService } from '../../services/productos/productos';
import { CarritoService } from '../../services/carrito/carrito/carrito';
import { SearchService } from '../../services/search/search';
import { ProductCard } from '../product-card/product-card/product-card';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [ProductCard],
  templateUrl: './catalogo.html',
  styleUrls: ['./catalogo.css'],
})
export class Catalogo implements OnInit {
  products = signal<Product[]>([]);
  allProducts = signal<Product[]>([]);
  selectedCategory = signal<string>('all');
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

  agregar(producto: Product) {
    this.carritoService.agregar(producto);
    this.modalProductName.set(producto.name);
    this.showModal.set(true);
    setTimeout(() => this.showModal.set(false), 2500);
  }
}
