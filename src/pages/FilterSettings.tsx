import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import { filterSettingsService, FilterSetting } from '@/services/filterSettingsService';
import AdminNavigation from '@/components/admin/AdminNavigation';

const FilterSettings = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    setIsLoading(true);
    try {
      const data = await filterSettingsService.getFilters();
      setFilters(data);
    } catch (error) {
      console.error('Error loading filters:', error);
      toast.error('Не удалось загрузить настройки фильтров');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnabled = async (filter: FilterSetting) => {
    try {
      await filterSettingsService.upsertFilter({
        filterKey: filter.filter_key,
        filterLabel: filter.filter_label,
        filterType: filter.filter_type,
        options: filter.options,
        isEnabled: !filter.is_enabled,
        displayOrder: filter.display_order
      });
      setFilters(prev =>
        prev.map(f => f.id === filter.id ? { ...f, is_enabled: !f.is_enabled } : f)
      );
      toast.success('Настройка обновлена');
    } catch (error) {
      console.error('Error updating filter:', error);
      toast.error('Не удалось обновить настройку');
    }
  };

  const handleReorder = async () => {
    setIsSaving(true);
    try {
      for (let i = 0; i < filters.length; i++) {
        const filter = filters[i];
        await filterSettingsService.upsertFilter({
          filterKey: filter.filter_key,
          filterLabel: filter.filter_label,
          filterType: filter.filter_type,
          options: filter.options,
          isEnabled: filter.is_enabled,
          displayOrder: i + 1
        });
      }
      toast.success('Порядок сохранён');
    } catch (error) {
      console.error('Error reordering filters:', error);
      toast.error('Не удалось сохранить порядок');
    } finally {
      setIsSaving(false);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newFilters = [...filters];
    [newFilters[index - 1], newFilters[index]] = [newFilters[index], newFilters[index - 1]];
    setFilters(newFilters);
  };

  const moveDown = (index: number) => {
    if (index === filters.length - 1) return;
    const newFilters = [...filters];
    [newFilters[index], newFilters[index + 1]] = [newFilters[index + 1], newFilters[index]];
    setFilters(newFilters);
  };

  const getFilterTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      multiselect: 'Множественный выбор',
      range: 'Диапазон',
      text: 'Текст',
      boolean: 'Да/Нет'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icon name="Loader2" className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />

      <div className="container mx-auto px-4 lg:px-6 py-6">
        <div className="flex justify-end mb-4">
          <Button onClick={handleReorder} disabled={isSaving}>
            {isSaving ? (
              <>
                <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Save" size={16} className="mr-2" />
                Сохранить порядок
              </>
            )}
          </Button>
        </div>


        <Card>
          <CardHeader>
            <CardTitle>Активные фильтры</CardTitle>
            <CardDescription>Настройте какие фильтры доступны пользователям и их порядок</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filters.map((filter, index) => (
              <div
                key={filter.id}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                    >
                      <Icon name="ChevronUp" size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveDown(index)}
                      disabled={index === filters.length - 1}
                    >
                      <Icon name="ChevronDown" size={14} />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{filter.filter_label}</p>
                      <Badge variant="outline" className="text-xs">
                        {getFilterTypeLabel(filter.filter_type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">{filter.filter_key}</p>
                    {filter.options && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {JSON.stringify(filter.options)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={filter.is_enabled ? 'default' : 'secondary'}>
                    {filter.is_enabled ? 'Включен' : 'Выключен'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleEnabled(filter)}
                  >
                    <Icon name={filter.is_enabled ? 'EyeOff' : 'Eye'} size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Icon name="Info" className="text-primary mt-1" size={18} />
              <div>
                <p className="text-sm font-medium">Порядок отображения</p>
                <p className="text-xs text-muted-foreground">
                  Используйте стрелки для изменения порядка фильтров. Не забудьте сохранить изменения.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Icon name="Info" className="text-primary mt-1" size={18} />
              <div>
                <p className="text-sm font-medium">Видимость фильтров</p>
                <p className="text-xs text-muted-foreground">
                  Выключенные фильтры не отображаются пользователям на карте.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FilterSettings;