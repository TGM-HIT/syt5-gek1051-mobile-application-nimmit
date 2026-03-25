import { ShoppingListDataService } from './shopping-list-data.service';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { PowerSyncService } from './powersync';
import { filter, firstValueFrom, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ListGuard {
  constructor(
    private shoppingListService: ShoppingListDataService,
    private powerSync: PowerSyncService,
    private router: Router
  ) {}

  

  async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    const listId = next.queryParams['listId'];
    if (!listId) {
      return this.router.createUrlTree(['/not-found']);
    }

    await this.powerSync.waitForPowerSyncReady();
    
    if (!await this.shoppingListService.listExists(BigInt(listId))) {
      return this.router.createUrlTree([`/not-found?liste=${listId}`]);
    }
    return true;
  }
}
