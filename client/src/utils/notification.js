import { notifications } from '@mantine/notifications';

// ============================================================
// Centralized Mantine Notification Utility
// Clean, aesthetic — top-center, slow fade-in
// ============================================================

const base = {
  radius: 'md',
  withBorder: true,
  styles: {
    root: {
      boxShadow: '0 6px 20px rgba(0,0,0,0.09)',
      padding: '11px 16px',
      backdropFilter: 'blur(6px)',
      minHeight: 'unset',
    },
    title: { fontWeight: 700, fontSize: '13.5px', letterSpacing: '-0.01em', lineHeight: 1.3 },
    description: { fontSize: '12.5px', opacity: 0.78, marginTop: 2, lineHeight: 1.4 },
    icon: { width: 20, height: 20, marginRight: 8 },
    closeButton: { width: 20, height: 20 },
  },
};

// --- Generic helpers ---
export const showSuccess = (title, message) =>
  notifications.show({ ...base, title, message, color: 'green', autoClose: 4000 });

export const showError = (title, message) =>
  notifications.show({ ...base, title, message, color: 'red', autoClose: 5000 });

export const showWarning = (title, message) =>
  notifications.show({ ...base, title, message, color: 'yellow', autoClose: 5000 });

export const showInfo = (title, message) =>
  notifications.show({ ...base, title, message, color: 'blue', autoClose: 4000 });

// --- Auth notifications ---
export const successNotif = () =>
  notifications.show({ ...base, id: 'auth-success', title: 'Login Success', message: 'You have been logged in successfully.', color: 'green', autoClose: 4000 });

export const failNotif = () =>
  notifications.show({ ...base, id: 'auth-fail', title: 'Login Failed', message: 'Invalid credentials. Please try again.', color: 'red', autoClose: 4000 });

export const verificationNotif = () =>
  notifications.show({ ...base, id: 'auth-verification', title: 'Email Not Verified', message: 'Please verify your email first.', color: 'yellow', autoClose: 4000 });

export const welcomeNotif = (firstName) =>
  notifications.show({ ...base, id: 'auth-welcome', title: 'Welcome Back', message: `Welcome back, ${firstName}!`, color: 'green', autoClose: 4000 });

export const pendingRoleNotif = () =>
  notifications.show({ ...base, id: 'auth-pending-role', title: 'Account Pending Approval', message: 'Please wait for admin to update your role.', color: 'yellow', autoClose: 4000 });

// --- Review / Submit notifications ---
export const reviewSavedNotif        = () => showSuccess('Review Saved',        'Interview and evidence data saved successfully.');
export const reviewSaveFailedNotif   = (msg) => showError('Save Failed',        msg || 'Failed to save review data.');
export const changesSavedNotif       = () => showSuccess('Changes Saved',       'Your changes have been saved successfully.');
export const changesSaveFailedNotif  = (msg) => showError('Save Failed',        msg || 'Failed to save changes.');
export const reviewResubmittedNotif  = () => showSuccess('Review Resubmitted', 'Review has been resubmitted for review.');
export const reviewResubmitFailedNotif = (msg) => showError('Resubmit Failed', msg || 'Failed to resubmit review.');

// --- Finalize notifications ---
export const caseFinalizedNotif        = () => showSuccess('Case Finalized',   'Case has been finalized and saved successfully.');
export const legalAdviceFinalizedNotif = () => showSuccess('Case Finalized',   'Legal advice case finalized successfully.');
export const finalizeFailedNotif       = (msg) => showError('Finalize Failed', msg || 'Failed to finalize case.');

// --- Status update notifications ---
export const statusUpdateFailedNotif  = () => showError('Status Update Failed', 'Failed to update case status. Please try again.');
export const statusUpdateHaltedNotif  = () => showError('Finalization Halted',  'Failed to update case status. Finalization halted. Please try again.');

// --- Return / Approve notifications ---
export const returnedToInternNotif         = () => showSuccess('Returned',        'Review has been returned to intern successfully.');
export const returnToInternFailedNotif     = (msg) => showError('Return Failed', msg || 'Failed to return review to intern.');
export const returnedToSupervisingNotif    = () => showSuccess('Returned',        'Review has been returned to supervising lawyer successfully.');
export const returnToSupervisingFailedNotif = (msg) => showError('Return Failed', msg || 'Failed to return review to supervising lawyer.');
export const approvedToDirectorNotif       = () => showSuccess('Approved',        'Review approved and sent to director successfully.');
export const approveToDirectorFailedNotif  = (msg) => showError('Approval Failed', msg || 'Failed to approve review.');

// --- Validation / Warning notifications ---
export const noReviewIdNotif       = () => showWarning('Missing Review',    'No review ID found. Cannot proceed.');
export const fileRequiredNotif     = () => showWarning('File Required',     'Please upload a Word document for legal document drafting cases.');
export const fileNotUploadedNotif  = () => showWarning('Upload Incomplete', 'File was not uploaded to server. Please try uploading again.');
export const fileUploadFailedNotif = () => showError('Upload Failed',       'Failed to upload document. Please try again.');