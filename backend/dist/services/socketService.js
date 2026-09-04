"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToPatient = exports.emitToAdmin = exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const env_1 = require("../config/env");
let io = null;
const initSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: [env_1.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            credentials: true,
        },
    });
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        // Join patient specific room or admin room
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
        io.emit(event, data); // Fallback broadcast
    }
};
exports.emitToAdmin = emitToAdmin;
const emitToPatient = (patientId, event, data) => {
    if (io) {
        io.to(`patient_${patientId}`).emit(event, data);
        io.emit(event, data); // Fallback broadcast
    }
};
exports.emitToPatient = emitToPatient;
