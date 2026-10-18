import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PeerServer } from 'peer';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import requestRoutes from './routes/requestRoutes.js'; 
import callRoutes from './routes/callRoutes.js';
import ragRoutes from './routes/ragRoutes.js';
import Message from './models/Message.js';
import Call from './models/Call.js';
import newLawyerRoutes from './routes/newLawyerRoutes.js';
import { socketAuthMiddleware } from './middleware/socketAuthMiddleware.js';
import { encryptMessage, generateRoomKey } from './utils/cryptoUtils.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: function(origin, callback) {
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: false
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
  maxHttpBufferSize: 1e6,
  allowEIO3: true
});

app.use(cors({
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/connect', requestRoutes);
app.use('/api/calls', callRoutes); 
app.use('/api/new-lawyer', newLawyerRoutes);
app.use('/api/rag', ragRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

io.use(socketAuthMiddleware);

// ────────────────────────────────────────────────────────────
// Socket.IO event handlers — consolidated & cleaned up
// ────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.userId}`);
  
  // ── Room join ──
  socket.on("join_room", (userId) => {
    socket.join(userId);
    console.log(`User ${socket.userId} joined room ${userId}`);
  });

  // ── Chat: send / receive messages ──
  socket.on("send_message", async (data) => {
    try {
      if (socket.userId !== data.sender) {
        socket.emit("error", { message: "Unauthorized: sender mismatch" });
        return;
      }
      const roomKey = generateRoomKey(data.sender, data.receiver);
      const encryptedData = encryptMessage(data.message, roomKey);
      const messageToSave = {
        sender: data.sender,
        receiver: data.receiver,
        message: data.message,
        encrypted: encryptedData.encrypted,
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
        isEncrypted: true,
        createdAt: data.createdAt || new Date()
      };
      const newMessage = new Message(messageToSave);
      await newMessage.save();
      const messageData = {
        ...data,
        encrypted: encryptedData.encrypted,
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
        _id: newMessage._id
      };
      io.to(data.receiver).emit("receive_message", messageData);
      io.to(data.sender).emit("receive_message", messageData);
    } catch (err) {
      console.log("Message save error:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // ── Call signaling: initiate / accept / reject / end ──
  socket.on("initiate_call", (data) => {
    // Notify the receiver about incoming call
    io.to(data.receiverId).emit("incoming_call_offer", {
      callerId: data.callerId,
      callerName: data.callerName,
      receiverId: data.receiverId,
      roomId: data.roomId,
      callType: data.callType || 'video'
    });
  });

  socket.on("accept_call", (data) => {
    io.to(data.callerId).emit("call_accepted", {
      receiverId: socket.userId,
      roomId: data.roomId
    });
  });

  socket.on("reject_call", (data) => {
    io.to(data.callerId).emit("call_rejected", {
      receiverId: socket.userId,
      roomId: data.roomId
    });
  });

  socket.on("end_call", (data) => {
    if (!data || !data.roomId) return;
    io.to(data.roomId).emit("call_ended", {
      roomId: data.roomId,
      senderId: socket.userId
    });
    // Also notify the other user directly if their userId is provided
    if (data.to) {
      io.to(data.to).emit("call_ended", {
        roomId: data.roomId,
        senderId: socket.userId
      });
    }
  });

  // ── PeerJS signaling: join call room & share peer IDs ──
  socket.on('join_call_room', ({ roomId, userId, peerId }) => {
    socket.join(roomId);
    console.log(`User ${socket.userId} joined call room ${roomId} with peerId ${peerId}`);
    // Broadcast peerId to others in the room
    socket.to(roomId).emit('peer_id', { peerId, userId: socket.userId });
  });

  // ── Disconnect ──
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

const PORT = Number(process.env.PORT || 3000);

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// PeerServer — plain HTTP, no SSL (avoids self-signed cert browser rejection)
const peerServer = PeerServer({
  port: 9000,
  path: '/peerjs'
});

peerServer.on('connection', (client) => {
  console.log(`Peer connected: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`Peer disconnected: ${client.getId()}`);
});

peerServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('Port 9000 is already in use. PeerServer not started.');
  } else {
    console.error('Peer server error:', err);
  }
});

console.log('PeerServer running on port 9000');