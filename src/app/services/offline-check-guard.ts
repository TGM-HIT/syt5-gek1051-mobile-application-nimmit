import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class OfflineCheckGuard implements CanActivate {
  constructor(private readonly router: Router) {}

  canActivate(): boolean | UrlTree {
    if (!navigator.onLine) {
      return this.router.createUrlTree(['/offline']);
    }

    return true;
  }
}
