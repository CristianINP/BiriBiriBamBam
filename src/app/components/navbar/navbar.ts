import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarritoService } from '../../services/carrito/carrito/carrito';
import { SearchService } from '../../services/search/search';
import { FormsModule } from '@angular/forms';

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
    private searchService: SearchService
  ) {}

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
}
