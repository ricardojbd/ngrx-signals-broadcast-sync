import { isPlatformBrowser, isPlatformServer } from '@angular/common';

/**
 * Checks if the BroadcastChannel API is available in the current platform context.
 *
 * This function verifies if the application is running in a context where the
 * BroadcastChannel API is accessible, covering environments such as server,
 * browser, and Web Worker.
 *
 * @param platformId - The Angular platform identifier used to detect the current
 * platform context. This is typically injected in an Angular application using
 * dependency injection.
 *
 * @returns `true` if the BroadcastChannel API is available in the current context;
 * otherwise, `false`.
 *
 * @example
 * ```typescript
 * constructor(@Inject(PLATFORM_ID) private platformId: object) {
 *   const hasBroadcastChannel = isBroadcastChannelAvailable(this.platformId);
 * }
 * ```
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
 */
export function isBroadcastChannelAvailable(platformId: object) {
  if (isPlatformServer(platformId)) {
    return false;
  }

  if (isPlatformBrowser(platformId)) {
    return typeof window.BroadcastChannel !== 'undefined';
  }

  return typeof BroadcastChannel !== 'undefined';
}
