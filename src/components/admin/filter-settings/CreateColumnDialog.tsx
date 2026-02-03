import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface CreateColumnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  newColumn: Partial<FilterColumn>;
  onColumnChange: (column: Partial<FilterColumn>) => void;
  onCreate: () => void;
  availableAttributes: Array<{path: string; values: Set<string>}>;
}

const CreateColumnDialog = ({
  isOpen,
  onClose,
  newColumn,
  onColumnChange,
  onCreate,
  availableAttributes
}: CreateColumnDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Создание нового столбца фильтра</DialogTitle>
          <DialogDescription>
            Выберите атрибут из объектов и настройте фильтр
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Название столбца</Label>
            <Input
              value={newColumn.label || ''}
              onChange={(e) => onColumnChange({ ...newColumn, label: e.target.value })}
              placeholder="Например: Регион, Категория, Этаж"
            />
          </div>

          <div className="space-y-2">
            <Label>Атрибут из объектов</Label>
            <div className="grid gap-2 max-h-[300px] overflow-y-auto border border-border rounded-lg p-2">
              {availableAttributes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Загрузка атрибутов...
                </p>
              ) : (
                availableAttributes.map((attr) => (
                  <button
                    key={attr.path}
                    onClick={() => onColumnChange({ ...newColumn, attributePath: attr.path })}
                    className={cn(
                      "text-left p-3 rounded-lg border transition-all hover:border-primary",
                      newColumn.attributePath === attr.path 
                        ? "border-primary bg-primary/5" 
                        : "border-border"
                    )}
                  >
                    <div className="font-medium text-sm mb-1">{attr.path}</div>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(attr.values).slice(0, 5).map(val => (
                        <Badge key={val} variant="outline" className="text-xs">
                          {val}
                        </Badge>
                      ))}
                      {attr.values.size > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{attr.values.size - 5}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {attr.values.size} {attr.values.size === 1 ? 'значение' : 'значений'}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {newColumn.attributePath && (
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <Icon name="Info" size={16} className="text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                После создания вы сможете настроить порядок опций и значения по умолчанию
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button 
              onClick={onCreate}
              disabled={!newColumn.label || !newColumn.attributePath}
            >
              <Icon name="Plus" size={16} className="mr-2" />
              Создать
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateColumnDialog;
