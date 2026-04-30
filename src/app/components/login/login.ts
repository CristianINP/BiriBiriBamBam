import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UserService, User } from '../../services/user/user';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink, NgIf],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private userService = inject(UserService);

  get usuario(): User | null {
    return this.userService.usuario();
  }

  email = '';
  nombre = '';
  apellido = '';
  telefono = '';
  
  modoRegistro = false;
  mensaje = '';
  cargando = false;

  alternarModo(): void {
    this.modoRegistro = !this.modoRegistro;
    this.limpiar();
  }

  async submit(): Promise<void> {
    if (!this.email) {
      this.mensaje = 'Por favor ingrese su email';
      return;
    }

    this.cargando = true;
    this.mensaje = '';

    try {
      let response: any;

      if (this.modoRegistro) {
        if (!this.nombre || !this.apellido) {
          this.mensaje = 'Por favor complete todos los campos';
          this.cargando = false;
          return;
        }
        response = await firstValueFrom(
          this.userService.registrarUsuario({
            email: this.email,
            nombre: this.nombre,
            apellido: this.apellido,
            telefono: this.telefono
          })
        );
      } else {
        response = await firstValueFrom(
          this.userService.loginUsuario({ email: this.email })
        );
      }

      this.userService.setUsuario(response.usuario);
      this.mensaje = response.message;
    } catch (error: any) {
      console.error('Error:', error);
      this.mensaje = error.error?.error || 'Error al procesar la solicitud';
    } finally {
      this.cargando = false;
    }
  }

  limpiar(): void {
    this.email = '';
    this.nombre = '';
    this.apellido = '';
    this.telefono = '';
    this.mensaje = '';
  }

  cerrarSesion(): void {
    this.userService.clearUsuario();
    this.mensaje = 'Sesión cerrada exitosamente';
    this.limpiar();
    this.modoRegistro = false;
  }
}
