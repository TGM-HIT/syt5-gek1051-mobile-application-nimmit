import { Component } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-groups',
  imports: [TranslocoModule],
  template: `
    <div class="page-container">
      <h1>{{ 'groups.title' | transloco }}</h1>
      <p>{{ 'groups.subtitle' | transloco }}</p>
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
