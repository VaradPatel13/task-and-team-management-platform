import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ListTodo } from 'lucide-react';
import { useGetTasksQuery } from '@/store/tasksApi';
import { useDebounce } from '@/hooks/useDebounce';
import { TaskRow } from '@/components/tasks/TaskRow';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { Pagination } from '@/components/tasks/Pagination';
import { TaskListSkeleton } from '@/components/tasks/TaskListSkeleton';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Button } from '@/components/ui/button';

export function TasksPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError } = useGetTasksQuery({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    status: status || undefined,
    priority: priority || undefined,
    sort,
  });

  const tasks = useMemo(() => data?.data?.tasks || [], [data]);
  const totalPages = data?.data?.pages || 1;
  const totalItems = data?.data?.total || 0;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const nextPage = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(p - 1, 1));
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatus(value);
    setPage(1);
  }, []);

  const handlePriorityChange = useCallback((value: string) => {
    setPriority(value);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSort(value);
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setSearch('');
    setStatus('');
    setPriority('');
    setSort('-createdAt');
    setPage(1);
  }, []);

  if (isLoading) {
    return <TaskListSkeleton />;
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load tasks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Link to="/tasks/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </Link>
      </div>

      <TaskFilters
        search={search}
        status={status}
        priority={priority}
        sort={sort}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onSortChange={handleSortChange}
        onReset={handleReset}
      />

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description={search || status || priority ? 'Try adjusting your filters.' : 'Create your first task to get started.'}
          icon={<ListTodo className="h-8 w-8 text-muted-foreground" />}
          action={
            !search && !status && !priority ? (
              <Link to="/tasks/new">
                <Button>Create Task</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {totalItems} task{totalItems !== 1 ? 's' : ''} found
          </p>

          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskRow key={task._id} task={task} />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            hasPrevPage={hasPrevPage}
            hasNextPage={hasNextPage}
            onPrevPage={prevPage}
            onNextPage={nextPage}
          />
        </>
      )}
    </div>
  );
}

export default TasksPage;
