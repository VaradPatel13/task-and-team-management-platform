import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useCreateTaskMutation, useUpdateTaskMutation, useGetUsersQuery } from '@/store/tasksApi';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/toast';
import { createTaskSchema, updateTaskSchema, type CreateTaskFormData } from '@/utils/validation';
import { TASK_STATUSES, TASK_PRIORITIES } from '@/utils/constants';
import { extractApiError } from '@/utils/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Task } from '@/types';

interface TaskFormProps {
  mode: 'create' | 'edit';
  initialData?: Task;
}

export function TaskForm({ mode, initialData }: TaskFormProps) {
  const navigate = useNavigate();
  const { toasts, removeToast, success, error: showError } = useToast();
  const { data: usersData } = useGetUsersQuery();

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(mode === 'create' ? createTaskSchema : updateTaskSchema) as never,
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      priority: initialData?.priority || 'medium',
      dueDate: initialData?.dueDate
        ? new Date(initialData.dueDate).toISOString().split('T')[0]
        : '',
      status: initialData?.status || 'pending',
      assignedTo: initialData?.assignedTo?._id || '',
    },
  });

  useEffect(() => {
    if (mode === 'create' && initialData) {
      navigate(`/tasks/${initialData._id}`);
    }
  }, [mode, initialData, navigate]);

  const onSubmit = async (data: CreateTaskFormData) => {
    try {
      if (mode === 'create') {
        await createTask({
          title: data.title,
          description: data.description || undefined,
          priority: data.priority,
          dueDate: data.dueDate,
          status: data.status,
          assignedTo: data.assignedTo,
        }).unwrap();
        success('Task created successfully');
        navigate('/tasks');
      } else if (initialData) {
        await updateTask({
          id: initialData._id,
          data: {
            title: data.title,
            description: data.description || undefined,
            priority: data.priority,
            dueDate: data.dueDate,
            status: data.status,
            assignedTo: data.assignedTo,
          },
        }).unwrap();
        success('Task updated successfully');
        navigate(`/tasks/${initialData._id}`);
      }
    } catch (err) {
      const apiError = extractApiError(err);
      if (apiError.errors) {
        apiError.errors.forEach((e) => {
          setError(e.field as keyof CreateTaskFormData, {
            message: e.message,
          });
        });
      } else {
        showError(apiError.message);
      }
    }
  };

  const users = usersData?.data?.users || [];
  const userOptions = users.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }));

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'create' ? 'Create Task' : 'Edit Task'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              error={errors.title?.message}
              {...register('title')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Enter task description (optional)"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              {...register('description')}
            />
            {errors.description?.message && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                id="priority"
                options={[...TASK_PRIORITIES]}
                error={errors.priority?.message}
                {...register('priority')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                options={[...TASK_STATUSES]}
                error={errors.status?.message}
                {...register('status')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                error={errors.dueDate?.message}
                {...register('dueDate')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assign To</Label>
              <Select
                id="assignedTo"
                options={userOptions}
                placeholder="Select a user"
                error={errors.assignedTo?.message}
                {...register('assignedTo')}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {mode === 'create' ? 'Create Task' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>
    </form>
    <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
