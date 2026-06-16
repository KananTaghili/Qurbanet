'use client';
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { BASE_URL } from '../lib/api';

const SOCKET_URL = BASE_URL.replace(/\/api$/, '');

// Module-level singleton — one connection shared across all pages
let _socket = null;

function getSocket() {
  if (_socket?.connected) return _socket;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) return null;

  if (_socket) {
    _socket.auth = { token };
    _socket.connect();
    return _socket;
  }

  _socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  return _socket;
}

export function disconnectSocket() {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}

/**
 * useSocket({ "order:updated": (data) => ..., ... })
 * Attaches event listeners to the shared socket while the component is mounted.
 */
export function useSocket(eventHandlers) {
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;

    const attached = [];
    Object.entries(handlersRef.current).forEach(([event, cb]) => {
      sock.on(event, cb);
      attached.push([event, cb]);
    });

    return () => {
      attached.forEach(([event, cb]) => sock.off(event, cb));
    };
  }, []);
}
