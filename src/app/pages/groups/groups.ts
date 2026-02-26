import { Component } from '@angular/core';

@Component({
  selector: 'app-groups',
  template: `
    <div class="page-container">
      <h1>Gruppen</h1>
      <p>Hier werden deine Gruppen angezeigt.</p>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 16px;
      padding-bottom: 100px;
    }
    h1 {
      color: var(--color-text);
      margin-bottom: 8px;
    }
    p {
      color: var(--color-text-secondary);
    }
  `],
})
export class Groups {}
