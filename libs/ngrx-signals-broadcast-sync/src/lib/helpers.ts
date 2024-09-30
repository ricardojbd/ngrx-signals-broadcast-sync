import { isPlatformServer } from '@angular/common';

import { MessageType, UpdateMessage } from './models';

export function runGuard(platformId: object) {
  return isPlatformServer(platformId) || window.BroadcastChannel == null;
}

export function isInvalidUpdateMessage<State>(message: UpdateMessage<State>) {
  const isInvalidType = message.type !== MessageType.Update;
  const isInvalidTime = typeof message.time !== 'number' || message.time < 0;
  const isInvalidState = message.state == null;

  return isInvalidType || isInvalidTime || isInvalidState;
}

export function isOlder(args: { time: number; lastTime: number; skipOlder: boolean }): boolean {
  return args.skipOlder && args.time < args.lastTime;
}
