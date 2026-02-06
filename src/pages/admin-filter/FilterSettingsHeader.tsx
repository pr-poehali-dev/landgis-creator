import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface FilterSettingsHeaderProps {
  isSaving: boolean;
  onReset: () => void;
  onCreate: () => void;
  onSave: () => void;
}

const FilterSettingsHeader = ({ isSaving, onReset, onCreate, onSave }: FilterSettingsHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold">Настройка фильтров</h2>
        <p className="text-sm text-muted-foreground">
          Управляйте отображением и порядком фильтров на карте
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onReset}>
          <Icon name="RotateCcw" size={16} className="mr-2" />
          Сбросить
        </Button>
        <Button variant="outline" size="sm" onClick={onCreate}>
          <Icon name="Plus" size={16} className="mr-2" />
          Создать столбец
        </Button>
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
          ) : (
            <Icon name="Save" size={16} className="mr-2" />
          )}
          Сохранить
        </Button>
      </div>
    </div>
  );
};

export default FilterSettingsHeader;
