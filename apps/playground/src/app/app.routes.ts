import { Route } from '@angular/router';
import {
  BroadcastStateInterceptorStore,
  ChannelOptionStore,
  ChannelStore,
  MessageEventInterceptorStore,
  OnMessageErrorStore,
  RequestStateStore,
  SelectStore,
  USER_STORE
} from './state';

export const appRoutes: Route[] = [
  {
    path: 'channelString',
    loadComponent: () => import('./components/display.component').then((c) => c.DisplayComponent),
    providers: [{ provide: USER_STORE, useClass: ChannelStore }],
    data: { title: 'Channel String' }
  },
  {
    path: 'channelOptions',
    loadComponent: () => import('./components/display.component').then((c) => c.DisplayComponent),
    providers: [{ provide: USER_STORE, useClass: ChannelOptionStore }],
    data: { title: 'Channel Options' }
  },
  {
    path: 'select',
    loadComponent: () => import('./components/display.component').then((c) => c.DisplayComponent),
    providers: [{ provide: USER_STORE, useClass: SelectStore }],
    data: { title: 'Select' }
  },
  {
    path: 'requestState',
    loadComponent: () => import('./components/display.component').then((c) => c.DisplayComponent),
    providers: [{ provide: USER_STORE, useClass: RequestStateStore }],
    data: { title: 'Request State' }
  },
  {
    path: 'messageEventInterceptor',
    loadComponent: () => import('./components/display.component').then((c) => c.DisplayComponent),
    providers: [{ provide: USER_STORE, useClass: MessageEventInterceptorStore }],
    data: { title: 'Message Event Interceptor' }
  },
  {
    path: 'broadcastStateInterceptor',
    loadComponent: () => import('./components/display.component').then((c) => c.DisplayComponent),
    providers: [{ provide: USER_STORE, useClass: BroadcastStateInterceptorStore }],
    data: { title: 'Broadcast State Interceptor' }
  },
  {
    path: 'onMessageError',
    loadComponent: () => import('./components/display.component').then((c) => c.DisplayComponent),
    providers: [{ provide: USER_STORE, useClass: OnMessageErrorStore }],
    data: { title: 'On Message Error' }
  }
];
