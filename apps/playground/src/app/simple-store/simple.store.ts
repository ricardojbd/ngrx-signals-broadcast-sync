import { withState, signalStore, withMethods, patchState } from '@ngrx/signals';
import { withBroadcastSync } from '@ricardojbd/ngrx-signals-broadcast-sync';

type UserState = { user: string | null; isAdmin: boolean | null };

const initialState: UserState = { user: null, isAdmin: null };

export const SimpleStore = signalStore(
  withState<UserState>(initialState),
  withBroadcastSync({
    channel: 'simple-store',
    requestState: true,
    messageEventInterceptor: (event) => {
      console.log('Receiving', event.data);
      return event.data;
    },
    broadcastStateInterceptor: (state) => {
      console.log('Posting', state);
      return state;
    },
  }),
  withMethods((store) => ({
    updateUser(user: string): void {
      patchState(store, () => ({ user }));
    },
    toggleIsAdmin(): void {
      patchState(store, (state) => {
        const isAdmin = state.isAdmin == null ? false : !state.isAdmin;
        return { isAdmin };
      });
    },
  }))
);
