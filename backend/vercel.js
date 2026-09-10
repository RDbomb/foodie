import 'dotenv/config';
import {createServer} from 'node:http';
import mongoose from 'mongoose';
import app from './app.js';
import {attachRealtime} from './realtime.js';
import {watchOrders} from './watchOrders.js';

if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');
await mongoose.connect(process.env.MONGO_URI, {maxPoolSize: 5, serverSelectionTimeoutMS: 10000});
const server = createServer(app);
const io = attachRealtime(server, app);
// MongoDB change streams relay updates between independent Vercel instances.
app.set('distributedRealtime', true);
watchOrders(io, app);
export default server;
