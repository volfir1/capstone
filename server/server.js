import './config/env.js'; // MUST BE VERY FIRST - loads environment variables
import express from "express"
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
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
import notificationRoutes from './routes/notificationRoutes.js'
import activityLogRoutes from './routes/activityLogRoutes.js'
import googleRoutes from './routes/googleRoutes.js'
import caseAssignmentRoutes from './routes/caseAssignmentRoutes.js'
import cors from "cors"
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import admin from 'firebase-admin'
import upload from './config/multerConfig.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { v2 as cloudinary } from 'cloudinary'
import { getProfileRoom, setIO } from './socket.js'
import { authenticateFirebaseToken, requireProfilePin } from './firebase/authMiddleware.js'
import { ensureAccountForDecodedToken, ensureMultiProfileIndexes, resolveActiveProfileForAccount } from './utils/accountContext.js'

const hasCloudinaryUrl = Boolean(process.env.CLOUDINARY_URL);
const hasCloudinaryKeys = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);
const cloudinaryEnabled = hasCloudinaryUrl || hasCloudinaryKeys;

const isProduction = process.env.NODE_ENV === 'production';
const isLocalhostUrl = (value = '') =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(String(value || '').trim());
const resolveClientOrigin = () => {
  const prodClientUrl = String(process.env.CLIENT_URL || '').trim();
  const localClientUrl = String(process.env.CLIENT_URL_LOCAL || '').trim();

  if (isProduction) {
    return prodClientUrl || 'http://localhost:5173';
  }

  if (localClientUrl) {
    return localClientUrl;
  }

  if (isLocalhostUrl(prodClientUrl)) {
    return prodClientUrl;
  }

  return 'http://localhost:5173';
};

// Configure Cloudinary when credentials are available.
if (cloudinaryEnabled) {
  if (hasCloudinaryUrl) {
    cloudinary.config({ url: process.env.CLOUDINARY_URL });
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
} else {
  console.warn('Cloudinary is not configured. Uploads will continue using local disk storage.');
}

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
// Trust reverse proxy (Render, Vercel) so express-rate-limit and other
// middleware can correctly detect client IPs from X-Forwarded-For.
app.set('trust proxy', true);

// ── HTTP server + Socket.IO ──
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: resolveClientOrigin(),
    credentials: true,
  },
});
setIO(io);

// Track connected users by their Firebase UID for targeted events
// SECURITY: Verify Firebase token before allowing socket registration
io.on('connection', (socket) => {
  socket.on('register', async (payloadOrUid, legacyToken) => {
    try {
      const payload = typeof payloadOrUid === 'object' && payloadOrUid !== null
        ? payloadOrUid
        : { firebaseUid: payloadOrUid, token: legacyToken };
      const firebaseUid = String(payload?.firebaseUid || '').trim();
      const token = String(payload?.token || '').trim();
      const profileId = String(payload?.profileId || '').trim();

      // Require a valid Firebase ID token to prove identity
      if (!token) {
        socket.emit('auth-error', 'Token required');
        return;
      }
      const decoded = await admin.auth().verifyIdToken(token);
      if (decoded.uid !== firebaseUid) {
        socket.emit('auth-error', 'UID mismatch');
        return;
      }

      const account = await ensureAccountForDecodedToken(decoded);
      socket.join(firebaseUid); // join a room named after the uid
      socket.firebaseUid = firebaseUid; // store for reference

      if (socket.activeProfileRoom) {
        socket.leave(socket.activeProfileRoom);
        socket.activeProfileRoom = null;
        socket.activeProfileId = null;
      }

      if (profileId) {
        const activeProfile = await resolveActiveProfileForAccount(
          account._id,
          profileId,
          { allowFallback: false }
        );

        if (!activeProfile) {
          socket.emit('auth-error', 'Profile mismatch');
          return;
        }

        const profileRoom = getProfileRoom(activeProfile._id.toString());
        socket.join(profileRoom);
        socket.activeProfileRoom = profileRoom;
        socket.activeProfileId = activeProfile._id.toString();
      }
    } catch (err) {
      socket.emit('auth-error', 'Invalid token');
    }
  });
  socket.on('disconnect', () => {
    // rooms are auto-cleaned up by socket.io
  });
});

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

