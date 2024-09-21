import {
  signalStoreFeature,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  EmptyFeatureResult,
  withMethods,
  withHooks,
  getState,
  patchState,
} from '@ngrx/signals';
import { effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

const NOOP = () => null;

type BroadcastMessage<State> =
  | { type: 'REQUEST_STATE' }
  | { type: 'UPDATE_STATE'; state: Partial<State> };

export type BroadcastSyncOptions<State> = {
  channel: string;
  select?: (state: State) => Partial<State>;
  preUpdate?: (
    event: MessageEvent<BroadcastMessage<State>>
  ) => BroadcastMessage<State>;
  runGuard?: (platformId: object) => boolean;
  requestState?: boolean;
};

type WithBroadcastSyncFeatureResult = EmptyFeatureResult & {
  methods: {
    getBroadcastChannel(): BroadcastChannel | null;
    requestBroadcastState(): void;
    postBroadcastMessage(): void;
  };
};

const BroadcastSyncStub: Pick<
  WithBroadcastSyncFeatureResult,
  'methods'
>['methods'] = {
  getBroadcastChannel: NOOP,
  requestBroadcastState: NOOP,
  postBroadcastMessage: NOOP,
};

export function withBroadcastSync<
  State extends object,
  Input extends SignalStoreFeatureResult
>(channel: string): SignalStoreFeature<Input, WithBroadcastSyncFeatureResult>;
export function withBroadcastSync<
  State extends object,
  Input extends SignalStoreFeatureResult
>(
  options: BroadcastSyncOptions<Input['state']>
): SignalStoreFeature<Input, WithBroadcastSyncFeatureResult>;
export function withBroadcastSync<
  State extends object,
  Input extends SignalStoreFeatureResult
>(
  channelOrOptions: BroadcastSyncOptions<Input['state']> | string
): SignalStoreFeature<Input, WithBroadcastSyncFeatureResult> {
  const {
    channel,
    select = (state: State) => state,
    preUpdate = (event: MessageEvent<BroadcastMessage<State>>) => event.data,
    runGuard = (platformId: object) =>
      isPlatformServer(platformId) ||
      typeof window?.BroadcastChannel === 'undefined',
    requestState = false,
  } = typeof channelOrOptions === 'string'
    ? { channel: channelOrOptions }
    : channelOrOptions;

  let stateChannel: BroadcastChannel | null;

  return signalStoreFeature(
    withMethods((store, platformId = inject(PLATFORM_ID)) => {
      if (runGuard(platformId)) {
        console.warn(
          `'withBroadcastSync' provides non-functional implementation due to server-side execution`
        );
        return BroadcastSyncStub;
      }

      return {
        getBroadcastChannel(): BroadcastChannel | null {
          return stateChannel;
        },

        requestBroadcastState(): void {
          stateChannel?.postMessage({ type: 'REQUEST_STATE' });
        },

        postBroadcastMessage(): void {
          const state = select(getState(store) as State);
          stateChannel?.postMessage({ type: 'UPDATE_STATE', state });
        },
      };
    }),
    withHooks({
      onInit(store, platformId = inject(PLATFORM_ID)) {
        if (runGuard(platformId)) {
          return;
        }

        stateChannel = new BroadcastChannel(channel);

        if (requestState) {
          store.requestBroadcastState();
        }

        stateChannel.onmessage = (
          event: MessageEvent<BroadcastMessage<State>>
        ) => {
          const message = preUpdate(event);

          switch (message.type) {
            case 'REQUEST_STATE': {
              store.postBroadcastMessage();
              break;
            }
            case 'UPDATE_STATE': {
              patchState(store, message.state);
              break;
            }
            default: {
              console.warn(
                `Unknown message type "${message}" in the broadcast channel "${channel}"`
              );
            }
          }
        };

        effect(() => {
          store.postBroadcastMessage();
        });
      },

      onDestroy() {
        stateChannel?.close();
      },
    })
  );
}
