import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { Product } from '../../../models/producto/producto';

export interface ProductAddEvent {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  @Input({ required: true }) product!: Product;
  @Output() add = new EventEmitter<ProductAddEvent>();
  
  quantity = signal(1);

  incrementQuantity() {
    this.quantity.update(q => q + 1);
  }

  decrementQuantity() {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  onAdd() {
    this.add.emit({ product: this.product, quantity: this.quantity() });
    this.quantity.set(1); // Reset after adding
  }
}
