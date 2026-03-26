import { Component, computed, inject, AfterViewInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CarritoService } from '../../../services/carrito/carrito/carrito';
import { Product } from '../../../models/producto/producto';
import { Navbar } from '../../navbar/navbar';
import { Footer } from '../../footer/footer';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, Navbar, Footer],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class CarritoComponent implements AfterViewInit {
  private carritoService = inject(CarritoService);
  
  groupedItems = this.carritoService.groupedItems;
  total = computed(() => this.carritoService.total());
  subtotal = computed(() => this.carritoService.subtotal());
  impuestos = computed(() => this.carritoService.impuestos());
  totalConImpuestos = computed(() => this.carritoService.totalConImpuestos());

  ngAfterViewInit() {
    // Initialize starfield after view is loaded (only in browser)
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      setTimeout(() => this.initStarfield(), 100);
    }
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
