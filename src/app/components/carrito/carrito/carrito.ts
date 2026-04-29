import {
  Component,
  computed,
  inject,
  AfterViewInit,
  ElementRef,
  ViewChild,
  signal,
  OnDestroy,
  NgZone,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CarritoService } from '../../../services/carrito/carrito/carrito';
import { PaypalService } from '../../../services/paypal/paypal';
import { Product } from '../../../models/producto/producto';
import { Navbar } from '../../navbar/navbar';
import { Footer } from '../../footer/footer';
import { environment } from '../../../../environments/environment';

declare const paypal: any;

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, Navbar, Footer],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class CarritoComponent implements AfterViewInit, OnDestroy {
  @ViewChild('paypalButtonContainer')
  paypalButtonContainer!: ElementRef<HTMLDivElement>;

  private carritoService = inject(CarritoService);
  private paypalService  = inject(PaypalService);
  private zone           = inject(NgZone);
  private platformId     = inject(PLATFORM_ID);

  groupedItems      = this.carritoService.groupedItems;
  subtotal          = computed(() => this.carritoService.subtotal());
  impuestos         = computed(() => this.carritoService.impuestos());
  totalConImpuestos = computed(() => this.carritoService.totalConImpuestos());

  mensaje        = signal('');
  pagoExitoso    = signal(false);
  folioPago      = signal('');
  cargandoPaypal = signal(false);

  private sdkCargado     = false;
  private renderTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastItemCount  = -1;
  private watchInterval: ReturnType<typeof setInterval> | null = null;
  // Evita destruir el contenedor mientras PayPal tiene un botón activo
  private paypalButtonActive = false;

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

    // Snapshot de los datos ANTES de abrir el popup — evita que el carrito
    // esté vacío cuando PayPal llame a createOrder
    const itemsSnapshot  = this.carritoService.carrito();
    const totalSnapshot  = this.totalConImpuestos();

    this.paypalButtonActive = false; // se marca true cuando el botón monta
    paypal.Buttons({
      style: {
        layout: 'vertical',
        color:  'gold',
        shape:  'rect',
        label:  'paypal',
      },

      createOrder: async () => {
        try {
          const res = await firstValueFrom(
            this.paypalService.crearOrden({ items: itemsSnapshot, total: totalSnapshot })
          );
          return res.id;
        } catch (err) {
          this.zone.run(() => this.mensaje.set('No se pudo crear la orden de pago.'));
          throw err;
        }
      },

      onApprove: async (data: { orderID: string }) => {
        this.zone.run(() => this.mensaje.set('Procesando pago…'));
        try {
          const capture = await firstValueFrom(
            this.paypalService.capturarOrden(data.orderID)
          );

          const folio = 'ORD-' + Date.now();

          // Guardar en BD (sin bloquear si falla)
          await this.guardarPedidoEnBD(folio, data.orderID, capture);

          // Descargar XML del recibo
          this.carritoService.descargarReciboXML(folio, data.orderID);

          this.zone.run(() => {
            this.folioPago.set(folio);
            this.pagoExitoso.set(true);
            this.mensaje.set('');
            this.carritoService.vaciar();
            container.innerHTML = '';
          });
        } catch (err) {
          console.error('Error capturando pago:', err);
          this.zone.run(() =>
            this.mensaje.set('Ocurrió un error al capturar el pago. Contacta soporte.')
          );
        }
      },

      onCancel: () => {
        this.zone.run(() => this.mensaje.set('Pago cancelado. Puedes intentarlo de nuevo.'));
      },

      onError: (err: any) => {
        console.error('PayPal error:', err);
        this.zone.run(() => this.mensaje.set('Error en PayPal. Intenta de nuevo.'));
      },
    }).render(container).then(() => {
      this.paypalButtonActive = true;
    }).catch(() => {
      this.paypalButtonActive = false;
    });
  }

  private async guardarPedidoEnBD(folio: string, paypalOrderId: string, captureData: any) {
    try {
      await firstValueFrom(
        this.paypalService.guardarPedido({
          folio,
          paypalOrderId,
          paypalEstado: captureData?.status ?? 'COMPLETED',
          subtotal: this.carritoService.subtotal(),
          iva:      this.carritoService.impuestos(),
          total:    this.carritoService.totalConImpuestos(),
          items: this.carritoService.groupedItems().map(item => ({
            producto_id:     item.product.id,
            nombre_producto: item.product.name,
            categoria:       item.product.category ?? '',
            cantidad:        item.quantity,
            precio_unitario: item.product.price,
            importe:         item.product.price * item.quantity,
          })),
        })
      );
    } catch (err) {
      console.error('Error guardando pedido en BD (no crítico):', err);
    }
  }

  private initStarfield() {
    if (document.querySelectorAll('.star').length > 0) return;
    const sf = document.getElementById('starfield');
    if (!sf) return;

    const rand = (a: number, b: number) => Math.random() * (b - a) + a;

    for (let i = 0; i < 200; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      const size   = rand(0.5, 2.5);
      const baseOp = rand(0.3, 0.9);
      s.style.cssText = `left:${rand(0,100)}%;top:${rand(0,100)}%;width:${size}px;height:${size}px;opacity:${baseOp};--base-op:${baseOp};`;
      if (Math.random() < 0.4) {
        s.classList.add(Math.random() < 0.5 ? 'twinkle' : 'twinkle-fast');
        s.style.setProperty('--dur',   rand(2, 6) + 's');
        s.style.setProperty('--delay', rand(0, 5) + 's');
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

  agregar(producto: Product)  { this.carritoService.agregar(producto); }
  quitar(id: number)           { this.carritoService.quitar(id); }
  removeAll(id: number)        { this.carritoService.removeAll(id); }
  vaciar()                     { this.carritoService.vaciar(); }
  exportarXML()                { this.carritoService.exportarXML(); }
}