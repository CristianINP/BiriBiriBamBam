import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarritoService } from '../../services/carrito/carrito/carrito';
import { SearchService } from '../../services/search/search';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user/user';
import { User } from '../../services/user/user';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  searchQuery = signal('');

  constructor(
    public carritoService: CarritoService,
    private searchService: SearchService,
    private userService: UserService
  ) {}

  get usuario(): User | null {
    return this.userService.usuario();
  }

  onSearch() {
    this.searchService.setSearch(this.searchQuery());
    this.goToCatalog();
  }

  clearSearch() {
    this.searchQuery.set('');
    this.searchService.setSearch('');
  }

  goHome() {
    window.location.href = '/';
  }

  goToCatalog() {
    const catalog = document.getElementById('catalogo-section');
    if (catalog) {
      catalog.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/#catalogo-section';
    }
  }

  logout() {
    this.userService.clearUsuario();
    window.location.href = '/';
  }
}

