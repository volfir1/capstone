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

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// CORS Configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(express.json({ limit: '10mb' })) // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cors(corsOptions))

// Public Routes (no auth required)
app.use("/api/ai-assistant", chatbotRoutes); // AI Chatbot - public access

// Test route to verify server is working
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working!" });
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

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
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