import { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { statusConfig, priorityConfig } from '@/utils/constants';
import type { Task } from '@/types';

interface TaskRowProps {
  task: Task;
  currentUserId?: string;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
}

export const TaskRow = memo(function TaskRow({ task, canDelete, onDelete }: TaskRowProps) {
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDelete?.(task._id);
    },
    [task._id, onDelete]
  );

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
          <p className="text-xs text-muted-foreground mt-1">
            Assigned by {task.createdBy?.name ?? 'Unknown'}
          </p>
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
          {canDelete && (
            <button
              onClick={handleDelete}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
});
