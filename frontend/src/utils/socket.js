import io from 'socket.io-client';
import { SOCKET_URL } from './config';

let socket = null;
let lastUserId = null;
let lastToken = null;

export const connectSocket = (userId, token) => {
  // Reuse existing connection if credentials match
  if (socket && lastUserId === userId && lastToken === token) {
    if (socket.connected) {
      socket.emit('join_room', userId);
    }
    return socket;
  }

  // Disconnect old socket only if userId or token changed
  if (socket && (lastUserId !== userId || lastToken !== token)) {
    console.log('Disconnecting old socket, creating new connection');
    socket.disconnect();
    socket = null;
  }

  // Create new socket if no existing connection
  if (!socket) {
    lastUserId = userId;
    lastToken = token;

    // If SOCKET_URL is empty (dev mode), pass undefined so socket.io connects to current origin
    const connectionUrl = SOCKET_URL || undefined;

    socket = io(connectionUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      transports: ['websocket', 'polling'],
      forceNew: false
    });

    socket.on('connect', () => {
      console.log('✅ Connected to socket server');
      socket.emit('join_room', userId);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from socket server:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error);
    });
  }

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    lastUserId = null;
    lastToken = null;
  }
};