import { Component, computed, inject, AfterViewInit, ElementRef, ViewChild, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CarritoService } from '../../../services/carrito/carrito/carrito';
import { PaypalService } from '../../../services/paypal/paypal';
import { TicketService } from '../../../services/ticket/ticket';
import { UserService } from '../../../services/user/user';
import { Product } from '../../../models/producto/producto';
import { Navbar } from '../../navbar/navbar';
import { Footer } from '../../footer/footer';
import { environment } from '../../../../environments/environment';

declare const paypal: any;

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, Navbar, Footer],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class CarritoComponent implements AfterViewInit, OnDestroy {
  @ViewChild('paypalButtonContainer')
  paypalButtonContainer!: ElementRef<HTMLDivElement>;

  private carritoService = inject(CarritoService);
  private paypalService = inject(PaypalService);
  private ticketService = inject(TicketService);
  private userService = inject(UserService);

  groupedItems      = this.carritoService.groupedItems;
  subtotal          = computed(() => this.carritoService.subtotal());
  impuestos         = computed(() => this.carritoService.impuestos());
  totalConImpuestos = computed(() => this.carritoService.totalConImpuestos());

  mensaje = signal('');
  ticketGenerado = signal<any>(null);
  mostrarTicket = signal(false);
  itemsComprados = signal<{ id: number; nombre: string; cantidad: number; precio: number }[]>([]);

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    setTimeout(() => this.initStarfield(), 100);

    this.cargandoPaypal.set(true);
    this.loadPaypalSdk()
      .then(() => {
        this.sdkCargado = true;
        this.cargandoPaypal.set(false);
        this.renderPaypalButton();
        // Arrancar el watcher de cambios en el carrito
        this.startCartWatcher();
      })
      .catch(err => {
        this.cargandoPaypal.set(false);
        this.mensaje.set('No se pudo cargar el SDK de PayPal.');
        console.error(err);
      });
  }

  ngOnDestroy() {
    if (this.renderTimeout)  clearTimeout(this.renderTimeout);
    if (this.watchInterval)  clearInterval(this.watchInterval);
  }

  /**
   * Polling liviano (200ms) para detectar cambios en el carrito y
   * re-renderizar el botón PayPal. Es más confiable que effect() en
   * contextos con SSR/hidratación, y no requiere tocar el injector.
   */
  private startCartWatcher() {
    this.watchInterval = setInterval(() => {
      const currentCount = this.groupedItems().length;
      if (currentCount !== this.lastItemCount) {
        this.lastItemCount = currentCount;
        // Solo re-renderizar si no hay un botón PayPal activo en el DOM
        if (!this.paypalButtonActive) {
          this.scheduleRender();
        } else if (currentCount === 0) {
          // Si vaciaron el carrito, sí limpiar
          this.paypalButtonActive = false;
          this.scheduleRender();
        }
      }
    }, 200);
  }

  private scheduleRender() {
    if (this.renderTimeout) clearTimeout(this.renderTimeout);
    this.renderTimeout = setTimeout(() => this.renderPaypalButton(), 100);
  }

  private loadPaypalSdk(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof paypal !== 'undefined') { resolve(); return; }

      const existing = document.querySelector('script[src*="paypal.com/sdk/js"]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject());
        // Si ya estaba cargado pero el objeto no existe aún, esperar un tick
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${environment.paypalClientId}&currency=MXN`;
      script.onload  = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar el SDK de PayPal'));
      document.head.appendChild(script);
    });
  }

  private renderPaypalButton(): void {
    if (this.pagoExitoso()) return;
    if (!this.paypalButtonContainer?.nativeElement) return;
    if (typeof paypal === 'undefined') return;

    const container = this.paypalButtonContainer.nativeElement;

    // Limpiar instancia anterior
    this.paypalButtonActive = false;
    container.innerHTML = '';

    if (this.groupedItems().length === 0) return;
    if (typeof paypal === 'undefined') {
      this.mensaje.set('No se cargó el SDK de PayPal.');
      return;
    }
    if (!this.paypalButtonContainer) return;

    // Snapshot de los datos ANTES de abrir el popup — evita que el carrito
    // esté vacío cuando PayPal llame a createOrder
    const itemsSnapshot  = this.carritoService.carrito();
    const totalSnapshot  = this.totalConImpuestos();

    this.paypalButtonActive = false; // se marca true cuando el botón monta
    paypal.Buttons({
      style: { layout: 'horizontal', height: 50, color: 'gold', shape: 'rect', label: 'paypal' },

      createOrder: async () => {
        try {
          const response = await firstValueFrom(
            this.paypalService.crearOrden({
              items: this.carritoService.carritoParaPayPal(),
              total: this.total()
            })
          );
          return response.id;
        } catch (error) {
          this.mensaje.set('No se pudo crear la orden.');
          throw error;
        }
      },

      onApprove: async (data: { orderID: string }) => {
        this.zone.run(() => this.mensaje.set('Procesando pago…'));
        try {
          await firstValueFrom(this.paypalService.capturarOrden(data.orderID));

          const usuarioActual = this.userService.usuario();
          let userId: number;
          if (!usuarioActual) {
            userId = await this.crearUsuarioTemporal();
          } else {
            userId = usuarioActual.id_usuario;
          }

          // Guardar snapshot del carrito ANTES de vaciarlo
          this.itemsComprados.set(
            this.carritoService.groupedItems().map(item => ({
              id: item.product.id,
              nombre: item.product.name,
              cantidad: item.quantity,
              precio: Number(item.product.price)
            }))
          );

          await this.generarTicket(data.orderID, userId);

          this.carritoService.vaciar();
          this.paypalButtonContainer.nativeElement.innerHTML = '';
        } catch (error) {
          console.error('Error al capturar el pago:', error);
          this.mensaje.set('Ocurrió un error al capturar el pago.');
        }
      },

      onCancel: () => { this.mensaje.set('Pago cancelado.'); },
      onError: (error: any) => {
        console.error('Error PayPal:', error);
        this.mensaje.set('Error en el proceso de PayPal.');
      }
    }).render(this.paypalButtonContainer.nativeElement);
  }

  private async crearUsuarioTemporal(): Promise<number> {
    try {
      const emailTemporal = `invitado_${Date.now()}@temp.com`;
      const response = await firstValueFrom(
        this.userService.registrarUsuario({
          email: emailTemporal,
          nombre: 'Invitado',
          apellido: 'Temp',
          telefono: 'N/A'
        })
      );
      return response.usuario?.id_usuario || 1;
    } catch {
      return 1;
    }
  }

  private async generarTicket(orderId: string, usuarioId: number): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.ticketService.generarTicket({
          orderId,
          id_usuario: usuarioId,
          metodo_pago: 'PayPal',
          subtotal: this.subtotal(),
          impuestos: this.impuestos(),
          total: this.total()
        })
      );
      this.ticketGenerado.set(response.ticket);
      this.mostrarTicket.set(true);
    } catch (error) {
      console.error('Error generando ticket:', error);
      this.mensaje.set('Pago exitoso, pero hubo un error al generar el ticket.');
    }
  }

  descargarXML(): void {
    const ticket = this.ticketGenerado();
    const items = this.itemsComprados();
    if (!ticket) return;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<recibo>\n`;
    xml += `  <ticket>\n`;
    xml += `    <id>${ticket.id_ticket}</id>\n`;
    xml += `    <orderId>${ticket.orderId}</orderId>\n`;
    xml += `    <fecha>${ticket.fecha_compra}</fecha>\n`;
    xml += `    <metodo_pago>${ticket.metodo_pago}</metodo_pago>\n`;
    xml += `    <estado>${ticket.estado}</estado>\n`;
    xml += `  </ticket>\n`;

    xml += `  <productos>\n`;
    for (const item of items) {
      xml += `    <producto>\n`;
      xml += `      <id>${item.id}</id>\n`;
      xml += `      <nombre>${this.escapeXml(item.nombre)}</nombre>\n`;
      xml += `      <cantidad>${item.cantidad}</cantidad>\n`;
      xml += `      <precio_unitario>${item.precio.toFixed(2)}</precio_unitario>\n`;
      xml += `      <subtotal_item>${(item.precio * item.cantidad).toFixed(2)}</subtotal_item>\n`;
      xml += `    </producto>\n`;
    }
    xml += `  </productos>\n`;

    xml += `  <totales>\n`;
    xml += `    <subtotal>${Number(ticket.subtotal).toFixed(2)}</subtotal>\n`;
    xml += `    <impuestos>${Number(ticket.impuestos).toFixed(2)}</impuestos>\n`;
    xml += `    <total>${Number(ticket.total).toFixed(2)}</total>\n`;
    xml += `  </totales>\n`;
    xml += `</recibo>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibo-${ticket.id_ticket}.xml`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private escapeXml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }

  cerrarTicket(): void {
    this.mostrarTicket.set(false);
    this.ticketGenerado.set(null);
    this.itemsComprados.set([]);
    this.mensaje.set('');
  }

  private initStarfield() {
    const existingStars = document.querySelectorAll('.star');
    if (existingStars.length > 0) return;
    const sf = document.getElementById('starfield');
    if (!sf) return;
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    for (let i = 0; i < 200; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      const size = rand(0.5, 2.5);
      const baseOp = rand(0.3, 0.9);
      s.style.cssText = `left:${rand(0,100)}%;top:${rand(0,100)}%;width:${size}px;height:${size}px;opacity:${baseOp};--base-op:${baseOp};`;
      if (Math.random() < 0.4) {
        s.classList.add(Math.random() < 0.5 ? 'twinkle' : 'twinkle-fast');
        s.style.setProperty('--dur', rand(2,6) + 's');
        s.style.setProperty('--delay', rand(0,5) + 's');
      }
      sf.appendChild(s);
    }
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('div');
      s.className = 'star twinkle';
      const size  = rand(2, 4);
      const color = Math.random() < 0.3 ? '#b0c8ff' : '#fff0cc';
      s.style.cssText = `left:${rand(0,100)}%;top:${rand(0,100)}%;width:${size}px;height:${size}px;background:${color};box-shadow:0 0 ${size*3}px ${color};--base-op:0.7;--dur:${rand(3,7)}s;--delay:${rand(0,4)}s;`;
      sf.appendChild(s);
    }
  }

  agregar(producto: Product) { this.carritoService.agregar(producto); }
  quitar(id: number) { this.carritoService.quitar(id); }
  removeAll(id: number) { this.carritoService.removeAll(id); }
  vaciar() { this.carritoService.vaciar(); }
}
