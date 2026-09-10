import {createContext,useContext,useEffect,useState} from 'react';
import {io} from 'socket.io-client';
import {useAuth} from './AuthContext.jsx';
import {api} from '../lib/api.js';
const Context=createContext({revision:0,status:'offline',notice:''});
export const useLive=()=>useContext(Context);
export function LiveProvider({children}){
 const {user}=useAuth();const [revision,setRevision]=useState(0),[status,setStatus]=useState('offline'),[notice,setNotice]=useState('');
 useEffect(()=>{
  if(!user){setStatus('offline');setNotice('');return;}
  let active=true,timer,retry;
  const base=new URL(api.defaults.baseURL,window.location.origin);
  const socket=io(base.origin,{path:base.pathname.replace(/\/$/,'')+'/socket.io',transports:['websocket'],withCredentials:true,auth:{csrf:api.defaults.headers.common['X-CSRF-Token']},autoConnect:false,reconnectionDelay:1000,reconnectionDelayMax:10000});
  const sync=()=>{if(active)setRevision(n=>n+1);};
  socket.on('connect',()=>{setStatus('connected');sync();});
  const renew=()=>{clearTimeout(retry);retry=setTimeout(async()=>{if(!active)return;try{const {data}=await api.get('/auth/me');if(!active)return;if(data.user.id!==user.id){window.dispatchEvent(new Event('foodie-session-expired'));return;}socket.auth={csrf:data.csrf};socket.connect();}catch{if(active)renew();}},5000);};
  socket.on('disconnect',reason=>{if(active)setStatus('reconnecting');if(reason==='io server disconnect'&&active)renew();});
  socket.on('connect_error',()=>{if(active){setStatus('reconnecting');if(!socket.active)renew();}});
  socket.on('session:expired',()=>window.dispatchEvent(new Event('foodie-session-expired')));
  socket.on('orders:sync',sync);
  socket.on('orders:changed',event=>{sync();setNotice(({placed:'New order received',assigned:'Delivery assignment updated',handoff:'Order handed to delivery partner',delivered:'Order delivered'})[event.type]||'Order updated');clearTimeout(timer);timer=setTimeout(()=>{if(active)setNotice('');},6000);});
  setStatus('connecting');socket.connect();
  return()=>{active=false;clearTimeout(timer);clearTimeout(retry);socket.removeAllListeners();socket.disconnect();};
 },[user?.id]);
 return <Context.Provider value={{revision,status,notice}}>{children}</Context.Provider>;
}
export function LiveStatus(){const {status,notice}=useLive();const {user}=useAuth();if(!user)return null;return <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-3 text-xs flex flex-wrap justify-end gap-3" aria-live="polite"><span className={status==='connected'?'text-teal':'text-ink/60'}>{status==='connected'?'● Live updates connected':status==='connecting'?'Connecting live updates…':'Reconnecting live updates…'}</span>{notice&&<span role="status" className="text-teal font-semibold">{notice}</span>}</div>;}
