import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../../../models/producto/producto';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CarritoService {
  // Lista reactiva del carrito
  private productosSignal = signal<Product[]>([]);

  // Exponer como readonly
  productos = this.productosSignal.asReadonly();

  // Productos agrupados con cantidad
  groupedItems = computed(() => {
    const items: CartItem[] = [];
    const productMap = new Map<number, CartItem>();
    
    for (const product of this.productosSignal()) {
      if (productMap.has(product.id)) {
        productMap.get(product.id)!.quantity++;
      } else {
        productMap.set(product.id, { product, quantity: 1 });
      }
    }
    
    productMap.forEach(item => items.push(item));
    return items;
  });

  // Total de items en carrito
  itemCount = computed(() => this.productosSignal().length);

  // Subtotal (sin impuestos)
  subtotal = computed(() => this.productosSignal().reduce((acc, p) => acc + p.price, 0));

  // Total con impuestos (16% IVA)
  totalConImpuestos = computed(() => this.subtotal() * 1.16);

  // Formato compatible con checkout de PayPal
  carrito = computed(() =>
    this.groupedItems().map(item => ({
      id: item.product.id,
      nombre: item.product.name,
      cantidad: item.quantity,
      precio: item.product.price
    }))
  );
  total = this.totalConImpuestos;

  // Impuestos (16%)
  impuestos = computed(() => this.subtotal() * 0.16);

  agregar(producto: Product, cantidad: number = 1) {
    // Agregar el producto la cantidad de veces especificada
    const nuevosProductos = Array(cantidad).fill(producto);
    this.productosSignal.update(lista => [...lista, ...nuevosProductos]);
  }

  quitar(id: number) {
    // Remover solo una instancia del producto
    const lista = this.productosSignal();
    const index = lista.findIndex(p => p.id === id);
    if (index !== -1) {
      const nuevaLista = [...lista];
      nuevaLista.splice(index, 1);
      this.productosSignal.set(nuevaLista);
    }
  }

  // Remover todas las instancias de un producto
  removeAll(id: number) {
    this.productosSignal.update(lista => lista.filter(p => p.id !== id));
  }

  vaciar() {
    this.productosSignal.set([]);
  }

  exportarXML() {
    const productos = this.productosSignal();

    // Estructura XML manual
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<recibo>\n`;

    for (const p of productos) {
      xml += `  <producto>\n`;
      xml += `    <id>${p.id}</id>\n`;
      xml += `    <nombre>${this.escapeXml(p.name)}</nombre>\n`;
      xml += `    <precio>${p.price}</precio>\n`;
      if (p.description) {
        xml += `    <descripcion>${this.escapeXml(p.description)}</descripcion>\n`;
      }
      xml += `  </producto>\n`;
    }

    xml += `  <subtotal>${this.subtotal().toFixed(2)}</subtotal>\n`;
    xml += `  <impuestos>${this.impuestos().toFixed(2)}</impuestos>\n`;
    xml += `  <total>${this.totalConImpuestos().toFixed(2)}</total>\n`;
    xml += `</recibo>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'recibo.xml';
    a.click();

    URL.revokeObjectURL(url);
  }

  private escapeXml(value: string): string {
    return value
      .replaceAll('&', '&')
      .replaceAll('<', '<')
      .replaceAll('>', '>')
      .replaceAll('"', '"')
      .replaceAll("'", "'");
  }
}
