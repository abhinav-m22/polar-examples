import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Product {
  id: string;
  name: string;
}

@Component({
  selector: 'app-home',
  imports: [FormsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <form (submit)="openPortal($event)" class="flex gap-2">
        <input
          required
          type="email"
          name="email"
          [(ngModel)]="email"
          placeholder="Email"
          class="px-4 py-2 text-base border rounded-lg w-[260px] focus:outline-none focus:border-black"
        />
        <button type="submit" class="px-6 py-2 text-base bg-black text-white rounded-lg hover:opacity-80 transition">Continue</button>
      </form>
      <div class="w-[360px] max-w-[90%] flex flex-col gap-3">
        @if (loading()) {
          <p>Loading products...</p>
        } @else if (error()) {
          <p class="error">{{ error() }}</p>
        } @else if (products().length === 0) {
          <p>No products available.</p>
        } @else {
          <div class="contents">
            @for (product of products(); track product.id) {
              <a
                target="_blank"
                [href]="'/checkout?products=' + product.id"
                class="block text-center px-4 py-3 border rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-900 transition"
              >
                Buy {{ product.name }}
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class HomeComponent implements OnInit {
  private readonly http = inject(HttpClient);
  
  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected email = '';

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<Product[]>('/api/products').subscribe({
      next: (data) => {
        this.products.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load products. Please try again later.');
        this.loading.set(false);
        console.error('Error loading products:', err);
      }
    });
  }

  protected openPortal(event: Event): void {
    event.preventDefault();
    if (this.email) {
      window.location.href = `/portal?email=${encodeURIComponent(this.email)}`;
    }
  }
}
