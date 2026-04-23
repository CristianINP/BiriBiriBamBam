import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaypalService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/paypal`;

  crearOrden(payload: { items: { nombre: string; cantidad: number; precio: number }[]; total: number }) {
    return this.http.post<{ id: string; status: string }>(`${this.apiUrl}/create-order`, payload);
  }

  capturarOrden(orderId: string) {
    return this.http.post<any>(`${this.apiUrl}/capture-order`, { orderId });
  }
}
