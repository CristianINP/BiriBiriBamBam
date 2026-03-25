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
    // Simulate form submission
    console.log('Form submitted:', this.formData);
    
    // Show success message
    this.showSuccess.set(true);
    
    // Reset form
    this.formData = {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    };
    
    // Hide success message after 3 seconds
    setTimeout(() => this.showSuccess.set(false), 3000);
  }
}
