import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // Allow Vercel frontend & local clients
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: false,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

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
    io.emit(event, data);
  }
};

export const emitToPatient = (patientId: string, event: string, data: any) => {
  if (io) {
    io.to(`patient_${patientId}`).emit(event, data);
    io.emit(event, data);
  }
};
