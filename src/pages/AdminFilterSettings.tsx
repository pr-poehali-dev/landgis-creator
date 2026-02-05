import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { propertyService } from '@/services/propertyService';
import FilterColumnItem from '@/components/admin/filter-settings/FilterColumnItem';
import FilterPreviewTable from '@/components/admin/filter-settings/FilterPreviewTable';
import EditColumnDialog from '@/components/admin/filter-settings/EditColumnDialog';
import CreateColumnDialog from '@/components/admin/filter-settings/CreateColumnDialog';

interface FilterColumn {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
  options: string[];
  defaultValues: string[];
  attributePath: string;
}

const AdminFilterSettings = () => {
  const [filterColumns, setFilterColumns] = useState<FilterColumn[]>([
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
  ]);

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

      setFilterColumns(prev => prev.map(col => {
        if (col.id === 'region') {
          return { ...col, options: Array.from(regions).sort() };
        }
        if (col.id === 'segment') {
          return { ...col, options: Array.from(segments).sort() };
        }
        return col;
      }));

      const saved = localStorage.getItem('filterSettings');
      if (saved) {
        const savedSettings = JSON.parse(saved);
        setFilterColumns(prev => {
          const merged = savedSettings.map((savedCol: FilterColumn) => {
            const existing = prev.find(col => col.id === savedCol.id);
            return existing 
              ? { ...savedCol, options: existing.options }
              : savedCol;
          });
          
          prev.forEach(col => {
            if (!savedSettings.find((s: FilterColumn) => s.id === col.id)) {
              merged.push(col);
            }
          });
          
          return merged.sort((a, b) => a.order - b.order);
        });
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
      toast.success('Настройки фильтров сохранены');
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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: 'Доступно',
      reserved: 'Резерв',
      sold: 'Продано'
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      land: 'Земля',
      commercial: 'Коммерция',
      residential: 'Жильё'
    };
    return labels[type] || type;
  };

  const getOptionLabel = (columnId: string, value: string) => {
    if (columnId === 'status') return getStatusLabel(value);
    if (columnId === 'type') return getTypeLabel(value);
    return value;
  };

  const sortedColumns = [...filterColumns].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />

      <div className="container mx-auto px-4 lg:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Настройка фильтров</h2>
            <p className="text-sm text-muted-foreground">
              Управляйте отображением и порядком фильтров на карте
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleResetSettings}>
              <Icon name="RotateCcw" size={16} className="mr-2" />
              Сбросить
            </Button>
            <Button variant="outline" size="sm" onClick={openCreateDialog}>
              <Icon name="Plus" size={16} className="mr-2" />
              Создать столбец
            </Button>
            <Button size="sm" onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? (
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
              ) : (
                <Icon name="Save" size={16} className="mr-2" />
              )}
              Сохранить
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon name="Layers" size={20} />
                Столбцы фильтра
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Перетаскивайте для изменения порядка отображения
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {sortedColumns.map((column) => (
                <FilterColumnItem
                  key={column.id}
                  column={column}
                  isDragging={draggedColumn === column.id}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onToggle={toggleColumn}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteColumn}
                />
              ))}
            </CardContent>
          </Card>

          <FilterPreviewTable
            columns={sortedColumns}
            getOptionLabel={getOptionLabel}
          />
        </div>
      </div>

      <EditColumnDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        column={editingColumn}
        onColumnChange={setEditingColumn}
        onSave={handleSaveEdit}
        onMoveOption={moveOption}
        onToggleDefault={toggleDefaultValue}
        getOptionLabel={getOptionLabel}
      />

      <CreateColumnDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        newColumn={newColumn}
        onColumnChange={setNewColumn}
        onCreate={handleCreateColumn}
        availableAttributes={availableAttributes}
      />
    </div>
  );
};

export default AdminFilterSettings;