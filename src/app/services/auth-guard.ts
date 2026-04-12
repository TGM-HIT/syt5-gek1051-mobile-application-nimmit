import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { SupabaseConnector } from './supabase-connector';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private supabase: SupabaseConnector,
    private router: Router
  ) {}

  async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    const isAuthenticated = await this.supabase.getCurrentUser();
    if (isAuthenticated == null) {
      return this.router.createUrlTree(['/login']);
    }
    return true;
  }
}