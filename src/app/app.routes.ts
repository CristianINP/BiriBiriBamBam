import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { CarritoComponent } from './components/carrito/carrito/carrito';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'carrito', component: CarritoComponent },
  { path: '**', redirectTo: '' },
];
