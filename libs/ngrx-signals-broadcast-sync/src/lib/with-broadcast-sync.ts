import {
  signalStoreFeature,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  withMethods,
  withHooks,
  getState,
  patchState
} from '@ngrx/signals';
import { effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import isEqual from 'lodash.isequal';
import { Message, Options, BroadcastSyncFeatureResult } from './models';

const NOOP = () => null;

const BroadcastSyncStub: Pick<BroadcastSyncFeatureResult, 'methods'>['methods'] = {
  getBroadcastChannel: NOOP,
  broadcastState: NOOP,
  _requestBroadcastState: NOOP,
  _patchStateFromBroadcast: NOOP
};

/**
 * Adds broadcast synchronization capabilities to a Signal Store.
 *
 * This function enables state synchronization between multiple clients using the `BroadcastChannel` API.
 * It allows clients to request, send, and patch the state across multiple contexts.
 *
 * @template Input The type of the store feature result, extending `SignalStoreFeatureResult`.
 * @param channel The name of the broadcast channel to use for synchronizing state across clients.
 * @returns A Signal Store feature with broadcast capabilities.
 */
export function withBroadcastSync<Input extends SignalStoreFeatureResult>(
  channel: string
): SignalStoreFeature<Input, BroadcastSyncFeatureResult>;

/**
 * Adds broadcast synchronization capabilities to a Signal Store.
 *
 * This function enables state synchronization between multiple clients using the `BroadcastChannel` API.
 * It allows clients to request, send, and patch the state across multiple contexts.
 *
 * @template Input The type of the store feature result, extending `SignalStoreFeatureResult`.
 * @param options A configuration object specifying the broadcast channel and additional behavior for state synchronization.
 * @returns A Signal Store feature with customizable broadcast capabilities.
 */
export function withBroadcastSync<Input extends SignalStoreFeatureResult>(
  options: Options<Input['state']>
): SignalStoreFeature<Input, BroadcastSyncFeatureResult>;

/**
 * Adds broadcast synchronization capabilities to a Signal Store.
 *
 * This function enables state synchronization between multiple clients using the `BroadcastChannel` API.
 * It can be invoked either with a broadcast channel name or with a configuration object (`Options`).
 * It allows clients to request, send, and patch the state across multiple contexts.
 *
 * @template Input The type of the store feature result, extending `SignalStoreFeatureResult`.
 * @param channelOrOptions Either the name of the broadcast channel or a configuration object.
 * If a string is provided, it is treated as the broadcast channel name.
 * If an `Options` object is provided, it allows further configuration of the broadcast behavior.
 * @returns A Signal Store feature that adds methods for broadcast synchronization.
 */
export function withBroadcastSync<Input extends SignalStoreFeatureResult>(
  channelOrOptions: Options<Input['state']> | string
): SignalStoreFeature<Input, BroadcastSyncFeatureResult> {
  const {
    channel,
    requestState = false,
    select = (state: Input['state']) => state,
    messageEventInterceptor = (event: MessageEvent<Message<Input['state']>>) => event.data,
    broadcastStateInterceptor = (state: Input['state']) => state,
    onMessageError = () => null
  } = typeof channelOrOptions === 'string' ? { channel: channelOrOptions } : channelOrOptions;

  const runGuard = (platformId: object) =>
    isPlatformServer(platformId) || typeof window?.BroadcastChannel === 'undefined';
  let stateChannel: BroadcastChannel | null;
  let lastSyncedState: Partial<Input['state']> | null = null;

  return signalStoreFeature(
    withMethods((store, platformId = inject(PLATFORM_ID)) => {
      if (runGuard(platformId)) {
        console.warn(`'withBroadcastSync' provides non-functional implementation due to server-side execution`);
        return BroadcastSyncStub;
      }

      return {
        getBroadcastChannel(): BroadcastChannel | null {
          return stateChannel;
        },

        broadcastState(): void {
          let state = select(getState(store));

          if (isEqual(state, lastSyncedState)) {
            return;
          }

          state = broadcastStateInterceptor(state);

          if (stateChannel != null) {
            lastSyncedState = state; // Avoid broadcast duplicated state
            stateChannel.postMessage({ type: 'UPDATE_STATE', state });
          }
        },

        _requestBroadcastState(): void {
          lastSyncedState = select(getState(store)); // Avoid broadcast initial state
          stateChannel?.postMessage({ type: 'REQUEST_STATE' });
        },

        _patchStateFromBroadcast(state: Input['state']) {
          lastSyncedState = state; // Avoid broadcast this state change
          patchState(store, state);
        }
      };
    }),
    withHooks({
      onInit(store, platformId = inject(PLATFORM_ID)) {
        if (runGuard(platformId)) {
          return;
        }

        stateChannel = new BroadcastChannel(channel);

        if (requestState) {
          store._requestBroadcastState();
        }

        stateChannel.onmessage = (event: MessageEvent<Message<Input['state']>>) => {
          const message = messageEventInterceptor(event);

          switch (message.type) {
            case 'REQUEST_STATE': {
              lastSyncedState = null; // Force broadcast state
              store.broadcastState();
              break;
            }
            case 'UPDATE_STATE': {
              store._patchStateFromBroadcast(message.state);
              break;
            }
            default: {
              console.warn(`Unknown message type "${message}" in the broadcast channel "${channel}"`);
            }
          }
        };

        stateChannel.onmessageerror = (event: MessageEvent) => onMessageError(event);

        effect(() => {
          store.broadcastState();
        });
      },

      onDestroy() {
        stateChannel?.close();
      }
    })
  );
}
