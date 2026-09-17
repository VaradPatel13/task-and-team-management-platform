export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/',
  TASKS: '/tasks',
  TASK_CREATE: '/tasks/new',
  TASK_DETAIL: '/tasks/:id',
  TASK_EDIT: '/tasks/:id/edit',
} as const;

export const TASK_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
] as const;

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
] as const;

export const TASK_SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: '+createdAt', label: 'Oldest First' },
  { value: '-dueDate', label: 'Due Date (Latest)' },
  { value: '+dueDate', label: 'Due Date (Earliest)' },
  { value: '-priority', label: 'Priority (High to Low)' },
  { value: '+priority', label: 'Priority (Low to High)' },
] as const;

export const statusConfig = {
  pending: { label: 'Pending', variant: 'warning' as const },
  'in-progress': { label: 'In Progress', variant: 'info' as const },
  completed: { label: 'Completed', variant: 'success' as const },
};

export const priorityConfig = {
  low: { label: 'Low', variant: 'secondary' as const },
  medium: { label: 'Medium', variant: 'warning' as const },
  high: { label: 'High', variant: 'destructive' as const },
};
