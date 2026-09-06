import { Component, input } from '@angular/core';
import { AppError } from '../../../core/models/models';

@Component({
  selector: 'app-error-banner',
  standalone: true,
  template: `
    <div class="error-banner" role="alert">
      <p class="error-banner__detail">{{ error()?.detail }}</p>
      @if (fieldNames().length > 0) {
        <ul class="error-banner__list">
          @for (field of fieldNames(); track field) {
            @for (msg of error()!.validationErrors![field]; track msg) {
              <li>{{ field }}: {{ msg }}</li>
            }
          }
        </ul>
      }
    </div>
  `,
  styleUrl: './error-banner.component.css',
})
export class ErrorBannerComponent {
  error = input<AppError | null>(null);

  fieldNames(): string[] {
    const err = this.error();
    return err?.validationErrors ? Object.keys(err.validationErrors) : [];
  }
}