// CORS Configuration — allow both the web client and mobile app origins
const allowedOrigins = [
  resolveClientOrigin(),
];
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no Origin header (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In development, allow any origin (local network IPs, etc.)
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(express.json({ limit: '10mb' })) // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cors(corsOptions))

// Serve uploaded files.
// Allow unauthenticated access so mobile Linking.openURL (which opens an
// external browser with no auth header) can fetch documents.  The files are
// non-guessable filenames and also stored on Cloudinary,
// so the risk is minimal.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request timeout middleware - prevents hanging requests
// Skip for file upload routes which need more time
app.use((req, res, next) => {
  if (req.path.startsWith('/api/upload')) return next();

  const ms = 30000;
  req.setTimeout(ms);
  res.setTimeout(ms);

  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout' });
    }
  }, ms);

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

const deleteFromCloudinary = async (publicId, resourceTypeHint = 'auto') => {
  if (!cloudinaryEnabled || !publicId) return;

  const typesToTry = resourceTypeHint && resourceTypeHint !== 'auto'
    ? [resourceTypeHint]
    : ['image', 'video', 'raw'];

  for (const rt of typesToTry) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: rt,
        invalidate: true,
      });

      // `ok` means deleted, `not found` means nothing to delete for that type.
      if (result?.result === 'ok') {
        console.log(`Deleted Cloudinary asset ${publicId} (${rt})`);
        return;
      }
    } catch (err) {
      console.warn(`Cloudinary delete failed for ${publicId} (${rt}):`, err.message);
    }
  }
};

const deleteLocalTempFile = async (filePath) => {
  if (!filePath) return false;

  try {
    await fs.promises.unlink(filePath);
    console.log(`Deleted local temp upload: ${filePath}`);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    console.warn(`Failed to delete local temp upload ${filePath}:`, err.message);
    return false;
  }
};

// File upload route for documents/images/videos.
// Multer writes a temp local file first, then Cloudinary stores the persistent copy.
// Wrap multer in a manual call so multer errors get a proper JSON response
// instead of crashing the connection (which causes "Network Error" on mobile).
app.post('/api/upload/document', authenticateFirebaseToken, requireProfilePin, (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return file information with relative path (will be proxied by Vite in dev)
    // URI-encode the filename for use in URLs (spaces → %20, etc.)
    const encodedFilename = encodeURIComponent(req.file.filename);
    const fileUrl = `/uploads/documents/${encodedFilename}`;
    const localFilePath = req.file.path || path.join(__dirname, 'uploads/documents', req.file.filename);

    // Upload to Cloudinary for persistent storage when credentials are configured.
    let cloudinaryUrl = null;
    let cloudinaryPublicId = null;
    let cloudinaryResourceType = null;
    if (cloudinaryEnabled) {
      try {
        const publicId = req.file.filename.replace(/\.[^.]+$/, ''); // strip extension
        const uploadResult = await cloudinary.uploader.upload(localFilePath, {
          folder: 'capstone_documents',
          resource_type: 'auto', // supports docs, images, and videos
          public_id: publicId,
          overwrite: true,
        });
        // Use the secure_url returned directly by Cloudinary — it's always valid.
        // Access control is handled by Firebase auth at the API level.
        cloudinaryUrl = uploadResult.secure_url;
        cloudinaryPublicId = uploadResult.public_id || publicId;
        cloudinaryResourceType = uploadResult.resource_type || 'raw';
        await deleteLocalTempFile(localFilePath);
        console.log('Document uploaded to Cloudinary:', cloudinaryUrl);
      } catch (cloudErr) {
        console.warn('Cloudinary upload failed (file still available on disk):', cloudErr.message);
      }
    }

    const preferredUrl = cloudinaryUrl || fileUrl;

    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        displayName: req.file.originalname, // always the user-facing name
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: preferredUrl,
        path: preferredUrl,
        cloudinaryUrl, // persistent URL (null if Cloudinary upload failed)
        cloudinaryPublicId,
        cloudinaryResourceType,
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed', details: error.message });
  }
});

