import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { propertyService } from '@/services/propertyService';

export interface FilterColumn {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
  options: string[];
  defaultValues: string[];
  attributePath: string;
}

const defaultColumns: FilterColumn[] = [
  {
    id: 'region',
    label: 'Регион',
    enabled: true,
    order: 1,
    options: [],
    defaultValues: [],
    attributePath: 'attributes.region'
  },
  {
    id: 'segment',
    label: 'Сегмент',
    enabled: true,
    order: 2,
    options: [],
    defaultValues: [],
    attributePath: 'attributes.segment'
  },
  {
    id: 'status',
    label: 'Статус',
    enabled: true,
    order: 3,
    options: ['available', 'reserved', 'sold'],
    defaultValues: [],
    attributePath: 'status'
  },
  {
    id: 'type',
    label: 'Тип',
    enabled: true,
    order: 4,
    options: ['land', 'commercial', 'residential'],
    defaultValues: [],
    attributePath: 'type'
  }
];

export const useFilterSettingsLogic = () => {
  const [filterColumns, setFilterColumns] = useState<FilterColumn[]>(defaultColumns);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [editingColumn, setEditingColumn] = useState<FilterColumn | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableAttributes, setAvailableAttributes] = useState<Array<{path: string; values: Set<string>}>>([]);
  const [newColumn, setNewColumn] = useState<Partial<FilterColumn>>({
    label: '',
    attributePath: '',
    enabled: true,
    options: [],
    defaultValues: []
  });

  useEffect(() => {
    loadFilterSettings();
  }, []);

  const loadFilterSettings = async () => {
    try {
      const properties = await propertyService.getProperties();
      
      const regions = new Set<string>();
      const segments = new Set<string>();
      const attributeValues = new Map<string, Set<string>>();

      properties.forEach(prop => {
        if (prop.attributes?.region && !prop.attributes.region.startsWith('lyr_')) {
          regions.add(prop.attributes.region);
        }
        
        const segment = prop.attributes?.segment;
        if (Array.isArray(segment)) {
          segment.forEach(s => segments.add(s));
        } else if (typeof segment === 'string') {
          segment.split(',').forEach(s => segments.add(s.trim()));
        }

        if (prop.attributes) {
          Object.entries(prop.attributes).forEach(([key, value]) => {
            if (key === 'region' || key === 'segment') return;
            
            if (!key.startsWith('lyr_') && value) {
              const path = `attributes.${key}`;
              if (!attributeValues.has(path)) {
                attributeValues.set(path, new Set());
              }
              
              if (typeof value === 'string') {
                try {
                  const parsed = JSON.parse(value);
                  if (Array.isArray(parsed)) {
                    parsed.forEach(v => attributeValues.get(path)!.add(String(v)));
                  } else {
                    attributeValues.get(path)!.add(value);
                  }
                } catch {
                  attributeValues.get(path)!.add(value);
                }
              }
            }
          });
        }

        ['status', 'type'].forEach(key => {
          if (prop[key as keyof typeof prop]) {
            if (!attributeValues.has(key)) {
              attributeValues.set(key, new Set());
            }
            attributeValues.get(key)!.add(String(prop[key as keyof typeof prop]));
          }
        });
      });

      setAvailableAttributes(
        Array.from(attributeValues.entries()).map(([path, values]) => ({ path, values }))
      );

      const freshOptions: Record<string, string[]> = {
        region: Array.from(regions).sort(),
        segment: Array.from(segments).sort()
      };

      const saved = localStorage.getItem('filterSettings');
      if (saved) {
        const savedSettings = JSON.parse(saved);
        const merged = savedSettings.map((savedCol: FilterColumn) => {
          if (savedCol.id === 'region' || savedCol.id === 'segment') {
            const savedOptions = savedCol.options || [];
            const freshValues = freshOptions[savedCol.id] || [];
            
            const orderedOptions = savedOptions.filter(opt => freshValues.includes(opt));
            const newOptions = freshValues.filter(opt => !savedOptions.includes(opt));
            
            return { ...savedCol, options: [...orderedOptions, ...newOptions] };
          }
          return savedCol;
        });
        
        defaultColumns.forEach(col => {
          if (!savedSettings.find((s: FilterColumn) => s.id === col.id)) {
            merged.push({
              ...col,
              options: freshOptions[col.id] || col.options
            });
          }
        });
        
        setFilterColumns(merged.sort((a, b) => a.order - b.order));
      } else {
        setFilterColumns(defaultColumns.map(col => ({
          ...col,
          options: freshOptions[col.id] || col.options
        })));
      }
    } catch (error) {
      console.error('Error loading filter settings:', error);
      toast.error('Не удалось загрузить настройки');
    }
  };

  const handleDragStart = (columnId: string) => {
    setDraggedColumn(columnId);
  };

  const handleDragOver = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetColumnId) return;

    const draggedIndex = filterColumns.findIndex(c => c.id === draggedColumn);
    const targetIndex = filterColumns.findIndex(c => c.id === targetColumnId);

    const newColumns = [...filterColumns];
    const [removed] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, removed);

    newColumns.forEach((col, idx) => {
      col.order = idx + 1;
    });

    setFilterColumns(newColumns);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
  };

  const toggleColumn = (columnId: string) => {
    setFilterColumns(prev => prev.map(col =>
      col.id === columnId ? { ...col, enabled: !col.enabled } : col
    ));
  };

  const openEditDialog = (column: FilterColumn) => {
    setEditingColumn({ ...column });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingColumn) return;

    setFilterColumns(prev => prev.map(col =>
      col.id === editingColumn.id ? editingColumn : col
    ));
    setIsEditDialogOpen(false);
    setEditingColumn(null);
  };

  const moveOption = (index: number, direction: 'up' | 'down') => {
    if (!editingColumn) return;

    const newOptions = [...editingColumn.options];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newOptions.length) return;

    [newOptions[index], newOptions[targetIndex]] = [newOptions[targetIndex], newOptions[index]];
    setEditingColumn({ ...editingColumn, options: newOptions });
  };

  const toggleDefaultValue = (value: string) => {
    if (!editingColumn) return;

    const newDefaults = editingColumn.defaultValues.includes(value)
      ? editingColumn.defaultValues.filter(v => v !== value)
      : [...editingColumn.defaultValues, value];

    setEditingColumn({ ...editingColumn, defaultValues: newDefaults });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('filterSettings', JSON.stringify(filterColumns));
      
      const response = await fetch('https://functions.poehali.dev/d55d58af-9be6-493a-a89d-45634d648637', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: filterColumns })
      });
      
      if (!response.ok) {
        throw new Error('Ошибка сохранения на сервер');
      }
      
      toast.success('Настройки фильтров сохранены и синхронизированы');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Не удалось сохранить настройки');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (!confirm('Вы уверены, что хотите сбросить все настройки фильтров?')) {
      return;
    }
    
    localStorage.removeItem('filterSettings');
    loadFilterSettings();
    toast.success('Настройки сброшены');
  };

  const handleDeleteColumn = (columnId: string) => {
    if (!confirm('Удалить этот столбец фильтра?')) return;
    
    setFilterColumns(prev => {
      const filtered = prev.filter(c => c.id !== columnId);
      filtered.forEach((col, idx) => {
        col.order = idx + 1;
      });
      return filtered;
    });
    toast.success('Столбец удален');
  };

  const openCreateDialog = () => {
    setNewColumn({
      label: '',
      attributePath: '',
      enabled: true,
      options: [],
      defaultValues: []
    });
    setIsCreateDialogOpen(true);
  };

  const handleCreateColumn = () => {
    if (!newColumn.label || !newColumn.attributePath) {
      toast.error('Заполните название и путь к атрибуту');
      return;
    }

    const id = newColumn.attributePath.replace(/\./g, '_').toLowerCase();
    
    if (filterColumns.some(c => c.id === id)) {
      toast.error('Столбец с таким путем уже существует');
      return;
    }

    const attribute = availableAttributes.find(a => a.path === newColumn.attributePath);
    const options = attribute ? Array.from(attribute.values).sort() : [];

    const column: FilterColumn = {
      id,
      label: newColumn.label,
      enabled: newColumn.enabled ?? true,
      order: filterColumns.length + 1,
      options,
      defaultValues: newColumn.defaultValues || [],
      attributePath: newColumn.attributePath
    };

    setFilterColumns(prev => [...prev, column]);
    setIsCreateDialogOpen(false);
    toast.success('Столбец создан');
  };

  return {
    filterColumns,
    draggedColumn,
    editingColumn,
    isEditDialogOpen,
    isCreateDialogOpen,
    isSaving,
    availableAttributes,
    newColumn,
    setEditingColumn,
    setIsEditDialogOpen,
    setIsCreateDialogOpen,
    setNewColumn,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    toggleColumn,
    openEditDialog,
    handleSaveEdit,
    moveOption,
    toggleDefaultValue,
    handleSaveSettings,
    handleResetSettings,
    handleDeleteColumn,
    openCreateDialog,
    handleCreateColumn
  };
};