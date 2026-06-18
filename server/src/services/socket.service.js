function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('join:ride', (rideId) => {
      socket.join(`ride:${rideId}`);
    });

    socket.on('join:user', (userId) => {
      socket.join(`user:${userId}`);
    });

    // Stub: real-time driver location broadcast
    socket.on('driver:location', ({ rideId, lat, lng }) => {
      socket.to(`ride:${rideId}`).emit('driver:location', { lat, lng });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}

function notifyUser(io, userId, event, data) {
  io.to(`user:${userId}`).emit(event, data);
}

module.exports = { initSocket, notifyUser };
