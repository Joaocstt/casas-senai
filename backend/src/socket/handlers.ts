import { Server, Socket } from 'socket.io';

export const setupSocketHandlers = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('join:casa', (casaId: string) => {
            socket.join(casaId);
            console.log(`User ${socket.id} joined room: ${casaId}`);
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};

export const emitScoreUpdate = (io: Server, casaId: string, index: number, points: number) => {
    io.to(casaId).emit('score:update', { casaId, index, points });
};

export const emitPlacarUpdate = (io: Server, casas: any[]) => {
    io.emit('placar:update', { casas });
};
