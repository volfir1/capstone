// ── Socket.IO instance holder ──
// This module exports a getter/setter so controllers can emit events
// without circular-import issues.

let io = null;

export const getProfileRoom = (profileId) => {
  const normalizedProfileId = String(profileId || '').trim();
  return normalizedProfileId ? `profile:${normalizedProfileId}` : '';
};

export const setIO = (socketIO) => {
  io = socketIO;
};

export const getIO = () => io;

export const emitToProfileRoom = (profileId, eventName, payload) => {
  const room = getProfileRoom(profileId);
  if (!io || !room || !eventName) return;
  io.to(room).emit(eventName, payload);
};
