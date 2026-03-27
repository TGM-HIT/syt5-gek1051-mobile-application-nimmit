import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { SupabaseConnector } from './supabase-connector';

@Injectable({
  providedIn: 'root',
})
export class LoginGuard implements CanActivate {
  constructor(
    private supabase: SupabaseConnector,
    private router: Router
  ) {}

  async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    const isAuthenticated = await this.supabase.getCurrentUser() !== null;
    if (isAuthenticated) {
      return this.router.createUrlTree(['/account']);
    }

    return true;
  }
}
