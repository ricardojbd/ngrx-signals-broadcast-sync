import { withBroadcastState } from '@ricardojbd/ngrx-signals-broadcast-sync';
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

const onStubImplementation = (platformId: object, broadcastChannel?: object) =>
  console.log('onStubImplementation', platformId, broadcastChannel);
const onMessageError = (event: MessageEvent) => console.log('onMessageError', event);
const onSkipFirstBroadcast = <State extends object>(state: State) => console.log('onSkipFirstBroadcast', state);
const onSkipDuplicatedBroadcast = <State extends object>(state: State) =>
  console.log('onSkipDuplicatedBroadcast', state);
const onSkipOlder = <State extends object>(args: { lastTime: number; time: number; state: Partial<State> }) =>
  console.log('onSkipOlder', args);

export const DefaultStore = signalStore(
  withUserState(),
  withBroadcastState({
    channel: 'default',
    onStubImplementation,
    onMessageError,
    onSkipFirstBroadcast,
    onSkipDuplicatedBroadcast,
    onSkipOlder
  })
);

export const OptionsStore = signalStore(
  withUserState(),
  withBroadcastState({
    channel: 'options',
    requestState: false,
    skipFirst: false,
    skipOlder: false,
    select: (state) => ({ user: state.user }),
    messageEventInterceptor: (event) => {
      console.log('messageEventInterceptor', event);
      return event.data;
    },
    broadcastStateInterceptor: (state) => {
      console.log('broadcastStateInterceptor', state);
      return state;
    },
    onStubImplementation,
    onMessageError,
    onSkipFirstBroadcast,
    onSkipDuplicatedBroadcast,
    onSkipOlder
  })
);
