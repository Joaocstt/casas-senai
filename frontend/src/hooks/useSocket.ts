import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || '';

export const useSocket = (casaId?: string, onScoreUpdate?: (data: any) => void) => {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = io(SOCKET_URL);
        socketRef.current = socket;

        if (casaId) {
            socket.emit('join:casa', casaId);
        }

        if (onScoreUpdate) {
            socket.on('score:update', onScoreUpdate);
        }

        return () => {
            socket.disconnect();
        };
    }, [casaId, onScoreUpdate]);

    return socketRef.current;
};
