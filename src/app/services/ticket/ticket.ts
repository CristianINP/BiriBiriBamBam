import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Ticket {
  id_ticket: number;
  orderId: string;
  id_usuario: number;
  fecha_compra: string;
  metodo_pago: string;
  subtotal: number;
  impuestos: number;
  total: number;
  estado: string;
  created_at: string;
}

export interface TicketDetails extends Ticket {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  productos: Array<{
    product_id: number;
    name: string;
    price: number;
    quantity: number;
    price_unit: number;
  }>;
}

export interface TicketCreateData {
  orderId: string;
  id_usuario: number;
  metodo_pago: string;
  subtotal: number;
  impuestos: number;
  total: number;
  estado?: string;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tickets`;

  constructor() { }

  generarTicket(data: TicketCreateData) {
    return this.http.post<{ message: string; ticket: Ticket }>(`${this.apiUrl}`, data);
  }

  obtenerTicket(id: number) {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
  }

  obtenerTicketPorOrden(orderId: string) {
    return this.http.get<Ticket>(`${this.apiUrl}/order/${orderId}`);
  }

  obtenerTicketsPorUsuario(usuarioId: number) {
    return this.http.get<Ticket[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  obtenerTicketConDetalles(id: number) {
    return this.http.get<TicketDetails>(`${this.apiUrl}/detalle/${id}`);
  }

  obtenerReporteCompras(usuarioId: number) {
    return this.http.get<{
      id_usuario: number;
      cliente: string;
      email: string;
      total_compras: number;
      gasto_total: number;
    }>(`${this.apiUrl}/reporte/${usuarioId}`);
  }
}
