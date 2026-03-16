export interface FilterColumnSettings {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
  options: string[];
  defaultValues: string[];
  attributePath: string;
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterColumn {
  id: string;
  label: string;
  options: FilterOption[];
}

export const statusLabels: Record<string, string> = {
  available: 'Доступно',
  reserved: 'Резерв',
  sold: 'Продано'
};

export const typeLabels: Record<string, string> = {
  land: 'Земля',
  commercial: 'Коммерция',
  residential: 'Жильё'
};

export const toggleLabels: Record<string, string> = {
  'true': 'Да',
  'false': 'Нет'
};

export const getOptionLabel = (columnId: string, value: string) => {
  if (columnId === 'status') return statusLabels[value] || value;
  if (columnId === 'type') return typeLabels[value] || value;
  if (value === 'true' || value === 'false') return toggleLabels[value] || value;
  return value;
};

export const getValueFromPath = (obj: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object') return (current as Record<string, unknown>)[key];
    return undefined;
  }, obj);
};
