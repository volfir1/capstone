// ── Socket.IO instance holder ──
// This module exports a getter/setter so controllers can emit events
// without circular-import issues.

let io = null;

export const setIO = (socketIO) => {
  io = socketIO;
};

export const getIO = () => io;
