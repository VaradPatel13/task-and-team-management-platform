import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { useGetTasksQuery } from '@/store/tasksApi';
import { StatCard } from '@/components/dashboard/StatCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatusChart } from '@/components/charts/StatusChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DashboardPage() {
  const { data: allTasks, isLoading: isLoadingAll } = useGetTasksQuery({ page: 1, limit: 1 });
  const { data: pendingData, isLoading: isLoadingPending } = useGetTasksQuery({ page: 1, limit: 1, status: 'pending' });
  const { data: inProgressData, isLoading: isLoadingInProgress } = useGetTasksQuery({ page: 1, limit: 1, status: 'in-progress' });
  const { data: completedData, isLoading: isLoadingCompleted } = useGetTasksQuery({ page: 1, limit: 1, status: 'completed' });
  const { data: recentTasks } = useGetTasksQuery({ page: 1, limit: 5, sort: '-createdAt' });

  const isLoading = isLoadingAll || isLoadingPending || isLoadingInProgress || isLoadingCompleted;

  const stats = useMemo(() => ({
    total: allTasks?.data?.total ?? 0,
    pending: pendingData?.data?.total ?? 0,
    inProgress: inProgressData?.data?.total ?? 0,
    completed: completedData?.data?.total ?? 0,
  }), [allTasks, pendingData, inProgressData, completedData]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (stats.total === 0) {
    return (
      <EmptyState
        title="No tasks yet"
        description="Create your first task to get started."
        icon={<ClipboardList className="h-8 w-8 text-muted-foreground" />}
        action={
          <Link to="/tasks/new">
            <Button>Create Task</Button>
          </Link>
        }
      />
    );
  }

  const tasks = recentTasks?.data?.tasks ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tasks"
          value={stats.total}
          icon={ClipboardList}
          description="All tasks assigned to you"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          description="Awaiting action"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Loader2}
          description="Currently being worked on"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={ClipboardList}
          description="Finished tasks"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Task Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusChart pending={stats.pending} inProgress={stats.inProgress} completed={stats.completed} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Tasks</CardTitle>
          <Link
            to="/tasks"
            className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.status === 'pending' && 'Pending'}
                      {task.status === 'in-progress' && 'In Progress'}
                      {task.status === 'completed' && 'Completed'}
                      {' · '}
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} priority
                    </p>
                  </div>
                  <div className="ml-4 text-right text-sm text-muted-foreground shrink-0">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tasks found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardPage;
