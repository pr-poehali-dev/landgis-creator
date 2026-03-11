import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface FilterVisibilityHeaderProps {
  isSaving: boolean;
  onReset: () => void;
  onSave: () => void;
}

const FilterVisibilityHeader = ({ isSaving, onReset, onSave }: FilterVisibilityHeaderProps) => {
  return (
    <>
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Icon name="SlidersHorizontal" className="text-primary" size={32} />
            Видимость фильтров
          </h1>
          <p className="text-muted-foreground mt-1">
            Настройте, какие фильтры доступны для каждой роли и компании
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReset}>
            <Icon name="RotateCcw" size={16} className="mr-2" />
            Сбросить
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Save" size={16} className="mr-2" />
                Сохранить
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Icon name="Info" size={20} className="text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-400 mb-1">Как это работает</p>
              <p className="text-muted-foreground">
                Отмеченные галочкой фильтры <strong>видны</strong> для выбранной роли/компании.
                Снятие галочки <strong>скроет</strong> фильтр. Администратор всегда видит все фильтры.
                Настройки компании имеют приоритет над настройками роли.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default FilterVisibilityHeader;
