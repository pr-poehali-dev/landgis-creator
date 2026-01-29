import { CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface AdminTableHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedIds: Set<number>;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  isDeleting: boolean;
}

const AdminTableHeader = ({ 
  searchQuery, 
  onSearchChange, 
  selectedIds, 
  onDeleteSelected, 
  onClearSelection,
  isDeleting 
}: AdminTableHeaderProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <CardTitle>База данных объектов</CardTitle>
          <CardDescription>Полный список объектов недвижимости</CardDescription>
        </div>
        <div className="relative w-full sm:w-64">
          <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Поиск по ID, названию, адресу..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">
            Выбрано: {selectedIds.size} объектов
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteSelected}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Icon name="Loader2" className="animate-spin mr-2" size={14} />
                Удаление...
              </>
            ) : (
              <>
                <Icon name="Trash2" className="mr-2" size={14} />
                Удалить выбранные
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            Отменить
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminTableHeader;
