import {
  isBroadcastChannelAvailable,
  withBroadcastRequestState,
  withBroadcastState
} from '@ricardojbd/ngrx-signals-broadcast-sync';
import { patchState, signalStore, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import { UserState } from './models';

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

export const DefaultStore = signalStore(withUserState(), withBroadcastState('default@store'));

export const OptionsStore = signalStore(
  withUserState(),
  withBroadcastState({
    channel: 'options@store',
    runGuard: (platformId: object) => {
      const isRunGuard = !isBroadcastChannelAvailable(platformId);
      console.log('runGuard', isRunGuard);
      return isRunGuard;
    },
    onMessageInterceptor: (event) => {
      console.log('onMessageInterceptor', event);
      return event.data;
    },
    postMessageInterceptor: (state) => {
      console.log('postMessageInterceptor', state);
      return state;
    },
    onMessageError: (event) => {
      console.log('onMessageError', event);
    }
  })
);

export const RequestStore = signalStore(
  withUserState(),
  withBroadcastState('request@store'),
  withBroadcastRequestState()
);

export const FilterStateStore = signalStore(
  withUserState(),
  withBroadcastState({
    channel: 'filter@store'
  })
);

export const FilterDuplicatedStore = signalStore(
  withUserState(),
  withBroadcastState({
    channel: 'filter@store',
    onMessageInterceptor: (event) => {
      console.log('onMessageInterceptor', event);
      return event.data;
    }
  })
);
