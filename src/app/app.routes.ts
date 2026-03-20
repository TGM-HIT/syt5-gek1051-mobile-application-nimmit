import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth-guard';
import { LoginGuard } from './services/login-guard';

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
    canActivate: [LoginGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./authentication/register/register').then((m) => m.Register),
    canActivate: [LoginGuard]
  },
  {
    path: 'account',
    loadComponent: () => import('./authentication/account/account').then((m) => m.Account),
    canActivate: [AuthGuard]
  },
];
