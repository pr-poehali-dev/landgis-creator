import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterColumn {
  id: string;
  label: string;
  options: FilterOption[];
}

interface AdvancedFilterPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  filters: Record<string, string[]>;
  onFiltersChange: (filters: Record<string, string[]>) => void;
  properties: any[];
}

const AdvancedFilterPanel = ({
  isOpen,
  onToggle,
  filters,
  onFiltersChange,
  properties
}: AdvancedFilterPanelProps) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Извлекаем уникальные значения для каждого фильтра
  const getFilterColumns = (): FilterColumn[] => {
    const regions = new Set<string>();
    const segments = new Set<string>();
    const statuses = new Set<string>();
    const types = new Set<string>();

    properties.forEach(prop => {
      if (prop.attributes?.region) regions.add(prop.attributes.region);
      
      const segment = prop.attributes?.segment;
      if (Array.isArray(segment)) {
        segment.forEach(s => segments.add(s));
      } else if (typeof segment === 'string') {
        segment.split(',').forEach(s => segments.add(s.trim()));
      } else if (prop.segment) {
        segments.add(prop.segment);
      }

      if (prop.status) statuses.add(prop.status);
      if (prop.type) types.add(prop.type);
    });

    const statusLabels: Record<string, string> = {
      available: 'Доступно',
      reserved: 'Резерв',
      sold: 'Продано'
    };

    const typeLabels: Record<string, string> = {
      land: 'Земля',
      commercial: 'Коммерция',
      residential: 'Жильё'
    };

    return [
      {
        id: 'region',
        label: 'Регион',
        options: Array.from(regions).map(r => ({
          value: r,
          label: r,
          count: properties.filter(p => p.attributes?.region === r).length
        }))
      },
      {
        id: 'segment',
        label: 'Сегмент',
        options: Array.from(segments).map(s => ({
          value: s,
          label: s,
          count: properties.filter(p => {
            const seg = p.attributes?.segment;
            if (Array.isArray(seg)) return seg.includes(s);
            if (typeof seg === 'string') return seg.split(',').map(x => x.trim()).includes(s);
            return p.segment === s;
          }).length
        }))
      },
      {
        id: 'status',
        label: 'Статус',
        options: Array.from(statuses).map(s => ({
          value: s,
          label: statusLabels[s] || s,
          count: properties.filter(p => p.status === s).length
        }))
      },
      {
        id: 'type',
        label: 'Тип',
        options: Array.from(types).map(t => ({
          value: t,
          label: typeLabels[t] || t,
          count: properties.filter(p => p.type === t).length
        }))
      }
    ];
  };

  const columns = getFilterColumns();

  const toggleFilter = (columnId: string, value: string) => {
    setLocalFilters(prev => {
      const current = prev[columnId] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [columnId]: updated };
    });
  };

  const clearFilters = () => {
    setLocalFilters({});
    onFiltersChange({});
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.values(localFilters).reduce((sum, arr) => sum + arr.length, 0);
  };

  const getActiveFilters = () => {
    const active: Array<{ column: string; value: string; label: string }> = [];
    Object.entries(localFilters).forEach(([columnId, values]) => {
      const column = columns.find(c => c.id === columnId);
      if (column) {
        values.forEach(value => {
          const option = column.options.find(o => o.value === value);
          if (option) {
            active.push({
              column: column.label,
              value: value,
              label: option.label
            });
          }
        });
      }
    });
    return active;
  };

  const activeFilters = getActiveFilters();
  const activeCount = getActiveFiltersCount();

  return (
    <div className="absolute top-12 left-0 right-0 z-10 bg-card/95 backdrop-blur-lg border-b border-border shadow-xl">
      {/* Кнопка открытия/закрытия */}
      <button
        onClick={onToggle}
        className="w-full h-10 flex items-center justify-between px-4 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon name="SlidersHorizontal" size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium">Фильтры</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="h-5 px-2 text-xs">
              {activeCount}
            </Badge>
          )}
        </div>
        <Icon 
          name={isOpen ? "ChevronUp" : "ChevronDown"} 
          size={16} 
          className="text-muted-foreground transition-transform"
        />
      </button>

      {/* Выпадающая панель */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isOpen ? "max-h-[400px]" : "max-h-0"
        )}
      >
        <div className="p-4 space-y-4">
          {/* Активные фильтры */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-3 border-b border-border">
              {activeFilters.map((filter, idx) => (
                <Badge
                  key={`${filter.column}-${filter.value}-${idx}`}
                  variant="secondary"
                  className="h-7 px-3 gap-2 cursor-pointer hover:bg-destructive/20"
                  onClick={() => toggleFilter(
                    columns.find(c => c.label === filter.column)?.id || '',
                    filter.value
                  )}
                >
                  <span className="text-xs text-muted-foreground">{filter.column}:</span>
                  <span className="text-xs font-medium">{filter.label}</span>
                  <Icon name="X" size={12} />
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={clearFilters}
              >
                Очистить всё
              </Button>
            </div>
          )}

          {/* Таблица фильтров */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {columns.map(column => (
                    <th
                      key={column.id}
                      className="text-left text-xs font-semibold text-muted-foreground px-3 py-2 border-b border-border bg-muted/30"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Определяем максимальное количество строк */}
                {Array.from({ 
                  length: Math.max(...columns.map(c => c.options.length)) 
                }).map((_, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-border/50">
                    {columns.map(column => {
                      const option = column.options[rowIndex];
                      const isActive = localFilters[column.id]?.includes(option?.value);
                      
                      return (
                        <td key={column.id} className="px-3 py-1.5">
                          {option ? (
                            <button
                              onClick={() => toggleFilter(column.id, option.value)}
                              className={cn(
                                "w-full text-left px-2 py-1.5 rounded text-xs transition-all hover:bg-accent",
                                isActive && "bg-primary/10 text-primary font-medium"
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate">{option.label}</span>
                                {option.count !== undefined && (
                                  <span className="text-[10px] text-muted-foreground shrink-0">
                                    {option.count}
                                  </span>
                                )}
                              </div>
                            </button>
                          ) : (
                            <div className="h-8" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Кнопки действий */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={clearFilters}
            >
              Сбросить
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                applyFilters();
                onToggle();
              }}
            >
              Применить фильтры
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilterPanel;
