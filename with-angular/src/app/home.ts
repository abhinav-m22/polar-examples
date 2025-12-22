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
      <form (submit)="openPortal($event)">
        <input
          required
          type="email"
          name="email"
          [(ngModel)]="email"
          placeholder="Email"
        />
        <button type="submit">Continue</button>
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
