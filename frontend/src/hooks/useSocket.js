import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { getAccessToken } from '../services/api';

// Derive socket URL from NEXT_PUBLIC_API_URL by stripping /api from the end
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
    : null);

export default function useSocket() {
  const { user, isAuthenticated } = useAuth();
  const socket = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && SOCKET_URL) {
      
      const token = getAccessToken();

      if (!token) return;

      socket.current = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
      });

      socket.current.on('connect', () => {
        setIsConnected(true);
      });

      socket.current.on('disconnect', () => {
        setIsConnected(false);
      });

      return () => {
        if (socket.current) {
          socket.current.disconnect();
        }
      };
    }
  }, [isAuthenticated, user]);

  return { socket: socket.current, isConnected };
}
