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
        // Clonar el producto para evitar referencias compartidas
        productMap.set(product.id, { product: { ...product }, quantity: 1 });
      }
    }

    productMap.forEach(item => items.push(item));
    return items;
  });

  // Total de items en carrito
  itemCount = computed(() => this.productosSignal().length);

  // Subtotal (sin impuestos)
  subtotal = computed(() =>
    this.productosSignal().reduce((acc, p) => acc + p.price, 0)
  );

  // Impuestos (16%)
  impuestos = computed(() => this.subtotal() * 0.16);

  // Total con impuestos (16% IVA)
  totalConImpuestos = computed(() => this.subtotal() * 1.16);

  total = this.totalConImpuestos;

  // Formato compatible con checkout de PayPal
  carrito = computed(() =>
    this.groupedItems().map(item => ({
      id: item.product.id,
      nombre: item.product.name,
      cantidad: item.quantity,
      precio: item.product.price
    }))
  );

  agregar(producto: Product, cantidad: number = 1) {
    // Forzar price a número — MySQL puede devolverlo como string
    const p: Product = { ...producto, price: Number(producto.price) };
    const nuevosProductos = Array(cantidad).fill(null).map(() => ({ ...p }));
    this.productosSignal.update(lista => [...lista, ...nuevosProductos]);
  }

  quitar(id: number) {
    const lista = this.productosSignal();
    const index = lista.findIndex(p => p.id === id);
    if (index !== -1) {
      const nuevaLista = [...lista];
      nuevaLista.splice(index, 1);
      this.productosSignal.set(nuevaLista);
    }
  }

  removeAll(id: number) {
    this.productosSignal.update(lista => lista.filter(p => p.id !== id));
  }

  vaciar() {
    this.productosSignal.set([]);
  }

  /**
   * Genera y descarga automáticamente el XML del recibo de compra.
   * Se llama después de un pago exitoso con el folio y orderID de PayPal.
   */
  descargarReciboXML(folio: string, paypalOrderId: string) {
    const items = this.groupedItems();
    const subtotal = this.subtotal();
    const iva = this.impuestos();
    const total = this.totalConImpuestos();
    const fecha = new Date().toISOString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<recibo>\n`;
    xml += `  <folio>${this.escapeXml(folio)}</folio>\n`;
    xml += `  <paypal_orden_id>${this.escapeXml(paypalOrderId)}</paypal_orden_id>\n`;
    xml += `  <fecha>${fecha}</fecha>\n`;
    xml += `  <productos>\n`;

    for (const item of items) {
      const p = item.product;
      const importe = p.price * item.quantity;
      xml += `    <producto>\n`;
      xml += `      <id>${p.id}</id>\n`;
      xml += `      <nombre>${this.escapeXml(p.name)}</nombre>\n`;
      xml += `      <categoria>${this.escapeXml(p.category ?? '')}</categoria>\n`;
      xml += `      <cantidad>${item.quantity}</cantidad>\n`;
      xml += `      <precio_unitario>${p.price.toFixed(2)}</precio_unitario>\n`;
      xml += `      <importe>${importe.toFixed(2)}</importe>\n`;
      if (p.description) {
        xml += `      <descripcion>${this.escapeXml(p.description)}</descripcion>\n`;
      }
      xml += `    </producto>\n`;
    }

    xml += `  </productos>\n`;
    xml += `  <subtotal>${subtotal.toFixed(2)}</subtotal>\n`;
    xml += `  <iva>${iva.toFixed(2)}</iva>\n`;
    xml += `  <total>${total.toFixed(2)}</total>\n`;
    xml += `</recibo>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibo-${folio}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Mantener compatibilidad con botón "Generar recibo" manual
  exportarXML() {
    const folio = 'MANUAL-' + Date.now();
    this.descargarReciboXML(folio, 'N/A');
  }

  private escapeXml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }
}