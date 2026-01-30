import './config/env.js'; // MUST BE VERY FIRST - loads environment variables

import express from "express"
import mongoose from 'mongoose'
import userRoutes from './routes/userRoutes.js'
import authRoutes from './routes/authRoutes.js'
import caseRoutes from './routes/caseRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import chatbotRoutes from "./routes/chatbotRoutes.js";
import reviewRoutes from './routes/reviewRoutes.js'
import finalizeRoutes from './routes/finalizeRoutes.js'
import clientsinfoRoutes from './routes/clientsinfoRoutes.js'
import eventRoutes from './routes/eventRoutes.js'
import caseRecordRoutes from './routes/caseRecordRoutes.js'
import dotenv from 'dotenv'
import cors from "cors"
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import admin from 'firebase-admin'
import upload from './config/multerConfig.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const app = express()

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable if you have issues with CSP
  crossOriginEmbedderPolicy: false,
}));

// Rate Limiting - More generous for admin operations
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Increased to 2000 requests per windowMs for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development', // Skip rate limiting in development
});

// Only apply rate limiting in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api', limiter);
}

// CORS Configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(express.json({ limit: '10mb' })) // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cors(corsOptions))

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request timeout middleware - prevents hanging requests
app.use((req, res, next) => {
  // Set timeout for all requests (30 seconds)
  req.setTimeout(30000);
  res.setTimeout(30000);
  
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout' });
    }
  }, 30000);
  
  res.on('finish', () => clearTimeout(timeout));
  res.on('close', () => clearTimeout(timeout));
  
  next();
});

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Public Routes (no auth required)
app.use("/api/ai-assistant", chatbotRoutes); // AI Chatbot - public access

// Test route to verify server is working
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working!" });
});

// File upload route for Word documents (PDF stays as base64)
app.post('/api/upload/document', upload.single('document'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return file information
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/documents/${req.file.filename}`;
    
    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl,
        path: `/uploads/documents/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed', details: error.message });
  }
});

// File delete route for Word documents
app.delete('/api/upload/document/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads/documents', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('File delete error:', error);
    res.status(500).json({ error: 'File deletion failed', details: error.message });
  }
});

// Protected Routes (auth required)
app.use('/api/users', userRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/cases', caseRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/finalize', finalizeRoutes)
app.use('/api/clientsinfo', clientsinfoRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/caserecords', caseRecordRoutes)

// MongoDB Connection with improved configuration
const mongoOptions = {
  maxPoolSize: 10, // Maximum connection pool size
  minPoolSize: 2, // Minimum connection pool size
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
};

mongoose.connect(process.env.MONGO_URL, mongoOptions)
  .then(() => {
    console.log('MongoDB connected successfully');
    console.log('Connection pool configured: min 2, max 10 connections');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if database connection fails
  });

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Handle specific error types
  if (err.name === 'MongoTimeoutError' || err.name === 'MongoNetworkError') {
    return res.status(503).json({ 
      error: 'Database temporarily unavailable',
      message: 'Please try again in a moment'
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation error',
      message: err.message
    });
  }
  
  res.status(err.status || 500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST // This is just for display, not required

app.listen(PORT, '0.0.0.0', () => { // 0.0.0.0 means accept from any IP
    console.log(`Server running at port ${PORT}`)
    console.log(`Local: http://localhost:${PORT}`)
    console.log(`Network: Access from your current WiFi IP`)
    if (HOST) {
        console.log(`Configured Host: http://${HOST}:${PORT}`)
    }
})