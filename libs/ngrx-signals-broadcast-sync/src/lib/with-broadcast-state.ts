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

import { isBroadcastChannelAvailable } from './is-broadcast-channel-available';

/**
 * Configuration options for setting up a broadcast channel synchronization feature
 * that enables state sharing across different browser contexts.
 *
 * @template State - The state object type that extends `object`.
 */
export type Options<State extends object> = {
  /**
   * The unique identifier for the `BroadcastChannel` used for state synchronization.
   */
  channel: string;

  /**
   * Optional guard function to determine if synchronization should be disabled based on platform.
   *
   * @param platformId - An object representing the current platform.
   * @returns `true` if synchronization should be disabled; `false` to enable.
   */
  runGuard?: (platformId: object) => boolean;

  /**
   * Optional interceptor function triggered upon receiving a message via the `BroadcastChannel`.
   * It can modify or filter the incoming state. Returning `null` stops further processing.
   *
   * @param event - The message event containing the incoming state.
   * @returns A partial state object to merge, or `null` to ignore the message.
   */
  onMessageInterceptor?: (event: MessageEvent<State>) => Partial<State> | null;

  /**
   * Optional interceptor function that modifies the outgoing state before broadcasting it.
   * Returning `null` cancels the broadcast.
   *
   * @param state - The current state intended for broadcasting.
   * @returns A partial state object to broadcast, or `null` to cancel.
   */
  postMessageInterceptor?: (state: State) => Partial<State> | null;

  /**
   * Optional interceptor function that processes the state after any effects are applied.
   * Allows selective modification before broadcasting.
   *
   * @param state - The state after effects have been processed.
   * @returns A partial state object to use, or `null` to ignore further changes.
   */
  effectInterceptor?: (state: State) => Partial<State> | null;

  /**
   * Optional error handler for managing errors encountered while processing incoming messages.
   *
   * @param event - The message event that caused the error.
   */
  onMessageError?: (event: MessageEvent) => void;
};

/**
 * Describes the result of the broadcast state feature, which extends `SignalStoreFeatureResult`.
 * This feature offers methods for handling broadcast channels, enabling state synchronization
 * across multiple browser tabs or contexts.
 */
export type BroadcastStateFeatureResult = SignalStoreFeatureResult & {
  methods: {
    /**
     * Returns the current `BroadcastChannel` instance for broadcasting state changes.
     * If the channel is unavailable or uninitialized, it returns `undefined`.
     *
     * @returns The active `BroadcastChannel` instance or `undefined`.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
     */
    getBroadcastChannel(): BroadcastChannel | undefined;

    /**
     * Broadcasts the current state to all listeners on the `BroadcastChannel`.
     * Intended for broadcasting state updates to synchronized contexts.
     */
    postState(): void;

    /**
     * Directly sends a provided state object over the broadcast channel.
     * Typically used internallyOk.
     *
     * @param state - The state object to be broadcasted over the channel.
     */
    _postState(state: {}): void;
  };
};

/**
 * Creates a `SignalStoreFeature` that enables state synchronization across different browser contexts
 * using the `BroadcastChannel` API.
 *
 * @template Input - The expected structure of the `SignalStore` state.
 *
 * @param channel - The name of the `BroadcastChannel` used for state synchronization.
 *
 * @returns A `SignalStoreFeature` configured to synchronize state across contexts.
 *
 * @example
 * ```typescript
 * const store = signalStore(
 *   withState(...),
 *   withBroadcastState('my-channel')
 * );
 * ```
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
 * @see SignalStoreFeature
 */
export function withBroadcastState<Input extends SignalStoreFeatureResult>(
  channel: string
): SignalStoreFeature<Input, BroadcastStateFeatureResult>;

/**
 * Creates a `SignalStoreFeature` with configurable options that enable state synchronization
 * across browser contexts using the `BroadcastChannel` API. The feature provides custom
 * configuration for intercepting messages, handling errors, and platform-specific synchronization.
 *
 * @template Input - Represents the structure of the `SignalStore` state.
 *
 * @param options - Configuration options that specify channel name, interceptors, and platform guards.
 *
 * @returns A configured `SignalStoreFeature` to synchronize state based on the provided options.
 *
 * @example
 * ```typescript
 * const options = {
 *   channel: 'my-channel',
 *   runGuard: (platformId) => !isBroadcastChannelAvailable(platformId),
 *   onMessageInterceptor: (event) => event.data,
 *   postMessageInterceptor: (state) => state,
 *   effectInterceptor: (state) => state,
 *   onMessageError: (event) => console.error('onMessageError', event),
 * };
 *
 * const store = signalStore(
 *   withState(...),
 *   withBroadcastState(options)
 * );
 * ```
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
 * @see SignalStoreFeature
 * @see Options
 */
export function withBroadcastState<Input extends SignalStoreFeatureResult>(
  options: Options<Input['state']>
): SignalStoreFeature<Input, BroadcastStateFeatureResult>;

export function withBroadcastState<Input extends SignalStoreFeatureResult>(
  channelOrOptions: Options<Input['state']> | string
): SignalStoreFeature<Input, BroadcastStateFeatureResult> {
  const {
    channel,
    runGuard = (platformId: object) => !isBroadcastChannelAvailable(platformId),
    onMessageInterceptor = (event: MessageEvent<Input['state']>) => event.data,
    postMessageInterceptor = (state: Input['state']) => state,
    effectInterceptor = (state: Input['state']) => state,
    onMessageError = (event: MessageEvent) => null
  } = typeof channelOrOptions === 'string' ? { channel: channelOrOptions } : channelOrOptions;

  let broadcastChannel: BroadcastChannel | undefined;
  let shouldPostMessage = false;

  return signalStoreFeature(
    withMethods((store) => {
      return {
        getBroadcastChannel(): BroadcastChannel | undefined {
          return broadcastChannel;
        },

        postState(): void {
          this._postState(getState(store));
        },

        _postState(state: Input['state']): void {
          const interceptedState: Partial<Input['state']> | null = postMessageInterceptor(state);

          if (interceptedState == null) {
            return;
          }

          broadcastChannel?.postMessage(interceptedState);
        }
      };
    }),
    withHooks({
      onInit(store, platformId = inject(PLATFORM_ID)) {
        if (runGuard(platformId)) {
          return;
        }

        broadcastChannel = new BroadcastChannel(channel);

        effect(() => {
          let state: Input['state'] | null = getState(store);

          state = effectInterceptor(state);

          if (shouldPostMessage && state != null) {
            store._postState(state);
          } else {
            shouldPostMessage = true;
          }
        });

        broadcastChannel.onmessage = (event: MessageEvent<Input['state']>) => {
          let state: Partial<Input['state']> | null = onMessageInterceptor(event);

          if (typeof state !== 'object' || state === null) {
            return;
          }

          shouldPostMessage = false;
          patchState(store, state);
        };

        broadcastChannel.onmessageerror = onMessageError;
      },

      onDestroy() {
        broadcastChannel?.close();
      }
    })
  );
}
