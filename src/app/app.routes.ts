import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { CarritoComponent } from './components/carrito/carrito/carrito';
import { Contactos } from './components/contactos/contactos';
import { Privacidad } from './components/privacidad/privacidad';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'catalogo', component: Home },
  { path: 'carrito', component: CarritoComponent },
  { path: 'contactos', component: Contactos },
  { path: 'privacidad', component: Privacidad },
  { path: '**', redirectTo: '' },
];
