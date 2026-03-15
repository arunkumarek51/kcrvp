const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/credits', require('./routes/credits'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/auditor', require('./routes/auditor'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/blockchain', require('./routes/blockchain'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on('join-room', (userId) => socket.join(userId));
  socket.on('disconnect', () => console.log(`Client disconnected: ${socket.id}`));
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kcrvp')
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 KCRVP Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => { 
    console.error('❌ MongoDB connection error:', err); 
    process.exit(1); 
  });

module.exports = { app, io };
