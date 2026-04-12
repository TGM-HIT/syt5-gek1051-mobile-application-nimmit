import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, TranslocoModule],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound {
  private readonly route = inject(ActivatedRoute);
  private readonly transloco = inject(TranslocoService);

  readonly missingType = computed(() => {
    const key = this.route.snapshot.queryParamMap.keys[0];

    if (!key) {
      return null;
    }

    return this.formatType(key);
  });

  readonly missingId = computed(() => {
    const key = this.route.snapshot.queryParamMap.keys[0];

    if (!key) {
      return null;
    }

    const id = this.route.snapshot.queryParamMap.get(key)?.trim();
    return id || null;
  });

  private formatType(rawType: string): string {
    const cleaned = rawType.replace(/[_-]+/g, ' ').trim();

    if (!cleaned) {
      return this.transloco.translate('notFound.defaultType');
    }

    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

}
