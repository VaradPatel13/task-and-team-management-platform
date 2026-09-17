import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGetTaskQuery } from '@/store/tasksApi';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function TaskEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useGetTaskQuery(id!);

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

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link to={`/tasks/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Task</h1>
      </div>
      <TaskForm mode="edit" initialData={data.data.task} />
    </div>
  );
}

export default TaskEditPage;
