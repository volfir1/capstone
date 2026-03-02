/**
 * Sanitize error responses to prevent internal error details from leaking to clients.
 * In production, returns a generic message. In development, returns the actual error message.
 */
export const safeErrorMessage = (error, fallback = 'Internal server error') => {
  if (process.env.NODE_ENV === 'development') {
    return error?.message || fallback;
  }
  return fallback;
};
