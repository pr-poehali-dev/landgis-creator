import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { TableRow, TableCell } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { AttributeConfig } from '@/services/attributeConfigService';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AttributeSortableRowProps {
  config: AttributeConfig;
  index: number;
  handleToggleVisibility: (config: AttributeConfig) => void;
  handleTogglePopup: (config: AttributeConfig) => void;
  openEditDialog: (config: AttributeConfig) => void;
  handleDelete: (key: string) => void;
}

export const AttributeSortableRow = ({ 
  config, 
  index, 
  handleToggleVisibility, 
  handleTogglePopup,
  openEditDialog, 
  handleDelete 
}: AttributeSortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(config.id) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="hover:bg-muted/50"
    >
      <TableCell>
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <Icon name="GripVertical" size={16} className="text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="font-mono text-xs">{config.displayOrder}</TableCell>
      <TableCell className="font-mono text-sm">{config.attributeKey}</TableCell>
      <TableCell className="font-medium">{config.displayName}</TableCell>
      <TableCell>
        <div onMouseDown={(e) => e.stopPropagation()}>
          <Switch
            checked={config.visibleInTable}
            onCheckedChange={() => handleToggleVisibility(config)}
          />
        </div>
      </TableCell>
      <TableCell>
        <div onMouseDown={(e) => e.stopPropagation()}>
          <Switch
            checked={config.visibleInPopup}
            onCheckedChange={() => handleTogglePopup(config)}
          />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-1 flex-wrap">
          {config.visibleRoles.map(role => (
            <Badge key={role} variant="secondary" className="text-xs">
              {role}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2" onMouseDown={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => openEditDialog(config)}
          >
            <Icon name="Pencil" size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => handleDelete(config.attributeKey)}
          >
            <Icon name="Trash2" size={16} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};