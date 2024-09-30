import { Route } from '@angular/router';

import { DefaultStore, OptionsStore, USER_STORE } from './state';

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
  }
];
