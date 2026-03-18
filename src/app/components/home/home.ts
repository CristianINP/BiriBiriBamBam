import { Component, signal, OnInit, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { RouterLink } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { Catalogo } from '../catalogo/catalogo';
import { CarritoService } from '../../services/carrito/carrito/carrito';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, Navbar, Footer, Catalogo],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, AfterViewInit {
  showModal = signal(false);
  modalProductName = signal('');

  constructor(
    public carritoService: CarritoService,
    private router: Router
  ) {}

  ngOnInit() {
    // Scroll to top on navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      window.scrollTo(0, 0);
    });
  }

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

    const STAR_COUNT = 280;

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
    for (let i = 0; i < 18; i++) {
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

    // Shooting stars
    const launchShootingStar = () => {
      const ss = document.createElement('div');
      ss.className = 'shooting-star';

      const angle = rand(-20, -5);
      const length = rand(120, 280);
      const top = rand(5, 55);
      const left = rand(-10, 60);
      const dist = rand(250, 500);
      const dur = rand(1.8, 3.2);
      const delay = rand(0, 0.5);

      ss.style.cssText = `
        top: ${top}%;
        left: ${left}%;
        width: ${length}px;
        transform: rotate(${angle}deg);
        --dist: ${dist}px;
        --sdur: ${dur}s;
        animation-delay: ${delay}s;
      `;

      sf.appendChild(ss);
      setTimeout(() => ss.remove(), (dur + delay + 1) * 1000);
    };

    const scheduleShootingStar = () => {
      launchShootingStar();
      setTimeout(scheduleShootingStar, rand(3500, 9000));
    };

    setTimeout(scheduleShootingStar, 2000);
    setTimeout(scheduleShootingStar, 5500);
  }

  onNavigate() {
    window.scrollTo(0, 0);
  }
}
