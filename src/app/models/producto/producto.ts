import { Component } from '@angular/core';

@Component({
  selector: 'app-producto',
  imports: [],
  templateUrl: './producto.html',
  styleUrl: './producto.css',
})
export class Producto {}

export interface Product{
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category: string;
  inStock: boolean;
}
