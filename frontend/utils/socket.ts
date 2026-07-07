import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
};
