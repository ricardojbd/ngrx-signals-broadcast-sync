import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

import { MessageType } from './models';
import { withBroadcastState } from './with-broadcast-state';

jest.mock('@ngrx/signals', () => ({
  ...jest.requireActual('@ngrx/signals'),
  patchState: jest.fn()
}));

jest.mock('./helpers', () => ({
  isInvalidUpdateMessage: jest.fn(),
  runGuard: jest.fn(),
  isOlder: jest.fn()
}));

const BroadcastChannelMock = jest.fn().mockImplementation((channel) => ({
  name: channel,
  postMessage: jest.fn(),
  close: jest.fn(),
  onmessage: jest.fn(),
  onmessageerror: jest.fn()
}));

type State = { a: string | null; b: boolean | null };
const onStubImplementationMock = jest.fn();
const onMessageErrorMock = jest.fn();
const onSkipFirstBroadcastMock = jest.fn();
const onSkipDuplicatedBroadcastMock = jest.fn();
const onSkipOlderMock = jest.fn();

const BasicStore = signalStore(
  { providedIn: 'root' },
  withState<State>({ a: null, b: null }),
  withMethods((store) => ({
    updateA: (a: string) => patchState(store, () => ({ a })),
    toggleB: () => patchState(store, (s) => ({ b: s.b == null ? false : !s.b }))
  })),
  withBroadcastState({
    channel: 'channel',
    onStubImplementation: onStubImplementationMock,
    onMessageError: onMessageErrorMock,
    onSkipFirstBroadcast: onSkipFirstBroadcastMock,
    onSkipDuplicatedBroadcast: onSkipDuplicatedBroadcastMock,
    onSkipOlder: onSkipOlderMock
  })
);
type BasicStore = InstanceType<typeof BasicStore>;

