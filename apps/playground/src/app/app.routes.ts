import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'simple-store',
    loadComponent: () =>
      import('./simple-store/simple-store.component').then(
        (c) => c.SimpleStoreComponent
      ),
  },
];
