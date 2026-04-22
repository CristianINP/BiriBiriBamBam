import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
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
