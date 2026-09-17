import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Button } from '@/components/ui/button';

export function TaskCreatePage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link to="/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create Task</h1>
      </div>
      <TaskForm mode="create" />
    </div>
  );
}

export default TaskCreatePage;
