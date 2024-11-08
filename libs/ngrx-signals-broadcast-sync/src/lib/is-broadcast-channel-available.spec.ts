import { isBroadcastChannelAvailable } from './is-broadcast-channel-available';

jest.mock('@angular/common', () => ({
  isPlatformServer: jest.fn(),
  isPlatformBrowser: jest.fn()
}));

describe('isBroadcastChannelAvailable', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns false if isPlatformServer and BroadcastChannel exists', () => {
    jest.spyOn(require('@angular/common'), 'isPlatformServer').mockReturnValue(true);
    jest.spyOn(require('@angular/common'), 'isPlatformBrowser').mockReturnValue(false);
    (window as any).BroadcastChannel = {};

    expect(isBroadcastChannelAvailable({})).toEqual(false);
  });

  it('returns false if isPlatformServer and BroadcastChannel does not exist', () => {
    jest.spyOn(require('@angular/common'), 'isPlatformServer').mockReturnValue(true);
    jest.spyOn(require('@angular/common'), 'isPlatformBrowser').mockReturnValue(false);
    (window as any).BroadcastChannel = undefined;

    expect(isBroadcastChannelAvailable({})).toEqual(false);
  });

  it('returns true if isPlatformBrowser and BroadcastChannel exists', () => {
    jest.spyOn(require('@angular/common'), 'isPlatformServer').mockReturnValue(false);
    jest.spyOn(require('@angular/common'), 'isPlatformBrowser').mockReturnValue(true);
    (window as any).BroadcastChannel = {};

    expect(isBroadcastChannelAvailable({})).toEqual(true);
  });

  it('returns false if isPlatformBrowser and BroadcastChannel does not exist', () => {
    jest.spyOn(require('@angular/common'), 'isPlatformServer').mockReturnValue(false);
    jest.spyOn(require('@angular/common'), 'isPlatformBrowser').mockReturnValue(true);
    (window as any).BroadcastChannel = undefined;

    expect(isBroadcastChannelAvailable({})).toEqual(false);
  });

  it('returns true in Web Worker if BroadcastChannel exists', () => {
    jest.spyOn(require('@angular/common'), 'isPlatformServer').mockReturnValue(false);
    jest.spyOn(require('@angular/common'), 'isPlatformBrowser').mockReturnValue(false);
    delete (global as any).window;
    (global as any).BroadcastChannel = {};

    expect(isBroadcastChannelAvailable({})).toEqual(true);

    (global as any).window = {};
    delete (global as any).BroadcastChannel;
  });

  it('returns false in Web Worker if BroadcastChannel does not exist', () => {
    jest.spyOn(require('@angular/common'), 'isPlatformServer').mockReturnValue(false);
    jest.spyOn(require('@angular/common'), 'isPlatformBrowser').mockReturnValue(false);
    delete (global as any).window;
    (global as any).BroadcastChannel = undefined;

    expect(isBroadcastChannelAvailable({})).toEqual(false);

    (global as any).window = {};
  });
});
