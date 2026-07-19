import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { getAccessToken } from '../services/api';

// Derive socket URL from API URL if NEXT_PUBLIC_SOCKET_URL is not explicitly set
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
    : 'http://localhost:5000');

export default function useSocket() {
  const { user, isAuthenticated } = useAuth();
  const socket = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      
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
