import { withBroadcastState } from '@ricardojbd/ngrx-signals-broadcast-sync';
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

export const ChannelStore = signalStore(withUserState(), withBroadcastState('channel'));

export const ChannelOptionStore = signalStore(withUserState(), withBroadcastState({ channel: 'channelOptions' }));

export const SelectStore = signalStore(
  withUserState(),
  withBroadcastState({ channel: 'select', select: (state) => ({ user: state.user }) })
);

export const RequestStateStore = signalStore(
  withUserState(),
  withBroadcastState({ channel: 'requestState', requestState: true })
);

export const MessageEventInterceptorStore = signalStore(
  withUserState(),
  withBroadcastState({
    channel: 'messageEventInterceptor',
    messageEventInterceptor: (event) => {
      console.log('message', event);
      return { ...event.data, state: { user: 'override', isAdmin: true } };
    }
  })
);

export const BroadcastStateInterceptorStore = signalStore(
  withUserState(),
  withBroadcastState({
    channel: 'broadcastStateInterceptor',
    broadcastStateInterceptor: (state) => {
      console.log('broadcast', state);
      return { user: 'override', isAdmin: true };
    }
  })
);

export const OnMessageErrorStore = signalStore(
  withUserState(),
  withBroadcastState({
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
