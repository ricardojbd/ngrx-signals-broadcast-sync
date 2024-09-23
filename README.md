<h1 align="center">NgRx Signals Broadcast Sync</h1>

<p align="center">
  <img 
    width="150px"
    style="padding: 20px 0;"
    alt="NgRx Signals Broadcast Channel Sync Logo" 
    title="NgRx Signals Broadcast Channel Sync Library Logo" 
    src="https://raw.githubusercontent.com/ricardojbd/ngrx-signals-broadcast-sync/refs/heads/main/ngrx-signal-broadcast-sync.svg" />
    <br>
  <em>This extension for the <a href="https://ngrx.io/guide/signals">NgRx Signals</a> store enables seamless synchronization of state slices between browser contexts and workers on te same origin by utilizing the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API">BroadcastChannel API</a>.</em>
</p>

## Installation

To install the library via npm:

```bash
npm install @ricardojbd/ngrx-signals-broadcast-sync
```

Ensure you are using `@ngrx/signals` version `v18.0.0` or later.

> [!WARNING]
> This library only functions in browser environments. It falls back to a stub implementation in server environments, such as Angular Universal.

## Usage

To use the library, simply apply the `withBroadcastSync()` function, passing the `channel` name:

```ts
import { signalStore, withState } from '@ngrx/signals';
import { withBroadcastSync } from '@ricardojbd/ngrx-signals-broadcast-sync';

export const UserStore = signalStore(
  withState({ user: null }), 
  withBroadcastSync('user@store')
);
```

### Advanced Configuration

You can also pass an `Options` object instead of a string `channel` for more control. The Options object supports the following:

- `channel`: (Required) The name of the broadcast channel used for state synchronization. This is the unique identifier for the communication channel between clients, allowing them to broadcast and receive state updates.
- `select:` (Optional) Function to select a portion of the state to broadcast. This function can be used to limit the slice of the state that is sent over the broadcast channel by selecting only the relevant parts of the state. By default, the entire state is selected and broadcasted as `(state) => state`.
- `requestState`: (Optional) If true, the store will request the current state from other connected clients on initialization. This is useful when a new client connects and needs to recover the current state from other connected clients, ensuring that it is synchronized with the latest state. The default value is `false`.
- `messageEventInterceptor`: (Optional) Interceptor for handling incoming broadcast messages. This function allows you to process or modify the incoming broadcast message before it is handled by the store. By default, the function extracts and returns the message's data as `(event) => event.data`.
- `broadcastStateInterceptor`: (Optional) Interceptor for modifying the state before it is broadcasted. This function is called before the state is sent through the broadcast channel. It allows for any necessary modifications to the state before broadcasting it. By default, it returns the state as-is `(state) => state`.
- `onMessageError`: (Optional) Callback invoked when an error occurs while receiving a message from the broadcast channel. This function handles errors that occur when receiving messages. You can use it to log errors or perform other error handling actions. By default, no action is taken `(event) => null`.

```ts
import { signalStore, withState } from '@ngrx/signals';
import { withBroadcastSync } from '@ricardojbd/ngrx-signals-broadcast-sync';

type User = { user: string | null, roles?: string[] }

export const UserStore = signalStore(
  withState<User>({ user: null, roles: [] }), 
  withBroadcastSync({ 
    channel: 'user@store',
    requestState: true,
    select: (state) => ({ user: state.user }),
    messageEventInterceptor: (event) => {
      console.log('message', event);
      return event.data;
    },
    broadcastStateInterceptor: (state) => {
      console.log('broadcast', state);
      return state;
    },
    onMessageError: (event) => console.error(event),
  })
);
```

### API Methods

Once `withBroadcastSync` is applied, it exposes two methods for working with the broadcast system:

- `getBroadcastChannel()`: Retrieves the current `BroadcastChannel` used for synchronizing state or `null` if the channel is not available or has not been initialized.
- `broadcastState()`: Sends the current state of the store through the broadcast channel to other connected clients. By default, it is triggered when a state change requires synchronization, but you can manually force a broadcast by invoking this method.

```ts
@Component(...)
public class UserStoreComponent {
  readonly #store: UserStore = inject(UserStore);
  readonly channel: BroadcastChannel | null = this.#store.getBroadcastChannel()

  broadcastState(): void {
    this.#store.broadcastState();
  }
}
```

## Development Setup

We welcome all contributions, from bug fixes to new features!

### Getting Started
- Install [Node.js](https://nodejs.org/).
- Use [pnpm](https://pnpm.io/) for dependency management and task automation.
- Test features using the included `playground` app.

### Contribution Workflow
1. Follow the [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow): Fork the repo, create a branch, and document changes.
2. Ensure thorough testing with **unit**, **integration**, and **E2E tests**.
3. Submit a detailed [pull request](https://docs.github.com/en/pull-requests).
4. Follow the [Code of Conduct](https://raw.githubusercontent.com/ricardojbd/ngrx-signals-broadcast-sync/refs/heads/main/CODE_OF_CONDUCT.md).

For bugs and feature requests, use [GitHub Issues](https://github.com/ricardojbd/ngrx-signals-broadcast-sync/issues).


## License

This library is adapted from [Elf Sync State](https://github.com/RicardoJBarrios/elf-sync-state) and is inspired by the `withStorageSync` feature in the [NgRx Toolkit](https://github.com/angular-architects/ngrx-toolkit). 

The logo is an adaptation of the NgRx logo, originally available from the [NgRx press page](https://ngrx.io/presskit) under the [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license. This [modified version](https://raw.githubusercontent.com/ricardojbd/ngrx-signals-broadcast-sync/refs/heads/main/ngrx-signal-broadcast-sync.svg) follows the same license [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). 

- Code License: [MIT License](https://raw.githubusercontent.com/ricardojbd/ngrx-signals-broadcast-sync/refs/heads/main/LICENSE).
- Documentation Licensed: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).