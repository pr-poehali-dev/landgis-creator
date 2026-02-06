import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface FilterColumnSettings {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
  options: string[];
  defaultValues: string[];
  attributePath: string;
}

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
  mapType?: 'scheme' | 'hybrid';
  onMapTypeChange?: (type: 'scheme' | 'hybrid') => void;
  onLayersClick?: () => void;
}

const AdvancedFilterPanel = ({
  isOpen,
  onToggle,
  filters,
  onFiltersChange,
  properties,
  mapType = 'scheme',
  onMapTypeChange,
  onLayersClick
}: AdvancedFilterPanelProps) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [filterSettings, setFilterSettings] = useState<FilterColumnSettings[]>([]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    const saved = localStorage.getItem('filterSettings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setFilterSettings(settings);
        
        const defaultFilters: Record<string, string[]> = {};
        settings.forEach((setting: FilterColumnSettings) => {
          if (setting.defaultValues.length > 0) {
            defaultFilters[setting.id] = setting.defaultValues;
          }
        });
        
        if (Object.keys(defaultFilters).length > 0 && Object.keys(filters).length === 0) {
          onFiltersChange(defaultFilters);
        }
      } catch (error) {
        console.error('Error loading filter settings:', error);
      }
    }
  }, []);

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

  const getOptionLabel = (columnId: string, value: string) => {
    if (columnId === 'status') return statusLabels[value] || value;
    if (columnId === 'type') return typeLabels[value] || value;
    return value;
  };

  const getValueFromPath = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const columns = useMemo(() => {
    const extractedValues = new Map<string, Set<string>>();

    properties.forEach(prop => {
      if (prop.attributes?.region && !prop.attributes.region.startsWith('lyr_')) {
        if (!extractedValues.has('region')) extractedValues.set('region', new Set());
        extractedValues.get('region')!.add(prop.attributes.region);
      }
      
      const segment = prop.attributes?.segment;
      if (!extractedValues.has('segment')) extractedValues.set('segment', new Set());
      if (Array.isArray(segment)) {
        segment.forEach(s => extractedValues.get('segment')!.add(s));
      } else if (typeof segment === 'string') {
        try {
          const parsed = JSON.parse(segment);
          if (Array.isArray(parsed)) {
            parsed.forEach(s => extractedValues.get('segment')!.add(s));
          } else {
            extractedValues.get('segment')!.add(segment);
          }
        } catch {
          segment.split(',').forEach(s => extractedValues.get('segment')!.add(s.trim()));
        }
      } else if (prop.segment) {
        extractedValues.get('segment')!.add(prop.segment);
      }

      if (prop.status) {
        if (!extractedValues.has('status')) extractedValues.set('status', new Set());
        extractedValues.get('status')!.add(prop.status);
      }
      if (prop.type) {
        if (!extractedValues.has('type')) extractedValues.set('type', new Set());
        extractedValues.get('type')!.add(prop.type);
      }

      if (prop.attributes) {
        Object.entries(prop.attributes).forEach(([key, value]) => {
          if (!key.startsWith('lyr_') && value && typeof value === 'string') {
            const attrKey = `attributes.${key}`;
            if (!extractedValues.has(attrKey)) extractedValues.set(attrKey, new Set());
            extractedValues.get(attrKey)!.add(value);
          }
        });
      }
    });

    const defaultColumns: FilterColumn[] = [
      {
        id: 'region',
        label: 'Регион',
        options: Array.from(extractedValues.get('region') || []).sort().map(r => ({
          value: r,
          label: r,
          count: properties.filter(p => p.attributes?.region === r).length
        }))
      },
      {
        id: 'segment',
        label: 'Сегмент',
        options: Array.from(extractedValues.get('segment') || []).sort().map(s => ({
          value: s,
          label: s,
          count: properties.filter(p => {
            const seg = p.attributes?.segment;
            if (Array.isArray(seg)) return seg.includes(s);
            if (typeof seg === 'string') {
              try {
                const parsed = JSON.parse(seg);
                if (Array.isArray(parsed)) return parsed.includes(s);
              } catch {}
              return seg.split(',').map(x => x.trim()).includes(s);
            }
            return p.segment === s;
          }).length
        }))
      },
      {
        id: 'status',
        label: 'Статус',
        options: Array.from(extractedValues.get('status') || []).sort().map(s => ({
          value: s,
          label: statusLabels[s] || s,
          count: properties.filter(p => p.status === s).length
        }))
      },
      {
        id: 'type',
        label: 'Тип',
        options: Array.from(extractedValues.get('type') || []).sort().map(t => ({
          value: t,
          label: typeLabels[t] || t,
          count: properties.filter(p => p.type === t).length
        }))
      }
    ];

    if (filterSettings.length === 0) {
      return defaultColumns;
    }

    return filterSettings
      .filter(setting => setting.enabled)
      .sort((a, b) => a.order - b.order)
      .map(setting => {
        let defaultCol = defaultColumns.find(c => c.id === setting.id);
        
        if (!defaultCol && setting.attributePath) {
          const values = extractedValues.get(setting.attributePath);
          if (values) {
            defaultCol = {
              id: setting.id,
              label: setting.label,
              options: Array.from(values).sort().map(v => ({
                value: v,
                label: v,
                count: properties.filter(p => {
                  const value = getValueFromPath(p, setting.attributePath);
                  return value === v;
                }).length
              }))
            };
          }
        }

        if (!defaultCol) return null;

        const orderedOptions = setting.options.length > 0
          ? setting.options
              .map(optionValue => {
                const found = defaultCol!.options.find(o => o.value === optionValue);
                return found || { value: optionValue, label: getOptionLabel(setting.id, optionValue), count: 0 };
              })
              .filter(opt => {
                return defaultCol!.options.some(o => o.value === opt.value);
              })
          : defaultCol.options;

        return {
          id: setting.id,
          label: setting.label,
          options: orderedOptions
        };
      })
      .filter(Boolean) as FilterColumn[];
  }, [properties, filterSettings]);

  const toggleFilter = (columnId: string, value: string) => {
    setLocalFilters(prev => {
      const current = prev[columnId] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      const newFilters = { ...prev, [columnId]: updated };
      
      // Применяем фильтры сразу
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  const clearFilters = () => {
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
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
    <>
      {/* Map Type Switcher - верхний левый угол */}
      {onMapTypeChange && (
        <div className="absolute top-4 left-4 z-40">
          <div className="inline-flex rounded-lg border border-border bg-muted/50 shadow-lg backdrop-blur h-12 p-0.5">
            <Button
              onClick={() => onMapTypeChange('scheme')}
              variant="ghost"
              className={cn(
                "gap-2 px-4 h-full text-base font-semibold rounded-md transition-all",
                mapType === 'scheme' ? "bg-accent text-accent-foreground shadow-sm" : "hover:bg-muted"
              )}
            >
              <Icon name="Map" size={20} className="flex-shrink-0" />
              <span className="hidden md:inline">Схема</span>
            </Button>
            <Button
              onClick={() => onMapTypeChange('hybrid')}
              variant="ghost"
              className={cn(
                "gap-2 px-4 h-full text-base font-semibold rounded-md transition-all",
                mapType === 'hybrid' ? "bg-accent text-accent-foreground shadow-sm" : "hover:bg-muted"
              )}
            >
              <Icon name="Satellite" size={20} className="flex-shrink-0" />
              <span className="hidden md:inline">Гибрид</span>
            </Button>
          </div>
        </div>
      )}

      {/* Filter and Layers Buttons - верхний правый угол */}
      <div className="absolute top-4 right-4 z-40 flex gap-2">
        <Button
          onClick={onToggle}
          variant={isOpen || activeCount > 0 ? 'default' : 'outline'}
          className={cn(
            "shadow-lg gap-2 px-6 h-12 text-base font-semibold hover:opacity-90 w-[140px]",
            (isOpen || activeCount > 0) ? "bg-accent text-accent-foreground" : ""
          )}
        >
          <Icon name="Filter" size={20} className="flex-shrink-0" />
          <span className="hidden md:inline">Фильтры</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 bg-white text-foreground">
              {activeCount}
            </Badge>
          )}
        </Button>
        
        {onLayersClick && (
          <Button
            onClick={onLayersClick}
            variant="outline"
            className="shadow-lg gap-2 px-6 h-12 text-base font-semibold hover:opacity-90 w-[140px]"
          >
            <Icon name="Layers" size={20} className="flex-shrink-0" />
            <span className="hidden md:inline">Слои</span>
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      <div className={cn(
        "absolute top-20 left-4 right-4 z-30 bg-card border border-border rounded-2xl shadow-xl transition-all duration-300 overflow-hidden",
        isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      )}>

      {/* Выпадающая панель */}
      {isOpen && (
        <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Активные фильтры с кнопками */}
          <div className="min-h-[44px] flex flex-wrap gap-2 pb-4 mb-2 border-b border-border items-center relative pr-[200px]">
            {/* Кнопки справа */}
            <div className="absolute right-0 top-0 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={clearFilters}
              >
                Сбросить всё
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={onToggle}
              >
                Закрыть
              </Button>
            </div>
            {activeFilters.length > 0 ? (
              <>
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
              </>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center">Фильтры не выбраны</span>
            )}
          </div>

          {/* Адаптивная сетка фильтров */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {columns.map((column) => (
              <div key={column.id}>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  {column.label}
                </h3>
                <div className="space-y-1.5">
                  {column.options.map((option) => {
                    const isSelected = localFilters[column.id]?.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        onClick={() => toggleFilter(column.id, option.value)}
                        className={cn(
                          "w-full px-3 py-2.5 text-left rounded-lg transition-all border",
                          "hover:border-accent/50 group",
                          isSelected
                            ? "bg-accent/10 border-accent text-foreground font-medium shadow-sm"
                            : "bg-card/50 border-border text-muted-foreground hover:bg-card/80"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm">{option.label}</span>
                          <Badge 
                            variant={isSelected ? "default" : "secondary"}
                            className={cn(
                              "text-xs min-w-[28px] justify-center",
                              isSelected ? "bg-accent text-accent-foreground" : ""
                            )}
                          >
                            {option.count}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>


        </div>
      )}
      </div>
    </>
  );
};

export default AdvancedFilterPanel;