import { TestBed } from '@angular/core/testing';
import { withBroadcastRequestState } from './with-broadcast-request-state';
import { signalStore } from '@ngrx/signals';
import { withBroadcastState } from './with-broadcast-state';
import { BroadcastChannel } from 'worker_threads';

const channel = 'FooBar';
const requestMessage = 'RequestState';

describe('withBroadcastRequestState', () => {
  it('adds methods for request state', () => {
    TestBed.runInInjectionContext(() => {
      const Store = signalStore(withBroadcastState(channel), withBroadcastRequestState());
      const store = new Store();

      expect(Object.keys(store)).toEqual(['getBroadcastChannel', 'postState', '_postState', 'requestState']);
    });
  });

  describe('without BroadcastChannel', () => {
    beforeAll(() => {
      Reflect.set(globalThis, 'BroadcastChannel', undefined);
    });

    it('requestState() does not throw error', () => {
      TestBed.runInInjectionContext(() => {
        const Store = signalStore(withBroadcastState(channel), withBroadcastRequestState());
        const store = new Store();

        expect(() => store.requestState()).not.toThrow();
      });
    });
  });

  describe('with BroadcastChannel', () => {
    beforeAll(() => {
      Reflect.set(globalThis, 'BroadcastChannel', BroadcastChannel);
    });

    it('requestState() posts the request state', () => {
      TestBed.runInInjectionContext(() => {
        const Store = signalStore(withBroadcastState(channel), withBroadcastRequestState());
        const store = new Store();
        const spy = jest.spyOn(store.getBroadcastChannel() as unknown as BroadcastChannel, 'postMessage');

        expect(spy).not.toHaveBeenCalled();

        store.requestState();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenNthCalledWith(1, requestMessage);
      });
    });
  });
});
