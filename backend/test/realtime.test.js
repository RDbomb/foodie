import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import express from 'express';
import jwt from 'jsonwebtoken';
import {io as client} from 'socket.io-client';
import User from '../models/User.js';
import Session from '../models/Session.js';
import {attachRealtime,publishOrder,revokeRealtime} from '../realtime.js';
process.env.JWT_SECRET='realtime-test-secret'.repeat(3);process.env.NODE_ENV='test';
const people={c:{_id:'c',role:'customer',active:true},other:{_id:'other',role:'customer',active:true},r:{_id:'r',role:'restaurant',restaurantId:'kitchen',active:true},d:{_id:'d',role:'delivery',active:true},a:{_id:'a',role:'admin',active:true}};
const sessions=new Map(Object.keys(people).map(id=>[id,{_id:id,csrf:'csrf',expiresAt:new Date(Date.now()+60000)}]));
User.findById=async id=>people[id];Session.findOne=async q=>sessions.get(q._id)||null;
const app=express(),server=createServer(app);let io,base;const clients=[];
before(async()=>{io=attachRealtime(server,app);await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;});
after(async()=>{clients.forEach(s=>s.disconnect());await new Promise(r=>io.close(r));});
function connect(id,options={}){const token=jwt.sign({},process.env.JWT_SECRET,{subject:id,jwtid:id,expiresIn:'1m',issuer:'foodie',audience:'foodie-web'});const s=client(base,{path:'/api/socket.io',transports:['websocket'],reconnection:false,forceNew:true,auth:{csrf:'csrf'},extraHeaders:{Origin:'http://localhost:5173',Cookie:'foodie_session='+token},...options});clients.push(s);return s;}
function event(s,name){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Missing '+name)),2500);s.once(name,data=>{clearTimeout(timer);resolve(data);});});}
test('websocket rejects unauthenticated, wrong-CSRF and foreign-origin clients',async()=>{for(const options of [{extraHeaders:{Origin:'http://localhost:5173'}},{auth:{csrf:'wrong'}},{extraHeaders:{Origin:'https://evil.example'}}]){const s=connect('c',options);await event(s,'connect_error');assert.equal(s.connected,false);s.disconnect();}});
test('real WebSocket events route across order lifecycle without leaking customer details',async()=>{
 const sockets=Object.fromEntries(Object.keys(people).map(id=>[id,connect(id)]));await Promise.all(Object.values(sockets).map(s=>event(s,'connect')));
 const received={};for(const [id,s] of Object.entries(sockets)){received[id]=[];s.on('orders:changed',e=>received[id].push(e));}
 const order={_id:'order',customerId:'c',restaurantId:'kitchen',phone:'private'};
 await publishOrder(app,order,'placed');await new Promise(r=>setTimeout(r,60));
 assert.equal(received.c.length,1);assert.equal(received.r.length,1);assert.equal(received.a.length,1);assert.equal(received.d.length,0);assert.equal(received.other.length,0);assert.deepEqual(received.c[0],{type:'placed',orderId:'order'});
 order.deliveryPartnerId='d';await publishOrder(app,order,'handoff');await publishOrder(app,order,'delivered');await new Promise(r=>setTimeout(r,60));assert.deepEqual(received.d.map(e=>e.type),['handoff','delivered']);assert.equal(received.other.length,0);
 const gone=event(sockets.d,'disconnect');revokeRealtime(app,'d');await gone;assert.equal(sockets.d.connected,false);
 const expired=event(sockets.c,'session:expired');sessions.delete('c');await publishOrder(app,order,'delivered');await expired;
 Object.values(sockets).forEach(s=>s.disconnect());sessions.set('c',{_id:'c',csrf:'csrf',expiresAt:new Date(Date.now()+60000)});
});
test('reconnecting establishes a fresh authenticated connection',async()=>{const s=connect('c');await event(s,'connect');s.disconnect();const ready=event(s,'connect');s.connect();await ready;assert.equal(s.connected,true);s.disconnect();});