describe('withBroadcastState', () => {
  let spectator: SpectatorService<BasicStore>;
  const createService = createServiceFactory(BasicStore);
  let store: BasicStore;

  describe('when runGuard is true', () => {
    let runGuardSpy: jest.SpyInstance;

    beforeAll(() => {
      runGuardSpy = jest.spyOn(require('./helpers'), 'runGuard');
      runGuardSpy.mockReturnValue(true);
    });

    afterAll(() => {
      runGuardSpy.mockRestore();
    });

    beforeEach(() => {
      window.BroadcastChannel = BroadcastChannelMock;
      spectator = createService();
      store = spectator.service;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls onStubImplementation hook', () => {
      expect(onStubImplementationMock).toHaveBeenCalledTimes(1);
      expect(onStubImplementationMock).toHaveBeenCalledWith(expect.any(String), expect.any(Function));
    });

    it('uses the stub implementation', () => {
      const broadcastChannel = spectator.service.getBroadcastChannel();
      expect(broadcastChannel).toBeNull();
    });
  });

  describe('default behavior', () => {
    let broadcastChannel: BroadcastChannel;

    beforeEach(() => {
      window.BroadcastChannel = BroadcastChannelMock;
      spectator = createService();
      store = spectator.service;
      broadcastChannel = store.getBroadcastChannel() as BroadcastChannel;
      spectator.flushEffects();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('on load', () => {
      it('does not call the onStubImplementation hook', () => {
        expect(onStubImplementationMock).not.toHaveBeenCalled();
      });

      it('posts a request message', () => {
        const postMessageSpy = jest.spyOn(broadcastChannel, 'postMessage');

        expect(postMessageSpy).toHaveBeenCalledTimes(1);
        expect(postMessageSpy).toHaveBeenNthCalledWith(1, { type: MessageType.Request });
      });

      it('does not post an update message with the initial state', () => {
        const postMessageSpy = jest.spyOn(broadcastChannel, 'postMessage');

        expect(postMessageSpy).toHaveBeenCalledTimes(1);
      });

      it('calls the onSkipFirstBroadcast hook with the initial state', () => {
        expect(onSkipFirstBroadcastMock).toHaveBeenCalledTimes(1);
        expect(onSkipFirstBroadcastMock).toHaveBeenNthCalledWith(1, { a: null, b: null });
      });
    });

    describe('on state change', () => {
      it('posts an update message', () => {
        const postMessageSpy = jest.spyOn(broadcastChannel, 'postMessage');
        postMessageSpy.mockClear();

        store.updateA('a');
        spectator.flushEffects();

        expect(postMessageSpy).toHaveBeenCalledTimes(1);
        expect(postMessageSpy).toHaveBeenNthCalledWith(1, {
          type: MessageType.Update,
          time: expect.any(Number),
          state: { a: 'a', b: null }
        });
      });

      it('does not post an update message on duplicated state change', () => {
        const postMessageSpy = jest.spyOn(broadcastChannel, 'postMessage');
        postMessageSpy.mockClear();

        store.updateA('a');
        spectator.flushEffects();
        store.updateA('a');
        spectator.flushEffects();

        expect(postMessageSpy).toHaveBeenCalledTimes(1);
      });

      it('calls onSkipDuplicatedBroadcast hook on duplicated state change', () => {
        onSkipDuplicatedBroadcastMock.mockClear();

        store.updateA('a');
        spectator.flushEffects();
        store.updateA('a');
        spectator.flushEffects();

        expect(onSkipDuplicatedBroadcastMock).toHaveBeenCalledTimes(1);
        expect(onSkipDuplicatedBroadcastMock).toHaveBeenNthCalledWith(1, { a: 'a', b: null });
      });

      it('does not post an update message if the change is older', () => {
        const isOlderSpy = jest.spyOn(require('./helpers'), 'isOlder');
        isOlderSpy.mockReturnValue(true);
        const postMessageSpy = jest.spyOn(broadcastChannel, 'postMessage');
        postMessageSpy.mockClear();

        store.updateA('a');
        spectator.flushEffects();

        expect(postMessageSpy).not.toHaveBeenCalled();

        isOlderSpy.mockRestore();
      });

      it('calls onSkipOlder hook if the change is older', () => {
        const isOlderSpy = jest.spyOn(require('./helpers'), 'isOlder');
        isOlderSpy.mockReturnValue(true);
        onSkipOlderMock.mockClear();

        store.updateA('a');
        spectator.flushEffects();

        expect(onSkipOlderMock).toHaveBeenCalledTimes(1);
        expect(onSkipOlderMock).toHaveBeenCalledWith(
          expect.objectContaining({
            lastTime: expect.any(Number),
            time: expect.any(Number),
            state: expect.any(Object)
          })
        );

        isOlderSpy.mockRestore();
      });
    });

    describe('on update message', () => {
      let channel: BroadcastChannel | null;
      let message: MessageEvent;

      beforeEach(() => {
        channel = store.getBroadcastChannel();
        message = new MessageEvent('message', {
          data: { type: MessageType.Update, time: 1, state: { a: 1, b: null } }
        });
      });

      it('updates the state with the message state', () => {
        const patchStateSpy = jest.spyOn(require('@ngrx/signals'), 'patchState');
        patchStateSpy.mockClear();

        channel?.onmessage?.(message);
        spectator.flushEffects();

        expect(patchStateSpy).toHaveBeenCalledTimes(1);
        expect(patchStateSpy).toHaveBeenNthCalledWith(1, expect.any(Object), { a: 1, b: null });

        patchStateSpy.mockRestore();
      });

      it('does not update the state if message is older', () => {
        const patchStateSpy = jest.spyOn(require('@ngrx/signals'), 'patchState');
        patchStateSpy.mockClear();
        const isOlderSpy = jest.spyOn(require('./helpers'), 'isOlder');
        isOlderSpy.mockReturnValue(true);

        channel?.onmessage?.(message);
        spectator.flushEffects();

        expect(patchStateSpy).not.toHaveBeenCalled();

        patchStateSpy.mockRestore();
        isOlderSpy.mockRestore();
      });

      it('calls onSkipOlder hook if message is older', () => {
        const patchStateSpy = jest.spyOn(require('@ngrx/signals'), 'patchState');
        patchStateSpy.mockClear();
        const isOlderSpy = jest.spyOn(require('./helpers'), 'isOlder');
        isOlderSpy.mockReturnValue(true);
        onSkipOlderMock.mockClear();

        channel?.onmessage?.(message);
        spectator.flushEffects();

        expect(onSkipOlderMock).toHaveBeenCalledTimes(1);
        expect(onSkipOlderMock).toHaveBeenCalledWith(
          expect.objectContaining({
            lastTime: expect.any(Number),
            time: message.data.time,
            state: message.data.state
          })
        );

        isOlderSpy.mockRestore();
      });

      it('does not repost the received message ', () => {
        const postMessageSpy = jest.spyOn(broadcastChannel, 'postMessage');
        postMessageSpy.mockClear();

        channel?.onmessage?.(message);
        spectator.flushEffects();

        expect(postMessageSpy).not.toHaveBeenCalled();

        postMessageSpy.mockRestore();
      });

      it('calls onMessageError hook if message update is not valid', () => {
        const patchStateSpy = jest.spyOn(require('@ngrx/signals'), 'patchState');
        patchStateSpy.mockClear();
        const isInvalidUpdateMessageSpy = jest.spyOn(require('./helpers'), 'isInvalidUpdateMessage');
        isInvalidUpdateMessageSpy.mockReturnValue(true);
        onMessageErrorMock.mockClear();

        channel?.onmessage?.(message);
        spectator.flushEffects();

        expect(onMessageErrorMock).toHaveBeenCalledTimes(1);
        expect(onMessageErrorMock).toHaveBeenCalledWith(message);

        isInvalidUpdateMessageSpy.mockRestore();
      });
    });

    describe('getBroadcastChannel()', () => {
      it('returns BroadcastChannel instance', () => {
        const bc = store.getBroadcastChannel();

        expect(bc).not.toBeNull();
        expect(bc?.name).toEqual('channel');
      });
    });

    describe('broadcastState()', () => {
      it('does not post an update message due to duplicated state', () => {
        const postMessageSpy = jest.spyOn(broadcastChannel, 'postMessage');
        postMessageSpy.mockClear();

        store.broadcastState();

        expect(postMessageSpy).not.toHaveBeenCalled();
      });

      it('forces posting an update message with the last state when true is passed', () => {
        const postMessageSpy = jest.spyOn(broadcastChannel, 'postMessage');
        postMessageSpy.mockClear();

        store.broadcastState(true);

        expect(postMessageSpy).toHaveBeenCalledTimes(1);
        expect(postMessageSpy).toHaveBeenNthCalledWith(1, {
          type: MessageType.Update,
          time: expect.any(Number),
          state: { a: null, b: null }
        });
      });
    });

    describe('requestBroadcastState()', () => {
      it('posts a request message', () => {
        const postMessageSpy = jest.spyOn(broadcastChannel, 'postMessage');
        postMessageSpy.mockClear();

        store.requestBroadcastState();

        expect(postMessageSpy).toHaveBeenCalledTimes(1);
        expect(postMessageSpy).toHaveBeenNthCalledWith(1, { type: MessageType.Request });
      });
    });
  });
});
