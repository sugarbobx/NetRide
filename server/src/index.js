require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const ridesRoutes = require('./routes/rides');
const bookingsRoutes = require('./routes/bookings');
const paymentsRoutes = require('./routes/payments');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const { initSocket } = require('./services/socket.service');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);
initSocket(io);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

const authLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 10, message: { error: 'Trop de tentatives. Réessayez dans 10 minutes.' } });

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../../public')));
  app.get('*', (_req, res) => res.sendFile(path.join(__dirname, '../../public/index.html')));
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`NetRide API running on port ${PORT} [${process.env.NODE_ENV}]`));
