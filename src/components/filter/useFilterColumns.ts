import { useMemo } from 'react';
import { filterVisibilityService } from '@/services/filterVisibilityService';
import { UserRole } from '@/types/userRoles';
import {
  FilterColumnSettings,
  FilterColumn,
  statusLabels,
  typeLabels,
  getOptionLabel,
  getValueFromPath
} from './types';

export const useFilterColumns = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: any[],
  filterSettings: FilterColumnSettings[],
  userRole: UserRole,
  companyId?: number
) => {
  const columns = useMemo(() => {
    const extractedValues = new Map<string, Set<string>>();

    properties.forEach(prop => {
      const attrs = prop.attributes as Record<string, unknown> | undefined;
      
      if (attrs?.region && typeof attrs.region === 'string' && !attrs.region.startsWith('lyr_')) {
        if (!extractedValues.has('region')) extractedValues.set('region', new Set());
        extractedValues.get('region')!.add(attrs.region);
      }
      
      const segment = attrs?.segment;
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
      } else if (prop.segment && typeof prop.segment === 'string') {
        extractedValues.get('segment')!.add(prop.segment);
      }

      if (prop.status && typeof prop.status === 'string') {
        if (!extractedValues.has('status')) extractedValues.set('status', new Set());
        extractedValues.get('status')!.add(prop.status);
      }
      if (prop.type && typeof prop.type === 'string') {
        if (!extractedValues.has('type')) extractedValues.set('type', new Set());
        extractedValues.get('type')!.add(prop.type);
      }

      if (attrs) {
        Object.entries(attrs).forEach(([key, value]) => {
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
          count: properties.filter(p => (p.attributes as Record<string, unknown>)?.region === r).length
        }))
      },
      {
        id: 'segment',
        label: 'Сегмент',
        options: Array.from(extractedValues.get('segment') || []).sort().map(s => ({
          value: s,
          label: s,
          count: properties.filter(p => {
            const seg = (p.attributes as Record<string, unknown>)?.segment;
            if (Array.isArray(seg)) return seg.includes(s);
            if (typeof seg === 'string') {
              try {
                const parsed = JSON.parse(seg);
                if (Array.isArray(parsed)) return parsed.includes(s);
              } catch { /* fallback */ }
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
      },
      {
        id: 'status_publ',
        label: 'Статус публикации',
        options: Array.from(extractedValues.get('attributes.status_publ') || []).sort().map(v => ({
          value: v,
          label: v,
          count: properties.filter(p => (p.attributes as Record<string, unknown>)?.status_publ === v).length
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
                  const value = getValueFromPath(p as Record<string, unknown>, setting.attributePath);
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

  const visibleColumns = useMemo(() => {
    if (userRole === 'admin') return columns;
    return columns.filter(col =>
      filterVisibilityService.isFilterVisible(col.id, userRole, companyId)
    );
  }, [columns, userRole, companyId]);

  return { columns, visibleColumns };
};

export default useFilterColumns;