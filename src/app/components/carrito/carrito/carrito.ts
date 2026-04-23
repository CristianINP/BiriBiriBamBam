import { Component, computed, inject, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
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
export class CarritoComponent implements AfterViewInit {
  @ViewChild('paypalButtonContainer')
  paypalButtonContainer!: ElementRef<HTMLDivElement>;

  private carritoService = inject(CarritoService);
  private paypalService = inject(PaypalService);

  groupedItems = this.carritoService.groupedItems;
  total = computed(() => this.carritoService.total());
  subtotal = computed(() => this.carritoService.subtotal());
  impuestos = computed(() => this.carritoService.impuestos());
  totalConImpuestos = computed(() => this.carritoService.totalConImpuestos());

  mensaje = '';

  ngAfterViewInit() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      setTimeout(() => this.initStarfield(), 100);
      this.loadPaypalSdk().then(() => this.renderPaypalButton());
    }
  }

  private loadPaypalSdk(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof paypal !== 'undefined') { resolve(); return; }
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${environment.paypalClientId}&currency=MXN`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar el SDK de PayPal'));
      document.head.appendChild(script);
    });
  }

  private renderPaypalButton(): void {
    if (this.groupedItems().length === 0) return;
    if (typeof paypal === 'undefined') {
      this.mensaje = 'No se cargó el SDK de PayPal.';
      return;
    }
    if (!this.paypalButtonContainer) return;

    this.paypalButtonContainer.nativeElement.innerHTML = '';

    paypal.Buttons({
      createOrder: async () => {
        try {
          const items = this.carritoService.carrito();
          const response = await firstValueFrom(
            this.paypalService.crearOrden({ items, total: this.totalConImpuestos() })
          );
          return response.id;
        } catch (error) {
          console.error('Error al crear la orden:', error);
          this.mensaje = 'No se pudo crear la orden.';
          throw error;
        }
      },

      onApprove: async (data: any) => {
        try {
          const capture = await firstValueFrom(
            this.paypalService.capturarOrden(data.orderID)
          );
          console.log('Pago capturado:', capture);
          this.mensaje = 'Pago realizado correctamente.';
          this.carritoService.vaciar();
          this.paypalButtonContainer.nativeElement.innerHTML = '';
        } catch (error) {
          console.error('Error al capturar el pago:', error);
          this.mensaje = 'Ocurrió un error al capturar el pago.';
        }
      },

      onCancel: () => {
        this.mensaje = 'Pago cancelado.';
      },

      onError: (error: any) => {
        console.error('Error PayPal:', error);
        this.mensaje = 'Error en el proceso de PayPal.';
      }
    }).render(this.paypalButtonContainer.nativeElement);
  }

  private initStarfield() {
    // Skip if already initialized
    const existingStars = document.querySelectorAll('.star');
    if (existingStars.length > 0) return;

    const sf = document.getElementById('starfield');
    if (!sf) return;

    const STAR_COUNT = 200;

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    // Generate stars
    for (let i = 0; i < STAR_COUNT; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      const size = rand(0.5, 2.5);
      const x = rand(0, 100);
      const y = rand(0, 100);
      const baseOp = rand(0.3, 0.9);

      s.style.cssText = `
        left: ${x}%;
        top: ${y}%;
        width: ${size}px;
        height: ${size}px;
        opacity: ${baseOp};
        --base-op: ${baseOp};
      `;

      if (Math.random() < 0.4) {
        const dur = rand(2, 6);
        const delay = rand(0, 5);
        s.classList.add(Math.random() < 0.5 ? 'twinkle' : 'twinkle-fast');
        s.style.setProperty('--dur', dur + 's');
        s.style.setProperty('--delay', delay + 's');
      }

      sf.appendChild(s);
    }

    // Some brighter stars with glow
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('div');
      s.className = 'star twinkle';
      const size = rand(2, 4);
      const color = Math.random() < 0.3 ? '#b0c8ff' : '#fff0cc';
      s.style.cssText = `
        left: ${rand(0, 100)}%;
        top: ${rand(0, 100)}%;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        box-shadow: 0 0 ${size * 3}px ${color};
        --base-op: 0.7;
        --dur: ${rand(3, 7)}s;
        --delay: ${rand(0, 4)}s;
      `;
      sf.appendChild(s);
    }
  }

  agregar(producto: Product) {
    this.carritoService.agregar(producto);
  }

  quitar(id: number) {
    this.carritoService.quitar(id);
  }

  removeAll(id: number) {
    this.carritoService.removeAll(id);
  }

  vaciar() {
    this.carritoService.vaciar();
  }

  exportarXML() {
    this.carritoService.exportarXML();
  }
}
