import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface EditColumnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  column: FilterColumn | null;
  onColumnChange: (column: FilterColumn) => void;
  onSave: () => void;
  onMoveOption: (index: number, direction: 'up' | 'down') => void;
  onToggleDefault: (value: string) => void;
  getOptionLabel: (columnId: string, value: string) => string;
}

const EditColumnDialog = ({
  isOpen,
  onClose,
  column,
  onColumnChange,
  onSave,
  onMoveOption,
  onToggleDefault,
  getOptionLabel
}: EditColumnDialogProps) => {
  if (!column) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Настройка столбца: {column.label}</DialogTitle>
          <DialogDescription>
            Измените порядок опций и установите значения по умолчанию
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Название столбца</Label>
            <Input
              value={column.label}
              onChange={(e) => onColumnChange({ ...column, label: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Путь к атрибуту</Label>
            <Input
              value={column.attributePath}
              onChange={(e) => onColumnChange({ ...column, attributePath: e.target.value })}
              placeholder="attributes.region"
            />
            <p className="text-xs text-muted-foreground">
              Укажите путь к атрибуту в объекте (напр. attributes.region, status, type)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Порядок опций</Label>
            <div className="border border-border rounded-lg divide-y divide-border max-h-[300px] overflow-y-auto">
              {column.options.map((option, index) => {
                const isDefault = column.defaultValues.includes(option);
                return (
                  <div
                    key={`${option}-${index}`}
                    className={cn(
                      "flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors",
                      isDefault && "bg-primary/5"
                    )}
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onMoveOption(index, 'up')}
                        disabled={index === 0}
                      >
                        <Icon name="ChevronUp" size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onMoveOption(index, 'down')}
                        disabled={index === column.options.length - 1}
                      >
                        <Icon name="ChevronDown" size={14} />
                      </Button>
                    </div>

                    <Badge variant="outline" className="shrink-0">
                      {index + 1}
                    </Badge>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{getOptionLabel(column.id, option)}</div>
                      <div className="text-xs text-muted-foreground truncate">{option}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label htmlFor={`default-${option}`} className="text-xs cursor-pointer">
                        По умолчанию
                      </Label>
                      <Switch
                        id={`default-${option}`}
                        checked={isDefault}
                        onCheckedChange={() => onToggleDefault(option)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={onSave}>
              <Icon name="Check" size={16} className="mr-2" />
              Применить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditColumnDialog;
