// UI prototype fixtures. These are fictional records and never reach the API.
export const SAMPLE_CASES = [
  { id: 'sample-1', client: 'Sample Client A', title: 'Employment concern', type: 'Labor and Employment', caseNumber: 'DEMO-001', lawyer: 'Supervising Lawyer' },
  { id: 'sample-2', client: 'Sample Client B', title: 'Property document review', type: 'Land and Property Disputes', caseNumber: 'DEMO-002', lawyer: 'Director' },
  { id: 'sample-3', client: 'Sample Client C', title: 'Family consultation', type: 'Family Law', caseNumber: 'DEMO-003', lawyer: 'Supervising Lawyer' },
  { id: 'sample-4', client: 'Sample Client D', title: 'Contract clarification', type: 'Contract Disputes', caseNumber: 'DEMO-004', lawyer: 'Director' },
];

export const SAMPLE_ASSIGNEES = [
  { value: 'Alex Reyes (sample)', label: 'Alex Reyes (sample)' },
  { value: 'Jordan Cruz (sample)', label: 'Jordan Cruz (sample)' },
  { value: 'Sam Rivera (sample)', label: 'Sam Rivera (sample)' },
];

const dateOffset = (days) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const createPrototypeTasks = () => [
  {
    id: 'demo-task-1', caseId: 'sample-1', description: 'Prepare the intake summary and list documents needed for the consultation.',
    assignee: 'Alex Reyes (sample)', dueDate: dateOffset(-3), completed: false,
    subtasks: [
      { id: 'demo-sub-1', description: 'Review the appointment notes', completed: true, assignee: 'Alex Reyes (sample)', dueDate: dateOffset(-4) },
      { id: 'demo-sub-2', description: 'Draft the document checklist', completed: false, assignee: 'Jordan Cruz (sample)', dueDate: dateOffset(-1) },
    ],
  },
  { id: 'demo-task-2', caseId: 'sample-2', description: 'Review the submitted property documents and identify missing pages.', assignee: 'Jordan Cruz (sample)', dueDate: dateOffset(-1), completed: false, subtasks: [] },
  { id: 'demo-task-3', caseId: 'sample-3', description: 'Confirm the consultation agenda with the supervising lawyer.', assignee: 'Sam Rivera (sample)', dueDate: dateOffset(0), completed: false, subtasks: [] },
  { id: 'demo-task-4', caseId: 'sample-1', description: 'Draft questions for the follow-up interview.', assignee: 'Alex Reyes (sample)', dueDate: dateOffset(2), completed: false, subtasks: [] },
  { id: 'demo-task-5', caseId: 'sample-4', description: 'Summarize the contract clauses discussed during intake.', assignee: 'Jordan Cruz (sample)', dueDate: dateOffset(5), completed: false, subtasks: [] },
  { id: 'demo-task-6', caseId: 'sample-2', description: 'Prepare a short case update for the weekly review.', assignee: 'Sam Rivera (sample)', dueDate: dateOffset(8), completed: false, subtasks: [] },
  { id: 'demo-task-7', caseId: 'sample-3', description: 'Collect supporting documents before the next meeting.', assignee: '', dueDate: dateOffset(15), completed: false, subtasks: [] },
  { id: 'demo-task-8', caseId: 'sample-4', description: 'Record the client’s preferred contact time.', assignee: '', dueDate: '', completed: false, subtasks: [] },
  { id: 'demo-task-9', caseId: 'sample-1', description: 'Send the initial consultation summary for internal review.', assignee: 'Alex Reyes (sample)', dueDate: dateOffset(-2), completed: true, subtasks: [] },
];
