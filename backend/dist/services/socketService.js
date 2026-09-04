"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToPatient = exports.emitToAdmin = exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io = null;
const initSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: '*', // Allow Vercel frontend & local clients
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            credentials: false,
        },
    });
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        socket.on('join_room', (room) => {
            socket.join(room);
            console.log(`Socket ${socket.id} joined room: ${room}`);
        });
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO is not initialized!');
    }
    return io;
};
exports.getIO = getIO;
const emitToAdmin = (event, data) => {
    if (io) {
        io.to('admin_room').emit(event, data);
        io.emit(event, data);
    }
};
exports.emitToAdmin = emitToAdmin;
const emitToPatient = (patientId, event, data) => {
    if (io) {
        io.to(`patient_${patientId}`).emit(event, data);
        io.emit(event, data);
    }
};
exports.emitToPatient = emitToPatient;
