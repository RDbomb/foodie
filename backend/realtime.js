import {Server} from 'socket.io';
import {timingSafeEqual} from 'node:crypto';
import {authenticate} from './middleware/auth.js';

// Reuse the REST session checks; cookies stay HttpOnly and never enter JS.
export function socketIdentity(socket){
 const cookie=(socket.request.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('foodie_session='));
 const req={method:'GET',cookies:{foodie_session:cookie?.slice('foodie_session='.length)}};
 return new Promise((resolve,reject)=>authenticate(req,{status(){return this;},json(){reject(new Error('Please sign in again'));}},error=>error?reject(error):resolve(req)));
}
export function canReceive(user,order){
 if(user.role==='admin')return true;
 const field={customer:'customerId',restaurant:'restaurantId',delivery:'deliveryPartnerId'}[user.role];
 const id=user.role==='restaurant'?user.restaurantId:user._id;
 return Boolean(field&&id&&order[field]&&String(id)===String(order[field]));
}
export function attachRealtime(server,app){
 const origins=[process.env.CLIENT_URL||'http://localhost:5173','http://localhost:3000'];
 const io=new Server(server,{path:'/api/socket.io',transports:['websocket'],maxHttpBufferSize:10000,cors:{origin:origins,credentials:true},allowRequest:(req,done)=>done(null,origins.includes(req.headers.origin))});
 app.set('realtime',io);
 io.use(async(socket,next)=>{try{
  const {user,session}=await socketIdentity(socket);
  const a=Buffer.from(typeof socket.handshake.auth.csrf==='string'?socket.handshake.auth.csrf:''),b=Buffer.from(session.csrf);
  if(a.length!==b.length||!timingSafeEqual(a,b))throw new Error('Please sign in again');
  socket.data.user=user;socket.data.sessionId=String(session._id);socket.data.expiresAt=session.expiresAt;
  next();
 }catch{next(new Error('Please sign in again'));}});
 io.on('connection',socket=>{
  socket.join('session:'+socket.data.sessionId);
  const expiry=setTimeout(()=>{socket.emit('session:expired');socket.disconnect(true);},Math.max(0,new Date(socket.data.expiresAt)-Date.now()));
  socket.on('disconnect',()=>clearTimeout(expiry));
 });
 return io;
}
export function revokeRealtime(app,id){app.get('realtime')?.in('session:'+id).disconnectSockets(true);}
export async function publishOrder(app,order,type){
 const io=app.get('realtime');if(!io)return;
 await Promise.all([...io.sockets.sockets.values()].map(async socket=>{
  try{
   const {user}=await socketIdentity(socket);
   // Only an invalidation is sent. The REST API retrieves current permitted data.
   if(canReceive(user,order))socket.emit('orders:changed',{type,orderId:String(order._id)});
   else if(user.role==='delivery' && ['assigned','handoff'].includes(type))socket.emit('orders:sync');
  }catch{socket.emit('session:expired');socket.disconnect(true);}
 }));
}