// File delete route for uploaded documents/images/videos
app.delete('/api/upload/document/:filename', authenticateFirebaseToken, requireProfilePin, async (req, res) => {
  try {
    const filename = path.basename(decodeURIComponent(req.params.filename)); // SECURITY: strip path traversal
    const filePath = path.join(__dirname, 'uploads/documents', filename);

    const cloudinaryPublicId = req.query.cloudinaryPublicId || filename.replace(/\.[^.]+$/, '');
    const cloudinaryResourceType = req.query.cloudinaryResourceType || 'auto';

    await deleteFromCloudinary(cloudinaryPublicId, cloudinaryResourceType);
    const localDeleted = await deleteLocalTempFile(filePath);

    res.json({
      success: true,
      message: localDeleted
        ? 'File deleted successfully'
        : 'Cloud asset delete requested; local temp file was already absent',
    });
  } catch (error) {
    console.error('File delete error:', error);
    res.status(500).json({ error: 'File deletion failed', details: error.message });
  }
});

// Resolve uploaded filename to an existing file if possible (auth-protected)
app.get('/api/uploads/resolve', authenticateFirebaseToken, requireProfilePin, (req, res) => {
  try {
    const q = req.query.path || req.query.filename || '';
    if (!q) return res.status(400).json({ error: 'path or filename query required' });

    const uploadsDir = path.join(__dirname, 'uploads', 'documents');
    if (!fs.existsSync(uploadsDir)) return res.status(500).json({ error: 'uploads directory missing' });

    const requested = decodeURIComponent(q).replace(/\\+/g, ' ');
    const reqBase = path.basename(requested).toLowerCase();
    const reqTokens = reqBase.replace(/[^a-z0-9]+/gi, ' ').split(/\s+/).filter(Boolean);

    const files = fs.readdirSync(uploadsDir);
    let best = null;
    let bestScore = 0;

    for (const f of files) {
      const lf = f.toLowerCase();
      if (path.extname(lf) !== path.extname(reqBase)) continue; // prefer same extension
      const tokens = lf.replace(/[^a-z0-9]+/gi, ' ').split(/\s+/).filter(Boolean);
      const common = tokens.filter(t => reqTokens.includes(t)).length;
      if (common > bestScore) {
        bestScore = common;
        best = f;
      }
    }

    if (best && bestScore > 0) {
      const url = `/uploads/documents/${best}`;
      return res.json({ found: true, url });
    }

    return res.status(404).json({ found: false });
  } catch (err) {
    console.error('Resolve uploads error', err);
    res.status(500).json({ error: 'resolve failed' });
  }
});

// eligibleAssignees endpoint removed — use /api/case-assignments/admin-staff instead

// Old assign/complete/assigned endpoints removed — replaced by /api/case-assignments routes

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
app.use('/api/notifications', notificationRoutes)
app.use('/api/activity-logs', activityLogRoutes)
app.use('/api/case-assignments', caseAssignmentRoutes)
// Google Calendar integration routes
app.use('/api/google', googleRoutes)

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
    ensureMultiProfileIndexes().catch((error) => {
      console.error('Failed to sync multi-profile indexes:', error);
    });
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

  // Handle multer errors
  if (err.name === 'MulterError' || err.message?.includes('Only Word documents')) {
    return res.status(400).json({
      error: 'File upload error',
      message: err.message
    });
  }

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

httpServer.listen(PORT, '0.0.0.0', () => { // 0.0.0.0 means accept from any IP
  console.log(`Server running at port ${PORT}`)
  console.log(`Local: http://localhost:${PORT}`)
  console.log(`Network: Access from your current WiFi IP`)
  if (HOST) {
    console.log(`Configured Host: http://${HOST}:${PORT}`)
  }
})
