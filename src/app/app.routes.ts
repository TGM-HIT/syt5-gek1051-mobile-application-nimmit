import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    loadComponent: () => import('./pages/shopping-list/shopping-list').then((m) => m.ShoppingList),
  },
  {
    path: 'groups',
    loadComponent: () => import('./pages/groups/groups').then((m) => m.Groups),
  },
  {
    path: 'favourites',
    loadComponent: () => import('./pages/favourites/favourites').then((m) => m.Favourites),
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings').then((m) => m.Settings),
  },
  {
    path: 'login',
    loadComponent: () => import('./authentication/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./authentication/register/register').then((m) => m.Register),
  },
  {
    path: 'account',
    loadComponent: () => import('./authentication/account/account').then((m) => m.Account),
  },
];
