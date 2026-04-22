import { Component, signal } from '@angular/core';
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
export class Contactos {
  formData: ContactForm = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };

  showSuccess = signal(false);

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
