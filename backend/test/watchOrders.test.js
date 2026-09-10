import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import Order from '../models/Order.js';
import {changeType, watchOrders} from '../watchOrders.js';

test('database events identify order lifecycle transitions', () => {
  assert.equal(changeType({operationType:'insert'}), 'placed');
  assert.equal(changeType({updateDescription:{updatedFields:{status:'out-for-delivery',deliveryPartnerId:'rider'}}}), 'handoff');
  assert.equal(changeType({updateDescription:{updatedFields:{status:'delivered'}}}), 'delivered');
  assert.equal(changeType({updateDescription:{updatedFields:{deliveryPartnerId:'rider'}}}), 'assigned');
});

test('one database stream serves local sockets and closes on disconnect or failure', async () => {
  const original = Order.watch;
  let opened=0, closed=0, stream;
  Order.watch=()=>{opened++;stream=new EventEmitter();stream.close=async()=>{closed++;};return stream;};
  const io=new EventEmitter();io.sockets={sockets:new Map()};
  io.disconnectSockets=()=>{for(const socket of [...io.sockets.sockets.values()]){io.sockets.sockets.delete(socket);socket.emit('disconnect');}};
  const stop=watchOrders(io,{get:()=>undefined});
  try {
    const one=new EventEmitter(),two=new EventEmitter();
    io.sockets.sockets.set(one,one);io.emit('connection',one);
    io.sockets.sockets.set(two,two);io.emit('connection',two);
    assert.equal(opened,1);
    io.sockets.sockets.delete(one);one.emit('disconnect');assert.equal(closed,0);
    stream.emit('error',new Error('connection lost'));assert.equal(closed,1);assert.equal(io.sockets.sockets.size,0);
    const three=new EventEmitter();io.sockets.sockets.set(three,three);io.emit('connection',three);assert.equal(opened,2);
    io.sockets.sockets.delete(three);three.emit('disconnect');assert.equal(closed,2);
  } finally {stop();Order.watch=original;}
});
