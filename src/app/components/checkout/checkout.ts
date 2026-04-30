import { AfterViewInit, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CarritoService } from '../../services/carrito/carrito/carrito';
import { PaypalService } from '../../services/paypal/paypal';
import { TicketService } from '../../services/ticket/ticket';
import { UserService } from '../../services/user/user';
import { environment } from '../../../environments/environment';

declare const paypal: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class Checkout implements AfterViewInit {
  @ViewChild('paypalButtonContainer')
  paypalButtonContainer!: ElementRef<HTMLDivElement>;

  private carritoService = inject(CarritoService);
  private paypalService = inject(PaypalService);
  private ticketService = inject(TicketService);
  private userService = inject(UserService);

  carrito = this.carritoService.carrito;
  total = this.carritoService.total;
  subtotal = this.carritoService.subtotal;
  impuestos = this.carritoService.impuestos;
  usuario = this.userService.usuario;

  mensaje = signal('');
  ticketGenerado = signal<any>(null);
  mostrarTicket = signal(false);

  ngAfterViewInit(): void {
    this.loadPaypalSdk().then(() => this.renderPaypalButton());
  }

  private loadPaypalSdk(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof paypal !== 'undefined') { 
        resolve(); 
        return; 
      }
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${environment.paypalClientId}&currency=MXN`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar el SDK de PayPal'));
      document.head.appendChild(script);
    });
  }

  private renderPaypalButton(): void {
    if (!this.paypalButtonContainer) return;
    if (this.carrito().length === 0) return;

    if (typeof paypal === 'undefined') {
      this.mensaje.set('No se cargó el SDK de PayPal.');
      return;
    }

    this.paypalButtonContainer.nativeElement.innerHTML = '';

    paypal.Buttons({
      style: {
        layout: 'horizontal',
        height: 55,
        color: 'gold',
        shape: 'rect',
        label: 'paypal'
      },

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
          console.error('Error al crear la orden:', error);
          this.mensaje.set('No se pudo crear la orden.');
          throw error;
        }
      },

      onApprove: async (data: any) => {
        try {
          const capture = await firstValueFrom(
            this.paypalService.capturarOrden(data.orderID)
          );
          console.log('Pago capturado:', capture);
          this.mensaje.set('Pago realizado correctamente.');
          
          const usuarioActual = this.usuario();
          let userId: number;
          
          if (!usuarioActual) {
            userId = await this.crearUsuarioTemporal();
          } else {
            userId = usuarioActual.id_usuario;
          }
          
          await this.generarTicket(data.orderID, userId);
          
          this.carritoService.vaciar();
          if (this.paypalButtonContainer) {
            this.paypalButtonContainer.nativeElement.innerHTML = '';
          }
        } catch (error) {
          console.error('Error al capturar el pago:', error);
          this.mensaje.set('Ocurrió un error al capturar el pago.');
        }
      },

      onCancel: () => {
        this.mensaje.set('El usuario canceló el pago.');
      },

      onError: (error: any) => {
        console.error('Error PayPal:', error);
        this.mensaje.set('Error en el proceso de PayPal.');
      }
    }).render(this.paypalButtonContainer.nativeElement);
  }

  async crearUsuarioTemporal(): Promise<number> {
    try {
      const emailTemporal = `invitado_${Date.now()}@temp.com`;
      const usuarioTemp = await firstValueFrom(
        this.userService.registrarUsuario({
          email: emailTemporal,
          nombre: 'Invitado',
          apellido: 'Temp',
          telefono: 'N/A'
        })
      );
      return usuarioTemp.usuario?.id_usuario || 1;
    } catch (error) {
      console.error('Error creando usuario temporal:', error);
      return 1;
    }
  }

  async generarTicket(orderId: string, usuarioId: number): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.ticketService.generarTicket({
          orderId: orderId,
          id_usuario: usuarioId,
          metodo_pago: 'PayPal',
          subtotal: this.subtotal(),
          impuestos: this.impuestos(),
          total: this.total()
        })
      );
      
      this.ticketGenerado.set(response.ticket);
      this.mostrarTicket.set(true);
      console.log('Ticket generado:', response.ticket);
    } catch (error) {
      console.error('Error generando ticket:', error);
      this.mensaje.set('Error generando el ticket, pero el pago fue exitoso.');
    }
  }

  descargarTicketPDF(): void {
    const ticket = this.ticketGenerado();
    if (!ticket) return;
    console.log('Descargando ticket PDF:', ticket);
    this.mensaje.set('Función de PDF en desarrollo...');
  }

  descargarTicketXML(): void {
    this.carritoService.exportarXML();
  }

  cerrarTicket(): void {
    this.mostrarTicket.set(false);
    this.ticketGenerado.set(null);
    this.mensaje.set('');
  }
}
