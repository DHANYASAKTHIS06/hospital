import React, { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://hospital-lakl.onrender.com';

    const socketInstance = io(backendUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected to Render backend:', socketInstance.id);
      setIsConnected(true);

      if (user) {
        if (user.role === 'ADMIN') {
          socketInstance.emit('join_room', 'admin_room');
        } else if (user.role === 'PATIENT' && user.patient_id) {
          socketInstance.emit('join_room', `patient_${user.patient_id}`);
        }
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected from Render backend');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
