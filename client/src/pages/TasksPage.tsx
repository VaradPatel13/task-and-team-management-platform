import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { PlusCircle, ListTodo, Copy, GripVertical } from 'lucide-react';
import { useGetTasksQuery, useDuplicateTaskMutation, useDeleteTaskMutation } from '@/store/tasksApi';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { TaskRow } from '@/components/tasks/TaskRow';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { Pagination } from '@/components/tasks/Pagination';
import { TaskListSkeleton } from '@/components/tasks/TaskListSkeleton';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { statusConfig, priorityConfig } from '@/utils/constants';
import { cn } from '@/utils/cn';
import type { Task } from '@/types';

function DraggableTaskRow({ task, currentUserId, onDelete }: { task: Task; currentUserId?: string; onDelete?: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
    data: task,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const canDelete = task.createdBy?._id === currentUserId;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('rounded-lg border bg-card transition-all', isDragging && 'opacity-40 scale-95')}
    >
      <div className="flex items-center gap-0">
        <button
          className="cursor-grab active:cursor-grabbing p-3 text-muted-foreground hover:text-foreground shrink-0 touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <TaskRow task={task} canDelete={canDelete} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}

function TaskOverlay({ task }: { task: Task }) {
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4 shadow-xl opacity-90 w-[500px]">
      <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{task.title}</p>
      </div>
      <Badge variant={status.variant}>{status.label}</Badge>
      <Badge variant={priority.variant}>{priority.label}</Badge>
    </div>
  );
}

function DuplicateDropZone({ isOver }: { isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id: 'duplicate-zone' });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition-all',
        isOver
          ? 'border-primary bg-primary/10 text-primary scale-[1.02]'
          : 'border-muted-foreground/25 text-muted-foreground'
      )}
    >
      <Copy className="h-5 w-5" />
      <span className="text-sm font-medium">
        {isOver ? 'Release to duplicate task' : 'Drag a task here to duplicate it'}
      </span>
    </div>
  );
}

export function TasksPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<'pagination' | 'infinite'>('pagination');
  const [allTasks, setAllTasks] = useState<unknown[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [duplicateTask] = useDuplicateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError } = useGetTasksQuery({
    page,
    limit: mode === 'infinite' ? 20 : 10,
    search: debouncedSearch || undefined,
    status: status || undefined,
    priority: priority || undefined,
    sort,
  });

  const tasks = useMemo(() => {
    const current = data?.data?.tasks || [];
    if (mode === 'infinite' && page > 1) {
      return [...allTasks, ...current] as typeof current;
    }
    return current;
  }, [data, mode, page, allTasks]);

  const totalPages = data?.data?.pages || 1;
  const totalItems = data?.data?.total || 0;
  const hasNextPage = page < totalPages;

  useEffect(() => {
    if (mode === 'infinite' && data?.data?.tasks) {
      setAllTasks((prev) => {
        if (page === 1) return data.data.tasks;
        const existing = prev as typeof data.data.tasks;
        const newIds = new Set(data.data.tasks.map((t) => t._id));
        const unique = existing.filter((t) => !newIds.has(t._id));
        return [...unique, ...data.data.tasks];
      });
    }
  }, [data, mode, page]);

  useEffect(() => {
    if (mode !== 'infinite' || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1 }
    );
    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [mode, hasNextPage]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const nextPage = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(p - 1, 1));
  }, []);

  const handlePageChange = useCallback((p: number) => {
    setPage(p);
    setAllTasks([]);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
    setAllTasks([]);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatus(value);
    setPage(1);
    setAllTasks([]);
  }, []);

  const handlePriorityChange = useCallback((value: string) => {
    setPriority(value);
    setPage(1);
    setAllTasks([]);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSort(value);
    setPage(1);
    setAllTasks([]);
  }, []);

  const handleReset = useCallback(() => {
    setSearch('');
    setStatus('');
    setPriority('');
    setSort('-createdAt');
    setPage(1);
    setAllTasks([]);
  }, []);

  const toggleMode = useCallback(() => {
    setMode((m) => m === 'pagination' ? 'infinite' : 'pagination');
    setPage(1);
    setAllTasks([]);
  }, []);

  const handleDelete = useCallback(async (taskId: string) => {
    try {
      await deleteTask(taskId).unwrap();
      success('Task deleted');
    } catch {
      showError('Failed to delete task');
    }
  }, [deleteTask, success, showError]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = event.active.data.current as Task;
    setActiveTask(task);
  }, []);

  const handleDragOver = useCallback((event: { over: { id: string | number } | null }) => {
    setOverId(event.over ? String(event.over.id) : null);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveTask(null);
    setOverId(null);

    if (event.over?.id === 'duplicate-zone' && event.active.data.current) {
      const task = event.active.data.current as Task;
      try {
        await duplicateTask(task._id).unwrap();
        success(`"${task.title}" duplicated`);
      } catch {
        showError('Failed to duplicate task');
      }
    }
  }, [duplicateTask, success, showError]);

  if (isLoading && page === 1) {
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
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleMode}>
              {mode === 'pagination' ? 'Infinite Scroll' : 'Pagination'}
            </Button>
            <Link to="/tasks/new">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </Link>
          </div>
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

            <DuplicateDropZone isOver={overId === 'duplicate-zone'} />

            <div className="space-y-3">
              {tasks.map((task) => (
                <DraggableTaskRow key={task._id} task={task} currentUserId={user?.id} onDelete={handleDelete} />
              ))}
            </div>

            {mode === 'infinite' && hasNextPage && (
              <div ref={loaderRef} className="flex justify-center py-4">
                <p className="text-sm text-muted-foreground">Loading more...</p>
              </div>
            )}

            {mode === 'pagination' && (
              <Pagination
                page={page}
                totalPages={totalPages}
                hasPrevPage={page > 1}
                hasNextPage={hasNextPage}
                onPrevPage={prevPage}
                onNextPage={nextPage}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>

      <DragOverlay>
        {activeTask ? <TaskOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

export default TasksPage;
