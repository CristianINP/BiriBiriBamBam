import { Component } from '@angular/core';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-privacidad',
  standalone: true,
  imports: [Navbar, Footer],
  templateUrl: './privacidad.html',
  styleUrl: './privacidad.css',
})
export class Privacidad {}
