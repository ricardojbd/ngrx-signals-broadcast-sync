import { BroadcastSyncFeatureResult, Message, MessageType } from './models';

export const NOOP = () => null;

export const BroadcastSyncStub: Pick<BroadcastSyncFeatureResult, 'methods'>['methods'] = {
  getBroadcastChannel: NOOP,
  broadcastState: NOOP,
  requestBroadcastState: NOOP,
  _patchStateFromBroadcast: NOOP
};

export function isInvalidUpdateMessage<State>(message: Message<State>) {
  return !(
    message.type === MessageType.Update &&
    typeof message.time === 'number' &&
    message.time >= 0 &&
    message.state != null
  );
}
