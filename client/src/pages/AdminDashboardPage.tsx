import { useGetAdminStatsQuery } from '@/store/adminApi';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusChart } from '@/components/charts/StatusChart';
import { PriorityChart } from '@/components/charts/PriorityChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Users, ListTodo, Clock, CheckCircle } from 'lucide-react';

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28" />
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useGetAdminStatsQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview</p>
        </div>
        <StatsSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load admin stats</p>
      </div>
    );
  }

  const stats = data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} />
        <StatCard title="Total Tasks" value={stats?.totalTasks ?? 0} icon={ListTodo} />
        <StatCard title="Pending" value={stats?.tasksByStatus.pending ?? 0} icon={Clock} />
        <StatCard title="Completed" value={stats?.tasksByStatus.completed ?? 0} icon={CheckCircle} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusChart
              pending={stats?.tasksByStatus.pending ?? 0}
              inProgress={stats?.tasksByStatus['in-progress'] ?? 0}
              completed={stats?.tasksByStatus.completed ?? 0}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <PriorityChart
              low={stats?.tasksByPriority.low ?? 0}
              medium={stats?.tasksByPriority.medium ?? 0}
              high={stats?.tasksByPriority.high ?? 0}
            />
          </CardContent>
        </Card>
      </div>

      {stats?.recentTasks && stats.recentTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentTasks.map((task) => (
                <div key={task._id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      by {task.createdBy?.name ?? 'Unknown'} → {task.assignedTo?.name ?? 'Unknown'}
                    </p>
                  </div>
                  <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                    {task.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
