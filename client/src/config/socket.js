import { io } from 'socket.io-client';
import { auth } from '@/firebase/firebase';

// ── Singleton Socket.IO client ──
// Connects to the same origin (proxied by Vite in dev, same host in prod).
// Auto-reconnects on disconnect.

let socket = null;
let registeredUid = null;

/**
 * Emit 'register' with UID + a fresh Firebase ID token for server verification.
 */
const emitRegister = async (s, uid) => {
  try {
    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    s.emit('register', uid, token);
  } catch (err) {
    console.warn('[Socket] Could not get token for register:', err.message);
  }
};

/**
 * Get or create the shared socket instance.
 * Call registerUser(firebaseUid) after auth is ready.
 */
export const getSocket = () => {
  if (!socket) {
    // In development, Vite proxy forwards /socket.io to the backend.
    // In production the client and server share the same origin.
    const url = import.meta.env.VITE_API_URL
      ? (() => {
          let raw = import.meta.env.VITE_API_URL.trim().replace(/\/$/, '');
          if (raw.startsWith(':')) raw = `http://127.0.0.1${raw}`;
          else if (!/^https?:\/\//i.test(raw)) raw = `http://${raw}`;
          // Remove /api suffix for socket connection
          return raw.replace(/\/api\/?$/, '');
        })()
      : undefined; // undefined → connect to window.location (same origin)

    socket = io(url, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      // Re-register the user's UID on every (re)connect so the server
      // always knows which room this socket belongs to.
      if (registeredUid) {
        emitRegister(socket, registeredUid);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });
  }
  return socket;
};

/**
 * Register the current user's Firebase UID so the server can target them.
 */
export const registerUser = (firebaseUid) => {
  registeredUid = firebaseUid || null;
  const s = getSocket();
  if (firebaseUid && s.connected) {
    emitRegister(s, firebaseUid);
  }
  // No need for s.once('connect') — the 'connect' handler in getSocket()
  // will emit 'register' automatically on every (re)connect.
};

/**
 * Disconnect socket (e.g. on logout).
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  registeredUid = null;
};
