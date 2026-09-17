import { memo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TASK_STATUSES, TASK_PRIORITIES, TASK_SORT_OPTIONS } from '@/utils/constants';

interface TaskFiltersProps {
  search: string;
  status: string;
  priority: string;
  sort: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onReset: () => void;
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  ...TASK_STATUSES,
];

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  ...TASK_PRIORITIES,
];

const sortOptions = [
  { value: '-createdAt', label: 'Newest First' },
  ...TASK_SORT_OPTIONS.filter((o) => o.value !== '-createdAt'),
];

export const TaskFilters = memo(function TaskFilters({
  search,
  status,
  priority,
  sort,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onSortChange,
  onReset,
}: TaskFiltersProps) {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value),
    [onSearchChange]
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => onStatusChange(e.target.value),
    [onStatusChange]
  );

  const handlePriorityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => onPriorityChange(e.target.value),
    [onPriorityChange]
  );

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => onSortChange(e.target.value),
    [onSortChange]
  );

  const hasFilters = search || status || priority || sort !== '-createdAt';

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title..."
          value={search}
          onChange={handleSearchChange}
          className="pl-9"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          options={statusOptions}
          value={status}
          onChange={handleStatusChange}
        />
        <Select
          options={priorityOptions}
          value={priority}
          onChange={handlePriorityChange}
        />
        <Select
          options={sortOptions}
          value={sort}
          onChange={handleSortChange}
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
});
