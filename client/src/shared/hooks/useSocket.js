import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../lib/auth';

let socketInstance = null;

export function useSocket() {
  const { user } = useAuthStore();
  const socket = useRef(null);

  useEffect(() => {
    if (!user) return;
    if (!socketInstance) {
      socketInstance = io({ path: '/socket.io', transports: ['websocket'] });
    }
    socket.current = socketInstance;
    socket.current.emit('join:user', user.id);

    return () => {};
  }, [user]);

  return socket.current;
}
