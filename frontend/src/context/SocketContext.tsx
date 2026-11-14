import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  // Initialize Socket.IO connection once
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://hospital-lakl.onrender.com';

    const socketInstance = io(backendUrl, {
      transports: ['polling', 'websocket'], // Reliable polling fallback first, then upgrade to websocket
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 15000,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      // Soft-fail: the application continues to operate smoothly using standard HTTP polling
      setIsConnected(false);
    });

    return () => {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Join user room whenever user or socket connection updates
  useEffect(() => {
    const s = socketRef.current;
    if (s && isConnected && user) {
      if (user.role === 'ADMIN') {
        s.emit('join_room', 'admin_room');
      } else if (user.role === 'PATIENT' && user.patient_id) {
        s.emit('join_room', `patient_${user.patient_id}`);
      }
    }
  }, [isConnected, user?.role, user?.patient_id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
