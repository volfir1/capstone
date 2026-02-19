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
import notificationRoutes from './routes/notificationRoutes.js'
import activityLogRoutes from './routes/activityLogRoutes.js'
import googleRoutes from './routes/googleRoutes.js'
import User from './models/user.js'
import Case from './models/case.js'
import Notification from './models/notification.js'
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

    // Return file information with relative path (will be proxied by Vite in dev)
    const fileUrl = `/uploads/documents/${req.file.filename}`;
    
    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl,
        path: fileUrl
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

// Resolve uploaded filename to an existing file if possible
app.get('/api/uploads/resolve', (req, res) => {
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

// Return eligible assignees (by role) for case assignment
app.get('/api/users/eligibleAssignees', async (req, res) => {
  try {
    // roles query: comma-separated roles. Default to common reviewer roles
    const rolesQ = req.query.roles || 'supervising_lawyer,director,intern,attorney,secretary';
    const roles = rolesQ.split(',').map(r => r.trim()).filter(Boolean);

    const users = await User.find({ role: { $in: roles } }).select('firstName lastName email role firebaseUid').lean();
    return res.json(users);
  } catch (err) {
    console.error('eligibleAssignees error', err);
    res.status(500).json({ error: 'Could not fetch users' });
  }
});

// Assign a case to a specific user (by user id). Saves assignment on Case and creates a notification.
app.post('/api/cases/:caseId/assign', async (req, res) => {
  try {
    const caseId = req.params.caseId;
    const { assigneeId, message } = req.body;
    if (!assigneeId) return res.status(400).json({ error: 'assigneeId required' });

    console.log('Assign request body:', { assigneeId, message });

    // Try to find user by Mongo _id first, then by firebaseUid or email
    let user = null;
    try {
      user = await User.findById(assigneeId).lean();
    } catch (e) {
      // ignore cast errors for non-objectId values
    }

    if (!user) {
      user = await User.findOne({ $or: [{ firebaseUid: assigneeId }, { email: assigneeId }] }).lean();
    }

    if (!user) {
      console.warn('Assignee not found for id:', assigneeId);
      return res.status(404).json({ error: 'Assignee not found' });
    }
    console.log('Found assignee:', { id: user._id.toString(), email: user.email, firebaseUid: user.firebaseUid });

    const assignedTo = {
      id: user._id.toString(),
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email,
      email: user.email || null,
      role: user.role || null,
    };

    // Try to determine assigner (who performed the assignment) via Firebase token
    let assignedBy = null;
    try {
      const authHeader = req.headers.authorization || '';
      if (authHeader.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        const decoded = await admin.auth().verifyIdToken(idToken);
        // Find corresponding user in DB
        const assigner = await User.findOne({ firebaseUid: decoded.uid }).lean();
        if (assigner) {
          assignedBy = {
            id: assigner._id.toString(),
            name: `${assigner.firstName || ''} ${assigner.lastName || ''}`.trim() || assigner.username || assigner.email,
            email: assigner.email || null,
            role: assigner.role || null,
          };
        } else {
          assignedBy = { id: decoded.uid, name: decoded.name || decoded.email || 'Staff', email: decoded.email || null };
        }
      }
    } catch (err) {
      console.warn('Could not verify assigner token', err);
    }

    const assignPayload = { assignedTo };
    if (assignedBy) assignPayload.assignedBy = assignedBy;
    if (message) assignPayload.assignedNote = message;
    assignPayload.assignedAt = new Date();

    let updated;
    try {
      console.log('Updating case:', caseId, 'with payload keys:', Object.keys(assignPayload));
      updated = await Case.findByIdAndUpdate(caseId, { $set: assignPayload }, { new: true, upsert: false }).lean();

      // If direct update failed, attempt to resolve the id as a Finalize reference
      if (!updated) {
        console.warn('Direct case lookup failed for id:', caseId, ' — attempting Finalize resolution');
        try {
          const finalizeMod = await import('./models/finalize.js').then(m => m.default);
          // Try by finalize _id first
          let fin = null;
          try {
            fin = await finalizeMod.findById(caseId).lean();
          } catch (e) {
            // ignore cast errors
          }

          // If not found by _id, try by finalize.caseId string
          if (!fin) {
            fin = await finalizeMod.findOne({ caseId: caseId }).lean();
          }

          if (fin) {
            console.log('Found finalize doc while resolving:', { id: fin._id.toString(), caseId: fin.caseId, linkedCaseId: fin.linkedCaseId });
            if (fin.linkedCaseId) {
              console.log('Resolved finalize -> linkedCaseId:', fin.linkedCaseId);
              updated = await Case.findByIdAndUpdate(fin.linkedCaseId, { $set: assignPayload }, { new: true, upsert: false }).lean();
            }

            // If still not resolved, try using finalize.caseId as a possible Case._id
            if (!updated && fin.caseId && typeof fin.caseId === 'string') {
              // If caseId looks like an ObjectId (24 hex chars), try findById
              const possible = fin.caseId;
              if (/^[a-fA-F0-9]{24}$/.test(possible)) {
                try {
                  console.log('Attempting to resolve finalize.caseId as Case._id:', possible);
                  updated = await Case.findByIdAndUpdate(possible, { $set: assignPayload }, { new: true, upsert: false }).lean();
                } catch (e) {
                  console.warn('Error trying finalize.caseId as ObjectId:', e.message);
                }
              }

              // If still not updated, try matching Case.caseNumber
              if (!updated) {
                try {
                  console.log('Attempting to resolve finalize.caseId as Case.caseNumber:', possible);
                  updated = await Case.findOneAndUpdate({ caseNumber: possible }, { $set: assignPayload }, { new: true, upsert: false }).lean();
                } catch (e) {
                  console.warn('Error trying finalize.caseId as caseNumber:', e.message);
                }
              }
            }
          } else {
            console.warn('No finalize document found for:', caseId);
          }
        } catch (finErr) {
          console.error('Error resolving finalize for case assign:', finErr);
        }
      }

      if (!updated) {
        console.warn('Case not found for id after resolution attempts:', caseId);

        // Try updating the Finalize document directly if it exists (assign to finalize record)
        try {
          const finalizeMod = await import('./models/finalize.js').then(m => m.default);
          let finDoc = null;
          try {
            finDoc = await finalizeMod.findById(caseId).lean();
          } catch (e) {}
          if (!finDoc) {
            finDoc = await finalizeMod.findOne({ caseId: caseId }).lean();
          }

          if (finDoc) {
            console.log('Updating finalize document directly with assignedTo for finalize id:', finDoc._id.toString());
            await finalizeMod.findByIdAndUpdate(finDoc._id, { $set: { assignedTo, assignedBy: assignPayload.assignedBy, assignedNote: assignPayload.assignedNote, assignedAt: assignPayload.assignedAt } });
            try {
              const saved = await finalizeMod.findById(finDoc._id).lean();
              console.log('Saved finalize.assignedTo shape:', JSON.stringify(saved.assignedTo));
            } catch (logErr) {
              console.warn('Could not fetch saved finalize for logging', logErr);
            }
            return res.json({ success: true, finalizeAssigned: true, finalizeId: finDoc._id.toString(), assignedTo });
          }
        } catch (finErr) {
          console.error('Error updating finalize directly during assign:', finErr);
        }

        return res.status(404).json({ error: 'Case not found' });
      }

      console.log('Case update result id:', updated._id ? updated._id.toString() : 'no-id');
    } catch (updateErr) {
      console.error('Error updating case:', updateErr);
      return res.status(500).json({ error: 'Failed to update case', details: updateErr.message });
    }

    // Create a notification for the assignee (recipientId expects firebase UID if available)
    try {
      const recipientId = user.firebaseUid || user.uid || user._id.toString();
      const notif = new Notification({
        recipientId,
        title: 'Case Assigned',
        message: `You have been assigned to case ${caseId}`,
        type: 'case_assigned',
        referenceId: caseId,
      });
      await notif.save();
    } catch (nErr) {
      console.error('Failed to create assignment notification', nErr);
    }

    // Also update any existing reviews for this case to include assignedTo
    try {
      await import('./models/review.js').then(mod => {
        const ReviewModel = mod.default;
        ReviewModel.updateMany({ caseId }, { $set: { assignedTo } }).catch(e => console.warn('Failed to update reviews with assignedTo', e));
      });
    } catch (e) {
      console.warn('Could not update reviews with assignedTo', e);
    }

    // Also update Finalize documents that reference this case (linkedCaseId or caseId)
    try {
      await import('./models/finalize.js').then(mod => {
        const FinalizeModel = mod.default;
        const finalizeUpdate = { $set: { assignedTo } };
        if (assignedBy) finalizeUpdate.$set.assignedBy = assignedBy;
        if (message) finalizeUpdate.$set.assignedNote = message;
        finalizeUpdate.$set.assignedAt = new Date();

        // Update by linkedCaseId (objectId) OR by caseId string
        FinalizeModel.updateMany({ $or: [{ linkedCaseId: updated._id }, { caseId: caseId }] }, finalizeUpdate).catch(e => console.warn('Failed to update finalize with assignedTo', e));
      });
    } catch (e) {
      console.warn('Could not update finalize documents with assignedTo', e);
    }

    console.log('Case assigned successfully:', { caseId: updated._id.toString(), assignedTo });
    return res.json({ success: true, case: updated, assignedTo });
  } catch (err) {
    console.error('case assign error', err);
    res.status(500).json({ error: 'Could not assign case' });
  }
});

// Mark assigned case as completed by assignee
app.post('/api/cases/:caseId/complete', async (req, res) => {
  try {
    const caseId = req.params.caseId;

    // Determine the user performing this action via Firebase token
    let completedBy = null;
    try {
      const authHeader = req.headers.authorization || '';
      if (authHeader.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        const decoded = await admin.auth().verifyIdToken(idToken);
        const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
        if (user) {
          completedBy = { id: user._id.toString(), name: `${user.firstName || ''} ${user.lastName || ''}`.trim(), email: user.email, role: user.role };
        } else {
          completedBy = { id: decoded.uid, name: decoded.name || decoded.email, email: decoded.email };
        }
      }
    } catch (err) {
      console.warn('Could not verify completion user token', err);
    }

    const updatePayload = { assignedCompleted: true, assignedCompletedAt: new Date() };
    if (completedBy) updatePayload.assignedCompletedBy = completedBy;

    const updated = await Case.findByIdAndUpdate(caseId, { $set: updatePayload }, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Case not found' });

    // update Finalize documents too
    try {
      await import('./models/finalize.js').then(mod => {
        const FinalizeModel = mod.default;
        const fUpdate = { $set: { assignedCompleted: true, assignedCompletedAt: new Date() } };
        if (completedBy) fUpdate.$set.assignedCompletedBy = completedBy;
        FinalizeModel.updateMany({ $or: [{ linkedCaseId: updated._id }, { caseId: caseId }] }, fUpdate).catch(e => console.warn('Failed to update finalize with completion', e));
      });
    } catch (e) {
      console.warn('Could not update finalize documents with completion', e);
    }

    return res.json({ success: true, case: updated });
  } catch (err) {
    console.error('case complete error', err);
    res.status(500).json({ error: 'Could not mark case complete' });
  }
});

// Return finalize documents assigned to the authenticated user
app.get('/api/finalize/assigned', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const uidStr = user._id.toString();
    const firebaseUid = user.firebaseUid || null;
    const email = user.email || null;

    // Support different shapes for assignedTo: object with id/_id/email, or plain string
    const assigned = await import('./models/finalize.js').then(mod => {
      const FinalizeModel = mod.default;
      return FinalizeModel.find({
        $or: [
          // top-level assignedTo object or string
          { 'assignedTo.id': uidStr },
          { 'assignedTo._id': uidStr },
          { assignedTo: uidStr },
          ...(email ? [{ 'assignedTo.email': email }, { assignedTo: email }] : []),
          ...(firebaseUid ? [{ 'assignedTo.id': firebaseUid }, { 'assignedTo._id': firebaseUid }, { assignedTo: firebaseUid }] : []),

          // assigned stored inside content (various shapes)
          { 'content.interviewInfo.assignedTo.id': uidStr },
          { 'content.interviewInfo.assignedTo._id': uidStr },
          { 'content.interviewInfo.assignedTo': uidStr },
          { 'content.caseInfo.assignedTo.id': uidStr },
          { 'content.caseInfo.assignedTo._id': uidStr },
          { 'content.caseInfo.assignedTo': uidStr },
          ...(email ? [{ 'content.interviewInfo.assignedTo.email': email }, { 'content.caseInfo.assignedTo.email': email }] : []),
        ]
      }).lean();
    });

    console.log('fetch /api/finalize/assigned for', { uidStr, firebaseUid, email, found: Array.isArray(assigned) ? assigned.length : 0 });
    if (Array.isArray(assigned) && assigned.length > 0) {
      console.log('assigned ids:', assigned.map(a => a._id ? a._id.toString() : a.id || 'no-id'));
      // log sample assignedTo shapes to debug
      assigned.slice(0, 5).forEach((a) => {
        console.log('sample assignedTo for', a._id ? a._id.toString() : a.id || 'no-id', JSON.stringify({ assignedTo: a.assignedTo, contentAssignedTo: a.content?.interviewInfo?.assignedTo || a.content?.caseInfo?.assignedTo || null }));
      });
    }

    return res.json({ success: true, data: assigned });
  } catch (err) {
    console.error('fetch assigned finalizes error', err);
    return res.status(500).json({ error: 'Could not fetch assigned finalizes' });
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
app.use('/api/notifications', notificationRoutes)
app.use('/api/activity-logs', activityLogRoutes)
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