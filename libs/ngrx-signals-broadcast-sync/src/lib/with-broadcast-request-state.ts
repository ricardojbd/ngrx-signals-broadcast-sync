import {
  signalStoreFeature,
  withHooks,
  type,
  withMethods,
  SignalStoreFeature,
  SignalStoreFeatureResult
} from '@ngrx/signals';
import { BroadcastStateFeatureResult } from './with-broadcast-state';

/**
 * Represents the result of a broadcast request state feature, extending the `SignalStoreFeatureResult`.
 * Provides methods to request state synchronization across different instances via a `BroadcastChannel`.
 */
export type BroadcastRequestStateFeatureResult = SignalStoreFeatureResult & {
  methods: {
    /**
     * Broadcasts a request message over the `BroadcastChannel` to obtain the current state from other instances.
     * This method prompts other listeners on the channel to respond with their respective states, allowing for
     * synchronization across distributed instances of the store.
     */
    requestState(): void;
  };
};

/**
 * A feature for integrating broadcast request state synchronization within a `SignalStore`.
 *
 * This function enhances a `SignalStore` by adding the capability to request state updates through a `BroadcastChannel`.
 * It allows distributed store instances to remain in sync by broadcasting a request for the current state, which prompts
 * other instances to respond with their state data.
 *
 * @template Input - The type extending `BroadcastStateFeatureResult`, representing the base state structure for broadcasting.
 *
 * @returns A `SignalStoreFeature` configured with methods and hooks for handling state requests over a `BroadcastChannel`.
 *
 * @example
 * ```typescript
 * const store = createStore(
 *   withState(...),
 *   withBroadcastState('my-channel'),
 *   withBroadcastRequestState()
 * );
 * ```
 * This example demonstrates how to create a store that uses the `withBroadcastState` feature for state sharing across tabs,
 * and the `withBroadcastRequestState` feature to request the current state from other store instances.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
 * @see SignalStoreFeature
 * @see withBroadcastState
 */
export function withBroadcastRequestState<Input extends BroadcastStateFeatureResult>(): SignalStoreFeature<
  Input,
  BroadcastRequestStateFeatureResult
> {
  const requestMessage = 'RequestState';

  return signalStoreFeature(
    {
      methods: type<{
        getBroadcastChannel(): BroadcastChannel | undefined;
        postState(): void;
      }>()
    },
    withMethods((store) => {
      const channel: BroadcastChannel | undefined = store.getBroadcastChannel();

      return {
        requestState(): void {
          if (!channel) {
            return;
          }

          channel.postMessage(requestMessage);
        }
      };
    }),
    withHooks({
      onInit(store) {
        const channel: BroadcastChannel | undefined = store.getBroadcastChannel();

        if (!channel) {
          return;
        }

        store.requestState();

        channel.addEventListener('message', (event: MessageEvent) => {
          if (event.data !== requestMessage) {
            return;
          }

          store.postState();
        });
      }
    })
  );
}
