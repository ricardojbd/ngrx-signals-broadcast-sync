import { effect, inject, PLATFORM_ID } from '@angular/core';
import {
  signalStoreFeature,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  withMethods,
  withHooks,
  getState,
  patchState
} from '@ngrx/signals';
import isEqual from 'lodash.isequal';

import { isInvalidUpdateMessage, isOlder, runGuard } from './helpers';
import {
  BroadcastSyncStub,
  Message,
  Options,
  BroadcastSyncFeatureResult,
  UpdateMessage,
  MessageType,
  NOOP
} from './models';

/**
 * Adds broadcast synchronization capabilities to a Signal Store.
 *
 * This function enables state synchronization between multiple clients using the `BroadcastChannel API`.
 * It allows clients to request, send, and patch the state across multiple contexts.
 *
 * @template Input The type of the store feature result.
 * @param channel The name of the broadcast channel to use.
 * @returns A Signal Store feature with broadcast capabilities.
 */
export function withBroadcastState<Input extends SignalStoreFeatureResult>(
  channel: string
): SignalStoreFeature<Input, BroadcastSyncFeatureResult>;

/**
 * Adds broadcast synchronization capabilities to a Signal Store.
 *
 * This function enables state synchronization between multiple clients using the `BroadcastChannel API`.
 * It allows clients to request, send, and patch the state across multiple contexts.
 *
 * @template Input The type of the store feature result.
 * @param options A configuration object specifying the broadcast channel name and additional behavior for state synchronization.
 * @returns A Signal Store feature with customizable broadcast capabilities.
 */
export function withBroadcastState<Input extends SignalStoreFeatureResult>(
  options: Options<Input['state']>
): SignalStoreFeature<Input, BroadcastSyncFeatureResult>;

/**
 * Adds broadcast synchronization capabilities to a Signal Store.
 *
 * This function enables state synchronization between multiple clients using the `BroadcastChannel API`.
 * It can be invoked either with a broadcast channel name or with a configuration object (`Options`).
 * It allows clients to request, send, and patch the state across multiple contexts.
 *
 * @template Input The type of the store feature result.
 * @param channelOrOptions Either the name of the broadcast channel or a configuration object.
 * If a string is provided, it is treated as the broadcast channel name.
 * If an `Options` object is provided, it allows further configuration of the broadcast behavior.
 * @returns A Signal Store feature with customizable broadcast capabilities.
 */
export function withBroadcastState<Input extends SignalStoreFeatureResult>(
  channelOrOptions: Options<Input['state']> | string
): SignalStoreFeature<Input, BroadcastSyncFeatureResult> {
  const {
    channel,
    requestState = true,
    skipFirst = true,
    skipOlder = true,
    select = (state: Input['state']) => state,
    messageEventInterceptor = (event: MessageEvent<Message<Input['state']>>) => event.data,
    broadcastStateInterceptor = (state: Input['state']) => state,
    onStubImplementation = NOOP,
    onMessageError = NOOP,
    onSkipFirstBroadcast = NOOP,
    onSkipDuplicatedBroadcast = NOOP,
    onSkipOlder = NOOP
  } = typeof channelOrOptions === 'string' ? { channel: channelOrOptions } : channelOrOptions;

  let stateChannel: BroadcastChannel | null;
  let lastSyncedState: Partial<Input['state']> | null = null;
  let isFirst = skipFirst;
  let lastTime = 0;

  return signalStoreFeature(
    withMethods((store, platformId = inject(PLATFORM_ID)) => {
      if (runGuard(platformId)) {
        onStubImplementation(platformId, window?.BroadcastChannel);
        return BroadcastSyncStub;
      }

      return {
        getBroadcastChannel(): BroadcastChannel | null {
          return stateChannel;
        },

        broadcastState(skipChecks = false): void {
          let state = select(getState(store));

          if (!skipChecks && isFirst) {
            isFirst = false;
            onSkipFirstBroadcast(state);
            return;
          }

          if (!skipChecks && isEqual(state, lastSyncedState)) {
            return onSkipDuplicatedBroadcast(state);
          }

          state = broadcastStateInterceptor(state);
          const time = Date.now();

          if (!skipChecks && isOlder({ time, lastTime, skipOlder })) {
            return onSkipOlder({ lastTime, time, state });
          }

          lastSyncedState = state; // Avoid broadcast duplicated state
          lastTime = time;
          stateChannel?.postMessage({ type: MessageType.Update, time, state });
        },

        requestBroadcastState(): void {
          lastSyncedState = select(getState(store)); // Avoid broadcast initial state
          stateChannel?.postMessage({ type: MessageType.Request });
        },

        _patchStateFromBroadcast(message: UpdateMessage<Input['state']>) {
          if (isOlder({ time: message.time, lastTime, skipOlder })) {
            return onSkipOlder({ lastTime, time: message.time, state: message.state });
          }

          lastTime = message.time;
          lastSyncedState = message.state; // Avoid broadcast this state change
          patchState(store, message.state);
        }
      };
    }),
    withHooks({
      onInit(store, platformId = inject(PLATFORM_ID)) {
        if (runGuard(platformId)) {
          return;
        }

        stateChannel = new BroadcastChannel(channel);

        effect(() => {
          store.broadcastState();
        });

        if (requestState) {
          store.requestBroadcastState();
        }

        stateChannel.onmessage = (event: MessageEvent<Message<Input['state']>>) => {
          const message = messageEventInterceptor(event);

          switch (message.type) {
            case MessageType.Request: {
              store.broadcastState(true);
              break;
            }
            case MessageType.Update: {
              if (isInvalidUpdateMessage(message)) {
                return onMessageError(event);
              }

              store._patchStateFromBroadcast(message);
              break;
            }
            default: {
              onMessageError(event);
            }
          }
        };

        stateChannel.onmessageerror = (event: MessageEvent) => onMessageError(event);
      },

      onDestroy() {
        stateChannel?.close();
      }
    })
  );
}
