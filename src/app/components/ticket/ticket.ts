import { Component, inject, signal, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketService } from '../../services/ticket/ticket';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './ticket.html',
  styleUrl: './ticket.css'
})
export class TicketComponent implements OnInit {
  private ticketService = inject(TicketService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ticket = signal<any>(null);
  usuario = signal<any>(null);
  cargando = signal(false);
  error = signal<string | null>(null);
  navigatorShare = typeof navigator !== 'undefined' && !!navigator.share;

  ngOnInit(): void {
    this.cargarTicket();
  }

  async cargarTicket(): Promise<void> {
    const ticketId = this.route.snapshot.paramMap.get('id');
    const orderId = this.route.snapshot.paramMap.get('orderId');

    if (!ticketId && !orderId) {
      this.error.set('No se especificó ticket ni orden');
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    try {
      let ticketData: any;

      if (ticketId) {
        ticketData = await firstValueFrom(
          this.ticketService.obtenerTicketConDetalles(Number(ticketId))
        );
      } else if (orderId) {
        const ticket = await firstValueFrom(
          this.ticketService.obtenerTicketPorOrden(orderId)
        );
        ticketData = await firstValueFrom(
          this.ticketService.obtenerTicketConDetalles(ticket.id_ticket)
        );
      }

      this.ticket.set(ticketData);
      this.usuario.set({
        nombre: ticketData.nombre,
        apellido: ticketData.apellido,
        email: ticketData.email,
        telefono: ticketData.telefono
      });
    } catch (err: any) {
      this.error.set(err.message || 'Error al cargar el ticket');
      console.error('Error:', err);
    } finally {
      this.cargando.set(false);
    }
  }

  cerrarTicket(): void {
    this.router.navigate(['/']);
  }

  descargarPDF(): void {
    const ticket = this.ticket();
    if (!ticket) return;
    const contenido = this.generarContenidoPDF(ticket);
    const blob = new Blob([contenido], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${ticket.id_ticket}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private generarContenidoPDF(ticket: any): string {
    let contenido = `%PDF-1.4\n`;
    contenido += `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
    contenido += `2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n`;
    contenido += `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n`;
    contenido += `4 0 obj\n<< /Length 100 >>\nstream\nBT /F1 12 Tf 100 700 Td (Ticket #${ticket.id_ticket}) Tj ET\nendstream\nendobj\n`;
    contenido += `xref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000239 00000 n\n`;
    contenido += `trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n336\n%%EOF`;
    return contenido;
  }

  compartirTicket(): void {
    if (this.navigatorShare && this.ticket()) {
      navigator.share({
        title: `Ticket #${this.ticket().id_ticket}`,
        text: `Ticket de compra por $${this.ticket().total}`,
        url: window.location.href
      }).catch(err => console.log('Error al compartir:', err));
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
