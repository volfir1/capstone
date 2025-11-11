// utils/caseStatusSteps.js

export const CASE_STATUS_STEPS = [
  {
    id: 'pending',
    label: 'Pending Review',
    description: 'Your case has been submitted and is awaiting initial review by our team.',
  },
  {
    id: 'in_review',
    label: 'Under Review',
    description: 'Our team is reviewing your case details and determining the best course of action.',
  },
  {
    id: 'attorney_assigned',
    label: 'Attorney Assigned',
    description: 'An attorney has been assigned to your case and will contact you soon.',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    description: 'Your attorney is actively working on your case and gathering necessary information.',
  },
  {
    id: 'completed',
    label: 'Completed',
    description: 'Your case has been successfully resolved or closed.',
  },
];

export const REJECTED_STATUS = {
  id: 'rejected',
  label: 'Rejected',
  description: 'Your case submission did not meet the requirements or fell outside our scope of services.',
};

// Helper function to get status step by id
export const getStatusStepById = (id) => {
  if (id === 'rejected') return REJECTED_STATUS;
  return CASE_STATUS_STEPS.find(step => step.id === id);
};

// Helper function to get status label
export const getStatusLabel = (id) => {
  const step = getStatusStepById(id);
  return step ? step.label : 'Unknown';
};

// Helper function to check if status is final
export const isFinalStatus = (id) => {
  return id === 'completed' || id === 'rejected';
};