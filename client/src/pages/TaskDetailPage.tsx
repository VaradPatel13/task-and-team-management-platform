import { useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useGetTaskQuery, useDeleteTaskMutation } from '@/store/tasksApi';
import { useToast } from '@/hooks/useToast';
import { extractApiError } from '@/utils/errors';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ToastContainer } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/tasks/ConfirmDialog';
import { statusConfig, priorityConfig } from '@/utils/constants';

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toasts, removeToast, success, error: showError } = useToast();
  const { data, isLoading, isError } = useGetTaskQuery(id!);
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = useCallback(async () => {
    try {
      await deleteTask(id!).unwrap();
      success('Task deleted successfully');
      navigate('/tasks');
    } catch (err) {
      showError(extractApiError(err).message);
    }
  }, [deleteTask, id, success, showError, navigate]);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (isError || !data?.data?.task) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Task not found.</p>
        <Link to="/tasks">
          <Button variant="outline" className="mt-4">Back to tasks</Button>
        </Link>
      </div>
    );
  }

  const task = data.data.task;
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link to="/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex-1 truncate">{task.title}</h1>
        <div className="flex items-center gap-2 shrink-0">
          <Link to={`/tasks/${task._id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant={priority.variant}>{priority.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {task.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
              <p className="whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Due Date</h3>
              <p>{new Date(task.dueDate).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Assigned To</h3>
              <p>{task.assignedTo.name}</p>
              <p className="text-sm text-muted-foreground">{task.assignedTo.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Created By</h3>
              <p>{task.createdBy.name}</p>
              <p className="text-sm text-muted-foreground">{task.createdBy.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Created At</h3>
              <p>{new Date(task.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Task"
          message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          isLoading={isDeleting}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default TaskDetailPage;
