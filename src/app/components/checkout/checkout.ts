import { AfterViewInit, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CarritoService } from '../../services/carrito/carrito/carrito';
import { PaypalService } from '../../services/paypal/paypal';
import { HistorialComprasService } from '../../services/historial-compras/historial-compras';
import { TicketService } from '../../services/ticket/ticket';
import { UserService } from '../../services/user/user';
import { environment } from '../../../environments/environment';

declare const paypal: any;

interface ItemSnapshot {
  nombre: string;
  cantidad: number;
  precio: number;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements AfterViewInit {
  @ViewChild('paypalButtonContainer')
  paypalButtonContainer!: ElementRef<HTMLDivElement>;

  private carritoService   = inject(CarritoService);
  private paypalService    = inject(PaypalService);
  private historialService = inject(HistorialComprasService);
  private ticketService    = inject(TicketService);
  private userService      = inject(UserService);

  // Exponer del servicio para que el template pueda llamarlos como funciones
  carrito   = this.carritoService.carrito;
  total     = this.carritoService.total;
  subtotal  = this.carritoService.subtotal;
  impuestos = this.carritoService.impuestos;

  mensaje        = signal('');
  mostrarTicket  = signal(false);
  ticketGenerado = signal<any>(null);

  // Datos guardados antes de limpiar el carrito, para poder generar el XML después
  private folioActual      = '';
  private orderIdActual    = '';
  private itemsSnapshot: ItemSnapshot[] = [];
  private subtotalSnapshot = 0;
  private ivaSnapshot      = 0;
  private totalSnapshot    = 0;

  ngAfterViewInit(): void {
    this.loadPaypalSdk().then(() => this.renderPaypalButton());
  }

  private loadPaypalSdk(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof paypal !== 'undefined') { resolve(); return; }
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${environment.paypalClientId}&currency=MXN`;
      script.onload  = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar el SDK de PayPal'));
      document.head.appendChild(script);
    });
  }

  private renderPaypalButton(): void {
    if (this.carrito().length === 0) return;
    if (typeof paypal === 'undefined') { this.mensaje.set('No se cargó el SDK de PayPal.'); return; }
    if (!this.paypalButtonContainer) return;

    this.paypalButtonContainer.nativeElement.innerHTML = '';

    paypal.Buttons({
      style: { layout: 'horizontal', height: 55, color: 'gold', shape: 'rect', label: 'paypal' },

      createOrder: async () => {
        try {
          const response = await firstValueFrom(
            this.paypalService.crearOrden({ items: this.carrito(), total: this.total() })
          );
          return response.id;
        } catch (error) {
          this.mensaje.set('No se pudo crear la orden.');
          throw error;
        }
      },

      onApprove: async (data: { orderID: string }) => {
        try {
          const capture = await firstValueFrom(this.paypalService.capturarOrden(data.orderID));
          const folio = 'FOL-' + Date.now();

          // Guardar snapshot ANTES de limpiar el carrito
          this.folioActual      = folio;
          this.orderIdActual    = data.orderID;
          this.subtotalSnapshot = this.carritoService.subtotal();
          this.ivaSnapshot      = this.carritoService.impuestos();
          this.totalSnapshot    = this.carritoService.totalConImpuestos();
          this.itemsSnapshot    = this.carritoService.groupedItems().map(item => ({
            nombre:   item.product.name,
            cantidad: item.quantity,
            precio:   item.product.price,
          }));

          const itemsParaHistorial = this.carritoService.groupedItems().map(item => ({
            producto_id:     item.product.id,
            nombre_producto: item.product.name,
            categoria:       item.product.category ?? '',
            cantidad:        item.quantity,
            precio_unitario: item.product.price,
            importe:         item.product.price * item.quantity,
          }));

          await this.historialService.guardarCompra({
            folio,
            paypalOrderId: data.orderID,
            paypalEstado:  capture.status || 'COMPLETED',
            subtotal:      this.subtotalSnapshot,
            iva:           this.ivaSnapshot,
            total:         this.totalSnapshot,
            items:         itemsParaHistorial,
          });

          // Guardar ticket si hay usuario autenticado
          const usuario = this.userService.getUsuarioActual();
          if (usuario) {
            firstValueFrom(
              this.ticketService.generarTicket({
                orderId:     data.orderID,
                id_usuario:  usuario.id_usuario,
                metodo_pago: 'PayPal',
                subtotal:    this.subtotalSnapshot,
                impuestos:   this.ivaSnapshot,
                total:       this.totalSnapshot,
                estado:      'APROBADO',
              })
            ).catch(e => console.error('Error guardando ticket (no crítico):', e));
          }

          this.ticketGenerado.set({
            id_ticket:    folio,
            orderId:      data.orderID,
            fecha_compra: new Date().toISOString(),
            total:        this.totalSnapshot,
          });

          this.carritoService.vaciar();
          this.mostrarTicket.set(true);
          this.mensaje.set('');
          if (this.paypalButtonContainer) {
            this.paypalButtonContainer.nativeElement.innerHTML = '';
          }
        } catch (error) {
          console.error('Error al capturar el pago:', error);
          this.mensaje.set('Ocurrió un error al capturar el pago.');
        }
      },

      onCancel: () => { this.mensaje.set('El usuario canceló el pago.'); },
      onError:  (err: any) => {
        console.error('Error PayPal:', err);
        this.mensaje.set('Error en el proceso de PayPal.');
      },
    }).render(this.paypalButtonContainer.nativeElement);
  }

  descargarTicketXML(): void {
    const fecha = new Date().toISOString();
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<recibo>\n`;
    xml += `  <folio>${this.folioActual}</folio>\n`;
    xml += `  <paypal_orden_id>${this.orderIdActual}</paypal_orden_id>\n`;
    xml += `  <fecha>${fecha}</fecha>\n`;
    xml += `  <productos>\n`;
    for (const item of this.itemsSnapshot) {
      xml += `    <producto>\n`;
      xml += `      <nombre>${item.nombre}</nombre>\n`;
      xml += `      <cantidad>${item.cantidad}</cantidad>\n`;
      xml += `      <precio_unitario>${item.precio.toFixed(2)}</precio_unitario>\n`;
      xml += `      <importe>${(item.precio * item.cantidad).toFixed(2)}</importe>\n`;
      xml += `    </producto>\n`;
    }
    xml += `  </productos>\n`;
    xml += `  <subtotal>${this.subtotalSnapshot.toFixed(2)}</subtotal>\n`;
    xml += `  <iva>${this.ivaSnapshot.toFixed(2)}</iva>\n`;
    xml += `  <total>${this.totalSnapshot.toFixed(2)}</total>\n`;
    xml += `</recibo>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `recibo-${this.folioActual}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  descargarTicketPDF(): void {
    const ticket = this.ticketGenerado();
    if (!ticket) return;
    // PDF mínimo con datos del ticket
    const contenido =
      `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n` +
      `2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n` +
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n` +
      `4 0 obj\n<< /Length 100 >>\nstream\nBT /F1 12 Tf 100 700 Td (Ticket #${ticket.id_ticket}) Tj ET\nendstream\nendobj\n` +
      `xref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000239 00000 n\n` +
      `trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n336\n%%EOF`;
    const blob = new Blob([contenido], { type: 'application/pdf' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ticket-${ticket.id_ticket}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
