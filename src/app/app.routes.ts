import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth-guard';
import { LoginGuard } from './services/login-guard';
import { ListGuard } from './services/list-guard';
import { OfflineCheckGuard } from './services/offline-check-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    loadComponent: () => import('./pages/shopping-list/shopping-list').then((m) => m.ShoppingList),
    canActivate: [ListGuard]
  },
  {
    path: "lists",
    loadComponent: () => import("./pages/shopping-list/shopping-lists").then((m) => m.ShoppingLists),
  },
  {
    path: 'groups',
    loadComponent: () => import('./pages/groups/groups').then((m) => m.Groups),
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings').then((m) => m.Settings),
  },
  {
    path: 'login',
    loadComponent: () => import('./authentication/login/login').then((m) => m.Login),
    canActivate: [OfflineCheckGuard, LoginGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./authentication/register/register').then((m) => m.Register),
    canActivate: [OfflineCheckGuard, LoginGuard]
  },
  {
    path: 'offline',
    loadComponent: () => import('./pages/offline/offline').then((m) => m.Offline),
  },
  {
    path: 'account',
    loadComponent: () => import('./authentication/account/account').then((m) => m.Account),
    canActivate: [AuthGuard]
  },
  {
    path: 'not-found',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
  },
  {
    path: '**',
    redirectTo: 'not-found',
  },
];
