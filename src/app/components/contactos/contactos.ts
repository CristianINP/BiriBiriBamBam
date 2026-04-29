import { Component, signal, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

@Component({
  selector: 'app-contactos',
  standalone: true,
  imports: [FormsModule, Navbar, Footer],
  templateUrl: './contactos.html',
  styleUrl: './contactos.css',
})
export class Contactos implements AfterViewInit {
  formData: ContactForm = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };

  showSuccess = signal(false);

  ngAfterViewInit() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      setTimeout(() => this.initStarfield(), 100);
    }
  }

  private initStarfield() {
    const existingStars = document.querySelectorAll('.star');
    if (existingStars.length > 0) return;

    const sf = document.getElementById('starfield');
    if (!sf) return;

    const STAR_COUNT = 280;
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

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

  onSubmit(event: Event) {
    event.preventDefault();
    console.log('Form submitted:', this.formData);
    
    this.showSuccess.set(true);
    
    this.formData = {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    };
    
    setTimeout(() => this.showSuccess.set(false), 3000);
  }
}
