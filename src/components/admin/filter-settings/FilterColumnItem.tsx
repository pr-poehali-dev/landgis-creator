import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface FilterColumn {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
  options: string[];
  defaultValues: string[];
  attributePath: string;
}

interface FilterColumnItemProps {
  column: FilterColumn;
  isDragging: boolean;
  onDragStart: (columnId: string) => void;
  onDragOver: (e: React.DragEvent, columnId: string) => void;
  onDragEnd: () => void;
  onToggle: (columnId: string) => void;
  onEdit: (column: FilterColumn) => void;
  onDelete: (columnId: string) => void;
}

const FilterColumnItem = ({
  column,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
  onToggle,
  onEdit,
  onDelete
}: FilterColumnItemProps) => {
  const isStandardColumn = ['region', 'segment', 'status', 'type'].includes(column.id);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(column.id)}
      onDragOver={(e) => onDragOver(e, column.id)}
      onDragEnd={onDragEnd}
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border border-border bg-card cursor-move transition-all hover:border-primary",
        isDragging && "opacity-50"
      )}
    >
      <Icon name="GripVertical" size={20} className="text-muted-foreground shrink-0" />
      
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Badge variant="outline" className="shrink-0">
          {column.order}
        </Badge>
        <div className="font-medium truncate">{column.label}</div>
        <Badge variant="secondary" className="text-xs shrink-0">
          {column.options.length} {column.options.length === 1 ? 'опция' : 'опций'}
        </Badge>
        {column.defaultValues.length > 0 && (
          <Badge variant="default" className="text-xs shrink-0">
            По умолчанию: {column.defaultValues.length}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Switch
          checked={column.enabled}
          onCheckedChange={() => onToggle(column.id)}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(column)}
        >
          <Icon name="Settings" size={14} className="mr-1" />
          Настроить
        </Button>
        {!isStandardColumn && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(column.id)}
            className="text-destructive hover:text-destructive"
          >
            <Icon name="Trash2" size={14} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterColumnItem;
