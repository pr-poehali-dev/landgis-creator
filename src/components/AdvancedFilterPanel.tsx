import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import MapTypeSwitcher from '@/components/filter/MapTypeSwitcher';
import FilterControls from '@/components/filter/FilterControls';
import FilterPanelContent from '@/components/filter/FilterPanelContent';

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
    const loadSettings = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/d55d58af-9be6-493a-a89d-45634d648637');
        
        if (response.ok) {
          const data = await response.json();
          if (data.config && data.config.length > 0) {
            console.log('📱 Настройки загружены с сервера:', data.config);
            setFilterSettings(data.config);
            
            localStorage.setItem('filterSettings', JSON.stringify(data.config));
            
            const defaultFilters: Record<string, string[]> = {};
            data.config.forEach((setting: FilterColumnSettings) => {
              if (setting.defaultValues && setting.defaultValues.length > 0) {
                defaultFilters[setting.id] = setting.defaultValues;
              }
            });
            
            if (Object.keys(defaultFilters).length > 0 && Object.keys(filters).length === 0) {
              console.log('🔄 Применяем дефолтные фильтры:', defaultFilters);
              onFiltersChange(defaultFilters);
            }
            return;
          }
        }
        
        const saved = localStorage.getItem('filterSettings');
        if (saved) {
          const settings = JSON.parse(saved);
          console.log('📱 Настройки загружены из localStorage:', settings);
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
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки настроек:', error);
        
        const saved = localStorage.getItem('filterSettings');
        if (saved) {
          const settings = JSON.parse(saved);
          setFilterSettings(settings);
        }
      }
    };
    
    loadSettings();
  }, [isOpen]);

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

  const toggleLabels: Record<string, string> = {
    'true': 'Да',
    'false': 'Нет'
  };

  const getOptionLabel = (columnId: string, value: string) => {
    if (columnId === 'status') return statusLabels[value] || value;
    if (columnId === 'type') return typeLabels[value] || value;
    // Для всех toggle полей (status_mpt, oks, soinvest и т.д.)
    if (value === 'true' || value === 'false') return toggleLabels[value] || value;
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
                label: getOptionLabel(setting.id, v),
                count: properties.filter(p => {
                  const value = getValueFromPath(p, setting.attributePath);
                  return value === v;
                }).length
              }))
            };
          }
        }

        if (!defaultCol) return null;

        const orderedOptions = setting.options && setting.options.length > 0
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

  // Динамический пересчёт количества с учётом активных фильтров
  const columnsWithDynamicCounts = useMemo(() => {
    // Функция проверки, подходит ли объект под фильтры (исключая текущую колонку)
    const matchesFilters = (property: any, excludeColumnId?: string) => {
      return Object.entries(localFilters).every(([columnId, selectedValues]) => {
        // Пропускаем колонку, для которой считаем
        if (columnId === excludeColumnId) return true;
        
        if (!selectedValues || selectedValues.length === 0) return true;

        const column = columns.find(c => c.id === columnId);
        if (!column) return true;

        const setting = filterSettings.find(s => s.id === columnId);
        
        // Для region
        if (columnId === 'region') {
          return selectedValues.includes(property.attributes?.region);
        }
        
        // Для segment
        if (columnId === 'segment') {
          const seg = property.attributes?.segment;
          if (Array.isArray(seg)) {
            return selectedValues.some(sv => seg.includes(sv));
          }
          if (typeof seg === 'string') {
            try {
              const parsed = JSON.parse(seg);
              if (Array.isArray(parsed)) {
                return selectedValues.some(sv => parsed.includes(sv));
              }
            } catch {}
            const segValues = seg.split(',').map(x => x.trim());
            return selectedValues.some(sv => segValues.includes(sv));
          }
          return selectedValues.includes(property.segment);
        }
        
        // Для status и type
        if (columnId === 'status') {
          return selectedValues.includes(property.status);
        }
        if (columnId === 'type') {
          return selectedValues.includes(property.type);
        }
        
        // Для attributes.*
        if (setting?.attributePath) {
          const value = getValueFromPath(property, setting.attributePath);
          return selectedValues.includes(value);
        }
        
        return true;
      });
    };

    // Пересчитываем counts для каждой колонки
    return columns.map(column => {
      const setting = filterSettings.find(s => s.id === column.id);
      
      const updatedOptions = column.options.map(option => {
        let count = 0;
        
        if (column.id === 'region') {
          count = properties.filter(p => 
            p.attributes?.region === option.value && matchesFilters(p, column.id)
          ).length;
        } else if (column.id === 'segment') {
          count = properties.filter(p => {
            const seg = p.attributes?.segment;
            let matches = false;
            if (Array.isArray(seg)) {
              matches = seg.includes(option.value);
            } else if (typeof seg === 'string') {
              try {
                const parsed = JSON.parse(seg);
                if (Array.isArray(parsed)) {
                  matches = parsed.includes(option.value);
                } else {
                  matches = seg.split(',').map(x => x.trim()).includes(option.value);
                }
              } catch {
                matches = seg.split(',').map(x => x.trim()).includes(option.value);
              }
            } else {
              matches = p.segment === option.value;
            }
            return matches && matchesFilters(p, column.id);
          }).length;
        } else if (column.id === 'status') {
          count = properties.filter(p => 
            p.status === option.value && matchesFilters(p, column.id)
          ).length;
        } else if (column.id === 'type') {
          count = properties.filter(p => 
            p.type === option.value && matchesFilters(p, column.id)
          ).length;
        } else if (setting?.attributePath) {
          count = properties.filter(p => {
            const value = getValueFromPath(p, setting.attributePath);
            return value === option.value && matchesFilters(p, column.id);
          }).length;
        }
        
        return { ...option, count };
      });
      
      return { ...column, options: updatedOptions };
    });
  }, [columns, localFilters, properties, filterSettings]);

  const toggleFilter = (columnId: string, value: string) => {
    setLocalFilters(prev => {
      const current = prev[columnId] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      const newFilters = { ...prev, [columnId]: updated };
      
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
      {onMapTypeChange && (
        <MapTypeSwitcher 
          mapType={mapType} 
          onMapTypeChange={onMapTypeChange} 
        />
      )}

      <FilterControls
        isOpen={isOpen}
        activeCount={activeCount}
        onToggle={onToggle}
        onLayersClick={onLayersClick}
      />

      <div className={cn(
        "absolute top-20 left-4 right-4 z-30 bg-card border border-border rounded-2xl shadow-xl transition-all duration-300 overflow-hidden",
        isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      )}>
        <FilterPanelContent
          isOpen={isOpen}
          activeFilters={activeFilters}
          activeCount={activeCount}
          columns={columnsWithDynamicCounts}
          localFilters={localFilters}
          onToggle={onToggle}
          clearFilters={clearFilters}
          toggleFilter={toggleFilter}
        />
      </div>
    </>
  );
};

export default AdvancedFilterPanel;