import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { CLIENT_URL } from '../config/env';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join patient specific room or admin room
    socket.on('join_room', (room: string) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO is not initialized!');
  }
  return io;
};

export const emitToAdmin = (event: string, data: any) => {
  if (io) {
    io.to('admin_room').emit(event, data);
    io.emit(event, data); // Fallback broadcast
  }
};

export const emitToPatient = (patientId: string, event: string, data: any) => {
  if (io) {
    io.to(`patient_${patientId}`).emit(event, data);
    io.emit(event, data); // Fallback broadcast
  }
};
