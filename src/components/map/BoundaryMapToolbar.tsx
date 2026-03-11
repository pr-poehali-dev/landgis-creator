import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface BoundaryMapToolbarProps {
  pointCount: number;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

const BoundaryMapToolbar = ({ pointCount, isSaving, onSave, onCancel }: BoundaryMapToolbarProps) => {
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1600] flex items-center gap-2 bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-lg px-4 py-2.5">
      <div className="flex items-center gap-2 mr-2">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-sm font-medium whitespace-nowrap">Редактирование границ</span>
        <Badge variant="secondary" className="text-xs">
          {pointCount} точек
        </Badge>
      </div>

      <div className="h-5 w-px bg-border" />

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="hidden sm:inline">Тяни точку · Клик на ребро = добавить · Двойной клик = удалить</span>
        <span className="sm:hidden">Тяни · Клик = + · 2× = −</span>
      </div>

      <div className="h-5 w-px bg-border" />

      <div className="flex gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={onCancel}
          disabled={isSaving}
        >
          <Icon name="X" size={14} />
          <span className="hidden sm:inline">Отмена</span>
        </Button>
        <Button
          size="sm"
          className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={onSave}
          disabled={isSaving || pointCount < 3}
        >
          {isSaving ? (
            <Icon name="Loader2" size={14} className="animate-spin" />
          ) : (
            <Icon name="Check" size={14} />
          )}
          <span className="hidden sm:inline">Сохранить</span>
        </Button>
      </div>
    </div>
  );
};

export default BoundaryMapToolbar;
