import { withBroadcastSync } from '@ricardojbd/ngrx-signals-broadcast-sync';
import { patchState, signalStore, signalStoreFeature, withHooks, withMethods, withState } from '@ngrx/signals';

import { UserState } from './models';
import { effect } from '@angular/core';

function withUserState() {
  return signalStoreFeature(
    withState<UserState>({ user: null, isAdmin: null }),
    withMethods((store) => ({
      updateUser(user: string): void {
        patchState(store, () => ({ user }));
      },
      toggleIsAdmin(): void {
        patchState(store, (state) => {
          const isAdmin = state.isAdmin == null ? false : !state.isAdmin;
          return { isAdmin };
        });
      }
    }))
  );
}

export const ChannelStore = signalStore(withUserState(), withBroadcastSync('channel'));

export const ChannelOptionStore = signalStore(withUserState(), withBroadcastSync({ channel: 'channelOptions' }));

export const SelectStore = signalStore(
  withUserState(),
  withBroadcastSync({ channel: 'select', select: (state) => ({ user: state.user }) })
);

export const RequestStateStore = signalStore(
  withUserState(),
  withBroadcastSync({ channel: 'requestState', requestState: true })
);

export const MessageEventInterceptorStore = signalStore(
  withUserState(),
  withBroadcastSync({
    channel: 'messageEventInterceptor',
    messageEventInterceptor: (event) => {
      console.log('message', event);
      return event.data;
    }
  })
);

export const BroadcastStateInterceptorStore = signalStore(
  withUserState(),
  withBroadcastSync({
    channel: 'broadcastStateInterceptor',
    broadcastStateInterceptor: (state) => {
      console.log('broadcast', state);
      return state;
    }
  })
);

export const OnMessageErrorStore = signalStore(
  withUserState(),
  withBroadcastSync({
    channel: 'onMessageError',
    onMessageError: (event) => console.error(event)
  }),
  withMethods((store) => {
    return {
      broadcastError() {
        const channel = store.getBroadcastChannel();
        const errorEvent = new MessageEvent('messageerror', {
          data: 'Simulated Error',
          origin: window.origin
        });
        channel?.dispatchEvent(errorEvent);
      }
    };
  }),
  withHooks({
    onInit(store) {
      effect(() => {
        store.isAdmin();
        store.broadcastError();
      });
    }
  })
);
