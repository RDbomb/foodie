import Order from './models/Order.js';
import {publishOrder} from './realtime.js';

export function changeType(change) {
  if (change.operationType === 'insert') return 'placed';
  const fields = change.updateDescription?.updatedFields || {};
  if (fields.status === 'delivered') return 'delivered';
  if (fields.status === 'out-for-delivery') return 'handoff';
  if ('deliveryPartnerId' in fields) return 'assigned';
  return 'updated';
}

export function watchOrders(io, app) {
  let stream;
  function close() {
    const previous = stream;
    stream = undefined;
    if (previous) void previous.close().catch(() => {});
  }
  io.on('connection', socket => {
    if (!stream) {
      stream = Order.watch([], {fullDocument: 'updateLookup'});
      stream.on('change', change => {
        if (change.fullDocument) {
          void publishOrder(app, change.fullDocument, changeType(change), true).catch(() => {});
        }
      });
      stream.on('error', () => {
        close();
        // Reconnecting clients reload scoped REST data after an interrupted stream.
        io.disconnectSockets(true);
      });
    }
    socket.on('disconnect', () => { if (!io.sockets.sockets.size) close(); });
  });
  return close;
}
