import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { statusConfig, priorityConfig } from '@/utils/constants';
import type { Task } from '@/types';

interface TaskRowProps {
  task: Task;
}

export const TaskRow = memo(function TaskRow({ task }: TaskRowProps) {
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];

  return (
    <Link
      to={`/tasks/${task._id}`}
      className="block rounded-lg border p-4 hover:bg-accent/50 transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium truncate">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {task.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Badge variant={status.variant}>{status.label}</Badge>
          <Badge variant={priority.variant}>{priority.label}</Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          <span className="hidden sm:inline">
            {task.assignedTo.name}
          </span>
        </div>
      </div>
    </Link>
  );
});
