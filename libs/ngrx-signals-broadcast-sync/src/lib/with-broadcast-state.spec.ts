import { getState, patchState, signalStore, withState } from '@ngrx/signals';
import { withBroadcastState } from './with-broadcast-state';
import { TestBed } from '@angular/core/testing';
import { BroadcastChannel } from 'worker_threads';

const initialState = { foo: 'bar' };
const newState = { foo: 'bar2' };
const channel = 'FooBar';
const message = new MessageEvent('message', { data: newState });
const messageError = new MessageEvent('messageerror', {});

describe('withBroadcastState', () => {
  it('adds methods for broadcast state', () => {
    TestBed.runInInjectionContext(() => {
      const Store = signalStore(withBroadcastState(channel));
      const store = new Store();

      expect(Object.keys(store)).toEqual(['getBroadcastChannel', 'postState', '_postState']);
    });
  });

  describe('without BroadcastChannel', () => {
    beforeAll(() => {
      Reflect.set(globalThis, 'BroadcastChannel', undefined);
    });

    it('getBroadcastChannel() returns undefined', () => {
      TestBed.runInInjectionContext(() => {
        const Store = signalStore(withBroadcastState(channel));
        const store = new Store();

        expect(store.getBroadcastChannel()).toBeUndefined();
      });
    });

    it('postState() does not throw error', () => {
      TestBed.runInInjectionContext(() => {
        const Store = signalStore(withBroadcastState(channel));
        const store = new Store();

        expect(() => store.postState()).not.toThrow();
      });
    });

    it('_postState(state) does not throw error', () => {
      TestBed.runInInjectionContext(() => {
        const Store = signalStore(withBroadcastState(channel));
        const store: any = new Store();

        expect(() => store._postState(newState)).not.toThrow();
      });
    });

    it('runguard is called on init', () => {
      TestBed.runInInjectionContext(() => {
        const runGuard = jest.fn(() => true);
        const Store = signalStore(withBroadcastState({ channel, runGuard }));
        new Store();

        expect(runGuard).toHaveBeenCalledTimes(1);
        expect(runGuard).toHaveBeenNthCalledWith(1, 'browser');
      });
    });
  });

  describe('with BroadcastChannel', () => {
    beforeAll(() => {
      Reflect.set(globalThis, 'BroadcastChannel', BroadcastChannel);
    });

    it('getBroadcastChannel() returns the BroadcastChannel', () => {
      TestBed.runInInjectionContext(() => {
        const Store = signalStore(withBroadcastState(channel));
        const store = new Store();
        const broadcast = store.getBroadcastChannel();

        expect(broadcast).toBeInstanceOf(BroadcastChannel);
        expect(broadcast?.name).toEqual(channel);
      });
    });

    it('postState() posts the current state', () => {
      TestBed.runInInjectionContext(() => {
        const Store = signalStore(withState(initialState), withBroadcastState(channel));
        const store: any = new Store();
        const spy = jest.spyOn(store.getBroadcastChannel(), 'postMessage');

        expect(spy).not.toHaveBeenCalled();

        store.postState();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenNthCalledWith(1, initialState);
      });
    });

    it('_postState(state) posts the state from argument', () => {
      TestBed.runInInjectionContext(() => {
        const Store = signalStore(withState(initialState), withBroadcastState(channel));
        const store: any = new Store();
        const spy = jest.spyOn(store.getBroadcastChannel(), 'postMessage');

        expect(spy).not.toHaveBeenCalled();

        store._postState(newState);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenNthCalledWith(1, newState);
      });
    });

    it('posts the current state on state change', () => {
      TestBed.runInInjectionContext(() => {
        const Store = signalStore(withState(initialState), withBroadcastState(channel));
        const store: any = new Store();
        const spy = jest.spyOn(store.getBroadcastChannel(), 'postMessage');
        TestBed.flushEffects();

        expect(spy).not.toHaveBeenCalled();

        patchState(store, newState);
        TestBed.flushEffects();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenNthCalledWith(1, newState);
      });
    });

    it('sets the state from message event', () => {
      TestBed.runInInjectionContext(() => {
        const Store = signalStore(withState(initialState), withBroadcastState(channel));
        const store: any = new Store();
        const broadcast = store.getBroadcastChannel();

        expect(getState(store)).toEqual(initialState);

        broadcast.onmessage?.(message);

        expect(getState(store)).toEqual(newState);
      });
    });

    it('does not post the updated state on message event', () => {
      TestBed.runInInjectionContext(() => {
        const Store = signalStore(withBroadcastState(channel));
        const store: any = new Store();
        const broadcast = store.getBroadcastChannel();
        const spy = jest.spyOn(broadcast, 'postMessage');

        expect(spy).not.toHaveBeenCalled();

        broadcast.onmessage?.(message);

        expect(spy).not.toHaveBeenCalled();
      });
    });

    it('onMessageError does nothing', () => {
      TestBed.runInInjectionContext(() => {
        const Store = signalStore(withBroadcastState(channel));
        const store: any = new Store();
        const broadcast = store.getBroadcastChannel();
        const spy = jest.spyOn(broadcast, 'onmessageerror');

        expect(spy).not.toHaveBeenCalled();

        broadcast.onmessageerror?.(messageError);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenNthCalledWith(1, messageError);
      });
    });

    it('runguard is called on init', () => {
      TestBed.runInInjectionContext(() => {
        const runGuard = jest.fn(() => false);
        const Store = signalStore(withBroadcastState({ channel, runGuard }));
        new Store();

        expect(runGuard).toHaveBeenCalledTimes(1);
        expect(runGuard).toHaveBeenNthCalledWith(1, 'browser');
      });
    });

    it('effectInterceptor is called on effect', () => {
      TestBed.runInInjectionContext(() => {
        const effectInterceptor = jest.fn((state) => state);
        const Store = signalStore(withState(initialState), withBroadcastState({ channel, effectInterceptor }));
        new Store();
        TestBed.flushEffects();

        expect(effectInterceptor).toHaveBeenCalledTimes(1);
        expect(effectInterceptor).toHaveBeenNthCalledWith(1, initialState);
      });
    });

    it('effectInterceptor stops execution if returns null', () => {
      TestBed.runInInjectionContext(() => {
        const effectInterceptor = jest.fn(() => null);
        const Store = signalStore(withState(initialState), withBroadcastState({ channel, effectInterceptor }));
        const store: any = new Store();
        const spy = jest.spyOn(store, '_postState');
        TestBed.flushEffects();
        patchState(store, newState);
        TestBed.flushEffects();

        expect(spy).not.toHaveBeenCalled();
      });
    });

    it('postMessageInterceptor is called on postState', () => {
      TestBed.runInInjectionContext(() => {
        const postMessageInterceptor = jest.fn((state) => state);
        const Store = signalStore(withState(initialState), withBroadcastState({ channel, postMessageInterceptor }));
        const store = new Store();

        expect(postMessageInterceptor).not.toHaveBeenCalled();

        store.postState();

        expect(postMessageInterceptor).toHaveBeenCalledTimes(1);
        expect(postMessageInterceptor).toHaveBeenNthCalledWith(1, initialState);
      });
    });

    it('postMessageInterceptor stops execution if returns null', () => {
      TestBed.runInInjectionContext(() => {
        const postMessageInterceptor = jest.fn(() => null);
        const Store = signalStore(withState(initialState), withBroadcastState({ channel, postMessageInterceptor }));
        const store: any = new Store();
        const spy = jest.spyOn(store.getBroadcastChannel(), 'postMessage');

        expect(spy).not.toHaveBeenCalled();

        store.postState();

        expect(spy).not.toHaveBeenCalled();
      });
    });

    it('onMessageInterceptor is called on message', () => {
      TestBed.runInInjectionContext(() => {
        const onMessageInterceptor = jest.fn((message) => message.data);
        const Store = signalStore(withBroadcastState({ channel, onMessageInterceptor }));
        const store: any = new Store();
        const broadcast = store.getBroadcastChannel();

        expect(onMessageInterceptor).not.toHaveBeenCalled();

        broadcast.onmessage?.(message);

        expect(onMessageInterceptor).toHaveBeenCalledTimes(1);
        expect(onMessageInterceptor).toHaveBeenNthCalledWith(1, message);
      });
    });

    it('onMessageInterceptor stops execution if returns null', () => {
      TestBed.runInInjectionContext(() => {
        const Store = signalStore(
          withState(initialState),
          withBroadcastState({ channel, onMessageInterceptor: () => null })
        );
        const store: any = new Store();
        const broadcast = store.getBroadcastChannel();

        expect(getState(store)).toEqual(initialState);

        broadcast.onmessage?.(message);

        expect(getState(store)).toEqual(initialState);
      });
    });

    it('onMessageInterceptor stops execution if returns no object', () => {
      TestBed.runInInjectionContext(() => {
        const Store = signalStore(
          withState(initialState),
          withBroadcastState({ channel, onMessageInterceptor: () => '' as unknown as object })
        );
        const store: any = new Store();
        const broadcast = store.getBroadcastChannel();

        expect(getState(store)).toEqual(initialState);

        broadcast.onmessage?.(message);

        expect(getState(store)).toEqual(initialState);
      });
    });

    it('onMessageError is called on message error', () => {
      TestBed.runInInjectionContext(() => {
        const onMessageError = jest.fn((message) => undefined);
        const Store = signalStore(withBroadcastState({ channel, onMessageError }));
        const store: any = new Store();
        const broadcast = store.getBroadcastChannel();

        expect(onMessageError).not.toHaveBeenCalled();

        broadcast.onmessageerror?.(messageError);

        expect(onMessageError).toHaveBeenCalledTimes(1);
        expect(onMessageError).toHaveBeenNthCalledWith(1, messageError);
      });
    });

    it('onDestroy closes the BroadcastChannel', () => {
      TestBed.runInInjectionContext(() => {
        const Store = signalStore(withBroadcastState(channel));
        const store: any = new Store();
        const spy = jest.spyOn(store.getBroadcastChannel(), 'close');

        expect(spy).not.toHaveBeenCalled();

        TestBed.resetTestingModule();

        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
  });
});
