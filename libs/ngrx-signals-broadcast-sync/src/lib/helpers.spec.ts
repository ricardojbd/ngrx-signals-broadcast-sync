import { isInvalidUpdateMessage, isOlder, runGuard } from './helpers';
import { MessageType } from './models';

jest.mock('@angular/common', () => ({
  isPlatformServer: jest.fn()
}));

describe('runGuard', () => {
  it('returns false if not isPlatformServer and exsists BroadcastChannel', () => {
    const runGuardSpy = jest.spyOn(require('@angular/common'), 'isPlatformServer');
    runGuardSpy.mockReturnValue(false);
    (window.BroadcastChannel as any) = {};

    expect(runGuard({})).toEqual(false);

    runGuardSpy.mockRestore();
  });

  it('returns true if isPlatformServer and exsists BroadcastChannel', () => {
    const runGuardSpy = jest.spyOn(require('@angular/common'), 'isPlatformServer');
    runGuardSpy.mockReturnValue(true);
    (window.BroadcastChannel as any) = {};

    expect(runGuard({})).toEqual(true);

    runGuardSpy.mockRestore();
  });

  it('returns true if not isPlatformServer and does not exsist BroadcastChannel', () => {
    const runGuardSpy = jest.spyOn(require('@angular/common'), 'isPlatformServer');
    runGuardSpy.mockReturnValue(false);
    (window.BroadcastChannel as any) = null;

    expect(runGuard({})).toEqual(true);

    runGuardSpy.mockRestore();
  });

  it('returns true if isPlatformServer and does not exsist BroadcastChannel', () => {
    const runGuardSpy = jest.spyOn(require('@angular/common'), 'isPlatformServer');
    runGuardSpy.mockReturnValue(true);
    (window.BroadcastChannel as any) = null;

    expect(runGuard({})).toEqual(true);

    runGuardSpy.mockRestore();
  });
});

describe('isInvalidUpdateMessage', () => {
  it('returns false if valid update message', () => {
    expect(isInvalidUpdateMessage({ type: MessageType.Update, time: 0, state: {} })).toEqual(false);
  });

  it('returns true if invalid type', () => {
    expect(isInvalidUpdateMessage({ type: MessageType.Request as any, time: 0, state: {} })).toEqual(true);
  });

  it('returns true if time is not a number', () => {
    expect(isInvalidUpdateMessage({ type: MessageType.Update, time: '0' as any, state: {} })).toEqual(true);
  });

  it('returns true if time is < 0', () => {
    expect(isInvalidUpdateMessage({ type: MessageType.Update, time: -1 as any, state: {} })).toEqual(true);
  });

  it('returns true if state is null', () => {
    expect(isInvalidUpdateMessage({ type: MessageType.Update, time: 0, state: null as any })).toEqual(true);
  });

  it('returns true if all invalid', () => {
    expect(
      isInvalidUpdateMessage({
        type: MessageType.Request as any,
        time: '0' as any,
        state: null as any
      })
    ).toEqual(true);
  });
});

describe('isOlder', () => {
  describe('with skipOlder true', () => {
    it('returns true if time < lastTime', () => {
      expect(isOlder({ time: 0, lastTime: 1, skipOlder: true })).toEqual(true);
    });

    it('returns false if time = lastTime', () => {
      expect(isOlder({ time: 2, lastTime: 2, skipOlder: true })).toEqual(false);
    });

    it('returns false if time > lastTime', () => {
      expect(isOlder({ time: 3, lastTime: 2, skipOlder: true })).toEqual(false);
    });
  });
  describe('with skipOlder false', () => {
    it('returns false if time < lastTime', () => {
      expect(isOlder({ time: 1, lastTime: 2, skipOlder: false })).toEqual(false);
    });

    it('returns false if time = lastTime', () => {
      expect(isOlder({ time: 2, lastTime: 2, skipOlder: false })).toEqual(false);
    });

    it('returns false if time > lastTime', () => {
      expect(isOlder({ time: 3, lastTime: 2, skipOlder: false })).toEqual(false);
    });
  });
});
