import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import type { Task } from '@/types';
import { statusConfig, priorityConfig } from '@/utils/constants';

interface SortableTaskItemProps {
  task: Task;
}

function SortableTaskItem({ task }: SortableTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm transition-all',
        isDragging && 'opacity-50 shadow-md ring-2 ring-primary'
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{task.title}</p>
        <p className="text-sm text-muted-foreground truncate">
          {task.assignedTo?.name ?? 'Unassigned'} · Due {new Date(task.dueDate).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={status.variant}>{status.label}</Badge>
        <Badge variant={priority.variant}>{priority.label}</Badge>
      </div>
    </div>
  );
}

interface SortableTaskListProps {
  tasks: Task[];
  onReorder?: (tasks: Task[]) => void;
}

export function SortableTaskList({ tasks, onReorder }: SortableTaskListProps) {
  const [items, setItems] = useState(tasks);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((t) => t._id === active.id);
      const newIndex = prev.findIndex((t) => t._id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      onReorder?.(reordered);
      return reordered;
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((task) => (
            <SortableTaskItem key={task._id} task={task} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
