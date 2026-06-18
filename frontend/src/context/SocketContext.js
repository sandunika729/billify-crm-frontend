'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import useSocketHook from '../hooks/useSocket';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { socket, isConnected } = useSocketHook();
  
  
  

  const value = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocketContext = () => useContext(SocketContext);
