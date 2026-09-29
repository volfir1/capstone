const atMidnight = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const parseDate = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
};

export const TASK_GROUPS = [
  { id: 'overdue', label: 'Overdue', color: '#D9485F' },
  { id: 'today', label: 'Today', color: '#2F9E65' },
  { id: 'this-week', label: 'This Week', color: '#3B82A6' },
  { id: 'next-week', label: 'Next Week', color: '#B66A24' },
  { id: 'upcoming', label: 'Upcoming', color: '#7757A6' },
  { id: 'pending', label: 'Pending', color: '#6B6B5A' },
  { id: 'completed', label: 'Completed', color: '#2F9E65' },
];

export const getTaskGroup = (task, today = new Date()) => {
  if (task.completed) return 'completed';
  const due = parseDate(task.dueDate);
  if (!due) return 'pending';

  const start = atMidnight(today);
  if (due < start) return 'overdue';
  if (due.getTime() === start.getTime()) return 'today';

  // Monday through Sunday, in the user's local timezone.
  const thisMonday = new Date(start);
  thisMonday.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(thisMonday.getDate() + 7);
  const followingMonday = new Date(nextMonday);
  followingMonday.setDate(nextMonday.getDate() + 7);

  if (due < nextMonday) return 'this-week';
  if (due < followingMonday) return 'next-week';
  return 'upcoming';
};

export const formatTaskDate = (value) => {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(date) : 'No deadline';
};

export const getCase = (caseId, cases) => cases.find((item) => item.id === caseId);
