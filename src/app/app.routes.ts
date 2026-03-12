import { Routes } from '@angular/router';
import { Catalogo } from './components/catalogo/catalogo';
import { CarritoComponent } from './components/carrito/carrito/carrito';

export const routes: Routes = [
  { path: '', component: Catalogo },
  { path: 'carrito', component: CarritoComponent },
  { path: '**', redirectTo: '' },
];
