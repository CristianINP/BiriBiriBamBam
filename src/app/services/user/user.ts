import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface User {
  id_usuario: number;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  created_at?: string;
}

export interface UserRegistrationData {
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  usuario = signal<User | null>(null);

  constructor() {
    this.checkExistingSession();
  }

  private checkExistingSession(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const savedUser = localStorage.getItem('usuario_lcperfume');
    if (savedUser) {
      try {
        this.usuario.set(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('usuario_lcperfume');
      }
    }
  }

  registrarUsuario(data: UserRegistrationData) {
    return this.http.post<{ message: string; usuario: User }>(`${this.apiUrl}`, data);
  }

  loginUsuario(data: { email: string }) {
    return this.http.post<{ message: string; usuario: User }>(`${this.apiUrl}/login`, data);
  }

  obtenerUsuario(id: number) {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  setUsuario(usuario: User): void {
    this.usuario.set(usuario);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('usuario_lcperfume', JSON.stringify(usuario));
    }
  }

  clearUsuario(): void {
    this.usuario.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('usuario_lcperfume');
    }
  }

  getUsuarioActual(): User | null {
    return this.usuario();
  }
}
