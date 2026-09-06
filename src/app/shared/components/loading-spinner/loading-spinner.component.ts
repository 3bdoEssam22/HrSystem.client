import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `<div class="loading-spinner" role="status" aria-label="Loading">Loading…</div>`,
  styleUrl: './loading-spinner.component.css',
})
export class LoadingSpinnerComponent {}