import { SignalStoreFeatureResult } from '@ngrx/signals';

/**
 * Represents a broadcast message used for synchronizing state between clients.
 *
 * This message can either be a request for the current state (`REQUEST_STATE`) or an update
 * with the new state (`UPDATE_STATE`). These messages are transmitted over the broadcast channel
 * to ensure state consistency across different contexts.
 *
 * @template State - The type of the state being synchronized.
 */
export type Message<State> = { type: 'REQUEST_STATE' } | { type: 'UPDATE_STATE'; state: Partial<State> };

/**
 * Options for configuring the broadcast synchronization behavior of the store.
 *
 * These options control how the store interacts with other clients through a broadcast channel,
 * allowing for selective state synchronization, error handling, and message interception.
 *
 * @template State - The type of the state being synchronized across different clients or contexts.
 */
export type Options<State> = {
  /**
   * The name of the broadcast channel used for state synchronization.
   *
   * This is the unique identifier for the communication channel between clients, allowing them
   * to broadcast and receive state updates.
   */
  channel: string;

  /**
   * Function to select a portion of the state to broadcast.
   *
   * By default, the entire state is selected and broadcasted. This function can be used to
   * limit the slice of the state that is sent over the broadcast channel by selecting only the
   * relevant parts of the state.
   *
   * @param state The current state of the store.
   * @returns The selected slice of the state to broadcast.
   */
  select?: (state: State) => Partial<State>;

  /**
   * If true, the store will request the current state from other connected clients on initialization.
   *
   * This is useful when a new client connects and needs to recover the current state from other
   * connected clients, ensuring that it is synchronized with the latest state.
   *
   * @default false
   */
  requestState?: boolean;

  /**
   * Interceptor for handling incoming broadcast messages.
   *
   * This function allows you to process or modify the incoming broadcast message before it is
   * handled by the store. By default, the function extracts and returns the message's data.
   *
   * @param event The incoming message event from the broadcast channel.
   * @returns The processed or modified message.
   */
  messageEventInterceptor?: (event: MessageEvent<Message<State>>) => Message<State>;

  /**
   * Interceptor for modifying the state before it is broadcasted.
   *
   * This function is called before the state is sent through the broadcast channel. It allows
   * for any necessary modifications to the state before broadcasting it. By default, it returns
   * the state as-is.
   *
   * @param state The selected slices of the state to be broadcasted.
   * @returns The modified state that will be broadcasted.
   */
  broadcastStateInterceptor?: (state: Partial<State>) => Partial<State>;

  /**
   * Callback invoked when an error occurs while receiving a message from the broadcast channel.
   *
   * This function handles errors that occur when receiving messages. You can use it to log errors
   * or perform other error handling actions. By default, no action is taken.
   *
   * @param event The error event that occurred while receiving a broadcast message.
   */
  onMessageError?: (event: MessageEvent) => void;
};

/**
 * Represents the result of the broadcast synchronization feature for a Signal Store.
 *
 * This type extends the base `SignalStoreFeatureResult` and provides additional methods
 * for managing state synchronization across different clients using a broadcast channel.
 */
export type BroadcastSyncFeatureResult = SignalStoreFeatureResult & {
  methods: {
    /**
     * Retrieves the current `BroadcastChannel` used for synchronizing state.
     *
     * This method returns the `BroadcastChannel` instance used for communication, or `null`
     * if the channel is not available or has not been initialized.
     *
     * @returns The current broadcast channel, or `null` if not available.
     */
    getBroadcastChannel(): BroadcastChannel | null;

    /**
     * Sends the current state of the store through the broadcast channel to other connected clients.
     *
     * By default, it is triggered when a state change requires synchronization, but you can manually force a broadcast by invoking this method.
     */
    broadcastState(): void;

    /**
     * Requests the current state from other connected clients.
     *
     * This internal method sends a request for the latest state to other clients. Other clients
     * will respond by broadcasting their current state. Useful when a new client connects and
     * needs to synchronize its state with others.
     */
    _requestBroadcastState(): void;

    /**
     * Applies a state update received from the broadcast channel.
     *
     * This internal method is used to update the store's state based on a state received from
     * another client. It patches the local state with the provided state.
     *
     * @template State The type of the state being synchronized.
     * @param state The state received from the broadcast that will be merged with
     * the current local state.
     */
    _patchStateFromBroadcast<State extends object>(state: State): void;
  };
};
