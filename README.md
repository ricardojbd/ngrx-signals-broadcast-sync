<h1 align="center">NgRx Signals Broadcast Sync</h1>

<p align="center">
  <img 
    width="125px"
    alt="NgRx Signals Broadcast Channel Sync Logo" 
    title="NgRx Signals Broadcast Channel Sync Library Logo" 
    src="https://raw.githubusercontent.com/ricardojbd/ngrx-signals-broadcast-sync/refs/heads/main/ngrx-signal-broadcast-sync.svg" />
    <br>  
  <em>This extension for the <a href="https://ngrx.io/guide/signals">NgRx Signals</a> store enables synchronization of state between browser contexts using the same storage partition and workers on te same origin using the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API">BroadcastChannel API</a>.</em>
</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@ricardojbd/ngrx-signals-broadcast-sync"><img src="https://img.shields.io/npm/v/@ricardojbd/ngrx-signals-broadcast-sync?logo=npm&style=flat-square" alt="NPM Package"/></a>
  <a href="https://github.com/ricardojbd/ngrx-signals-broadcast-sync/blob/main/LICENSE"><img src="https://img.shields.io/github/license/ricardojbd/ngrx-signals-broadcast-sync?style=flat-square" alt="MIT License"/></a>
  <a href="https://github.com/ricardojbd/ngrx-signals-broadcast-sync"><img src="https://img.shields.io/github/stars/ricardojbd/ngrx-signals-broadcast-sync?logo=github&style=flat-square" alt="Github Stars"/></a>
</p>

## Installation

To install the library via npm:

```bash
npm install @ricardojbd/ngrx-signals-broadcast-sync
```

Ensure you are using `@ngrx/signals` version `v18.0.0` or later.

> [!WARNING]
> This library only works in browser environments, and not in server environments, such as Angular Universal.

## `withBroadcastState()`

This function creates a `SignalStoreFeature` to synchronize state changes via a `BroadcastChannel`, enabling reactive, multi-context state management. The API allows developers to control synchronization behaviors, modify state before broadcasting or upon reception, and gracefully handle errors and cleanup.

### Usage

To use this library, simply apply the `withBroadcastState()` function to the `signalStore`, passing the `channel` name:

```ts
import { signalStore, withState } from '@ngrx/signals';
import { withBroadcastState } from '@ricardojbd/ngrx-signals-broadcast-sync';

export const UserStore = signalStore(
  withState({ user: null }), 
  withBroadcastState('user@store')
);
```

### Advanced Configuration

You can also pass an `Options` object instead of a string `channel` for more control. The Options object supports the following:

- **channel**: The identifier for the communication channel used for broadcasting.
- **runGuard**: An optional guard function to determine whether synchronization should be disabled based on the platform identifier. If the function returns `true`, synchronization will be prevented; if it returns `false`, synchronization will proceed as normal. By default it checks if `BroadcastChannel` is available. `(platformId) => !isBroadcastChannelAvailable(platformId),`
- **onMessageInterceptor**: An optional interceptor function triggered when a message is received from the channel. It allows partial transformation of the received state or the option to ignore it. By default, it returns the message event data as-is `(event) => event.data`.
- **postMessageInterceptor**: An optional interceptor function triggered before sending a message to the channel. Allows modification of the outgoing state before broadcasting. By default, it returns the state as-is `(state) => state`.
- **effectInterceptor**: An optional interceptor function to manipulate state after any applied effects. Useful for selectively updating or refining the state after processing. By default, it returns the state as-is `(state) => state`.
- **onMessageError**: An optional error handler for handling errors that occur when processing incoming messages. By default, no action is taken `(event) => void`.

> [!NOTE]
> If any of the interceptors returns `null`, the event execution will stop.

```ts
import { signalStore, withState } from '@ngrx/signals';
import { withBroadcastState } from '@ricardojbd/ngrx-signals-broadcast-sync';

type User = { user: string | null, roles?: string[] }

export const UserStore = signalStore(
  withState<User>({ user: null, roles: [] }), 
  withBroadcastState({
    channel: 'user@store',
    runGuard: (platformId: object) => {
      const isRunGuard = !isBroadcastChannelAvailable(platformId);
      console.log('runGuard', isRunGuard);
      return isRunGuard;
    },
    onMessageInterceptor: (event) => {
      console.log('onMessageInterceptor', event);
      return event;
    },
    postMessageInterceptor: (state) => {
      console.log('postMessageInterceptor', state);
      return state;
    },
    effectInterceptor: (state) => {
      console.log('effectInterceptor', state);
      return state;
    },
    onMessageError: (event) => {
      console.log('onMessageError', event);
    }
  })
);
```

### API Methods

Once `withBroadcastState` is applied, it exposes two methods for working with the broadcast system:

- **getBroadcastChannel()**: Retrieves the current `BroadcastChannel` instance used for broadcasting state changes. Returns `undefined` if the `BroadcastChannel` is not available or has not been initialized.
- **postState()**: Broadcasts the current state to all listeners on the `BroadcastChannel`.

```ts
@Component(...)
public class UserStoreComponent {
  readonly store: UserStore = inject(UserStore);
  readonly channel: BroadcastChannel | undefined = this.store.getBroadcastChannel();

  postState(): void {
    this.store.postState();
  }
}
```

## `withBroadcastRequestState()`

### Usage

### API Methods

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

## Licensing

This library is adapted from [Elf Sync State](https://github.com/RicardoJBarrios/elf-sync-state) and is inspired by the `withStorageSync` feature in the [NgRx Toolkit](https://github.com/angular-architects/ngrx-toolkit). 

The logo is an adaptation of the NgRx logo, originally available from the [NgRx press page](https://ngrx.io/presskit) under the [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license. This [modified version](https://raw.githubusercontent.com/ricardojbd/ngrx-signals-broadcast-sync/refs/heads/main/ngrx-signal-broadcast-sync.svg) follows the same license [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). 

- Code License: [MIT License](https://raw.githubusercontent.com/ricardojbd/ngrx-signals-broadcast-sync/refs/heads/main/LICENSE).
- Documentation Licensed: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).