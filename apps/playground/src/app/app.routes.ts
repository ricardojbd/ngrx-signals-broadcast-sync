import { Route } from '@angular/router';

import { DefaultStore, FilterDuplicatedStore, FilterStateStore, OptionsStore, RequestStore, USER_STORE } from './state';

export const appRoutes: Route[] = [
  {
    path: 'default',
    loadComponent: () => import('./components/display.component').then((c) => c.DisplayComponent),
    providers: [{ provide: USER_STORE, useClass: DefaultStore }],
    data: { title: 'Default' }
  },
  {
    path: 'options',
    loadComponent: () => import('./components/display.component').then((c) => c.DisplayComponent),
    providers: [{ provide: USER_STORE, useClass: OptionsStore }],
    data: { title: 'Options' }
  },
  {
    path: 'request',
    loadComponent: () => import('./components/display.component').then((c) => c.DisplayComponent),
    providers: [{ provide: USER_STORE, useClass: RequestStore }],
    data: { title: 'Request' }
  },
  {
    path: 'filter-state',
    loadComponent: () => import('./components/display.component').then((c) => c.DisplayComponent),
    providers: [{ provide: USER_STORE, useClass: FilterStateStore }],
    data: { title: 'FilterState' }
  },
  {
    path: 'filter-duplicated',
    loadComponent: () => import('./components/display.component').then((c) => c.DisplayComponent),
    providers: [{ provide: USER_STORE, useClass: FilterDuplicatedStore }],
    data: { title: 'FilterDuplicated' }
  }
];
