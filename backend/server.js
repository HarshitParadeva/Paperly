require('dotenv').config();
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const classroomRoutes = require('./routes/classroomRoutes');
const postRoutes = require('./routes/postRoutes');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

// Load .env variables
dotenv.config();

// Debug: check if OpenAI key loaded
console.log("🔑 OpenAI Key loaded?", !!process.env.OPENROUTER_API_KEY);

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'], // allow frontend
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());
app.use('/api/posts', postRoutes);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Debug logger for every request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/classrooms', classroomRoutes);

// Serve frontend
const frontendPath = path.join(__dirname, '..');
app.use(express.static(frontendPath));
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// --- NEW: Handle Multer/GridFS file upload errors ---
app.use((err, req, res, next) => {
  if (err && /Unsupported file type|File too large/i.test(err.message)) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('🔥 Internal server error:', err);
  res.status(500).json({ message: 'Something went wrong' });
});

// --- Socket.IO Chat Logic ---
io.on('connection', (socket) => {
  console.log('🟢 A user connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('chatMessage', ({ roomId, message }) => {
    io.to(roomId).emit('chatMessage', {
      message,
      sender: socket.id,
      time: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});


require('dotenv').config();

console.log("🔑 ENV Check:");
console.log("OPENROUTER_API_KEY exists?", !!process.env.OPENROUTER_API_KEY);
console.log("OPENROUTER_MODEL:", process.env.OPENROUTER_MODEL);
console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Loaded" : "❌ Missing");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ Loaded" : "❌ Missing");
