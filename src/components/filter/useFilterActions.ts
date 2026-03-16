import { useState, useEffect, useMemo } from 'react';
import { FilterColumnSettings, FilterColumn, getValueFromPath } from './types';

export const useFilterActions = (
  filters: Record<string, string[]>,
  onFiltersChange: (filters: Record<string, string[]>) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: any[],
  columns: FilterColumn[],
  visibleColumns: FilterColumn[],
  filterSettings: FilterColumnSettings[]
) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const columnsWithDynamicCounts = useMemo(() => {
    const matchesFilters = (property: Record<string, unknown>, excludeColumnId?: string) => {
      return Object.entries(localFilters).every(([columnId, selectedValues]) => {
        if (columnId === excludeColumnId) return true;
        if (!selectedValues || selectedValues.length === 0) return true;

        const column = columns.find(c => c.id === columnId);
        if (!column) return true;

        const setting = filterSettings.find(s => s.id === columnId);
        const attrs = property.attributes as Record<string, unknown> | undefined;
        
        if (columnId === 'region') {
          return selectedValues.includes(attrs?.region as string);
        }
        
        if (columnId === 'segment') {
          const seg = attrs?.segment;
          if (Array.isArray(seg)) {
            return selectedValues.some(sv => seg.includes(sv));
          }
          if (typeof seg === 'string') {
            try {
              const parsed = JSON.parse(seg);
              if (Array.isArray(parsed)) {
                return selectedValues.some(sv => parsed.includes(sv));
              }
            } catch { /* fallback */ }
            const segValues = seg.split(',').map(x => x.trim());
            return selectedValues.some(sv => segValues.includes(sv));
          }
          return selectedValues.includes(property.segment as string);
        }
        
        if (columnId === 'status') {
          return selectedValues.includes(property.status as string);
        }
        if (columnId === 'type') {
          return selectedValues.includes(property.type as string);
        }
        
        if (columnId === 'status_publ') {
          return selectedValues.includes(attrs?.status_publ as string);
        }

        if (setting?.attributePath) {
          const value = getValueFromPath(property, setting.attributePath);
          return selectedValues.includes(value as string);
        }
        
        return true;
      });
    };

    return visibleColumns.map(column => {
      const setting = filterSettings.find(s => s.id === column.id);
      
      const updatedOptions = column.options.map(option => {
        let count = 0;
        
        if (column.id === 'region') {
          count = properties.filter(p => 
            (p.attributes as Record<string, unknown>)?.region === option.value && matchesFilters(p, column.id)
          ).length;
        } else if (column.id === 'segment') {
          count = properties.filter(p => {
            const seg = (p.attributes as Record<string, unknown>)?.segment;
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
        } else if (column.id === 'status_publ') {
          count = properties.filter(p => 
            (p.attributes as Record<string, unknown>)?.status_publ === option.value && matchesFilters(p, column.id)
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
  }, [visibleColumns, localFilters, properties, filterSettings]);

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
    const visibleIds = new Set(visibleColumns.map(c => c.id));
    const preserved: Record<string, string[]> = {};
    Object.entries(localFilters).forEach(([columnId, values]) => {
      if (!visibleIds.has(columnId) && values.length > 0) {
        preserved[columnId] = values;
      }
    });
    setLocalFilters(preserved);
    onFiltersChange(preserved);
  };

  const getActiveFiltersCount = () => {
    const visibleIds = new Set(visibleColumns.map(c => c.id));
    return Object.entries(localFilters)
      .filter(([columnId]) => visibleIds.has(columnId))
      .reduce((sum, [, arr]) => sum + arr.length, 0);
  };

  const getActiveFilters = () => {
    const active: Array<{ column: string; value: string; label: string }> = [];
    Object.entries(localFilters).forEach(([columnId, values]) => {
      const column = visibleColumns.find(c => c.id === columnId);
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

  return {
    localFilters,
    columnsWithDynamicCounts,
    toggleFilter,
    clearFilters,
    activeFilters,
    activeCount
  };
};

export default useFilterActions;