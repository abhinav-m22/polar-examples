import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

interface Product {
  id: string;
  name: string;
  description?: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  template: `
    <div class="bg-white flex flex-col items-center justify-center gap-16 min-h-screen">
      <div class="w-[360px] max-w-[90%] flex flex-col gap-3">
        @for (product of products(); track product.id) {
          <a 
            [href]="'/api/checkout?products=' + product.id" 
            target="_blank"
            class="block text-center px-4 py-3 border rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-900 transition"
          >
            Buy {{ product.name }}
          </a>
        } @empty {
          <p class="text-center text-gray-500">No products available</p>
        }
      </div>
      <form action="/api/portal" method="get" class="flex gap-2">
        <input 
          required
          type="email" 
          name="email" 
          placeholder="Email"
          class="px-4 py-2 text-base border rounded-lg w-[260px] focus:outline-none focus:border-black"
        />
        <button 
          type="submit" 
          class="px-6 py-2 text-base bg-black text-white rounded-lg hover:opacity-80 transition"
        >
          Continue
        </button>
      </form>
    </div>
  `,
})
export default class Home {
  private http = inject(HttpClient);
  products = toSignal(this.http.get<Product[]>('/api/products'), { initialValue: [] });
}
