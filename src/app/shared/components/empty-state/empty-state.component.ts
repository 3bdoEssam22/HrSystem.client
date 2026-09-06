import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state">
      <p>{{ message() }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './empty-state.component.css',
})
export class EmptyStateComponent {
  message = input<string>('Nothing here yet.');
}