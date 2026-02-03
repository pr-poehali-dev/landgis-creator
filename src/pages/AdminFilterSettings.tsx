import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { propertyService } from '@/services/propertyService';

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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadFilterSettings();
  }, []);

  const loadFilterSettings = async () => {
    try {
      const properties = await propertyService.getProperties();
      
      const regions = new Set<string>();
      const segments = new Set<string>();

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
      });

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
          return prev.map(col => {
            const savedCol = savedSettings.find((s: FilterColumn) => s.id === col.id);
            return savedCol ? { ...col, ...savedCol, options: col.options } : col;
          });
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
                <div
                  key={column.id}
                  draggable
                  onDragStart={() => handleDragStart(column.id)}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border border-border bg-card cursor-move transition-all hover:border-primary",
                    draggedColumn === column.id && "opacity-50"
                  )}
                >
                  <Icon name="GripVertical" size={20} className="text-muted-foreground shrink-0" />
                  
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge variant="outline" className="shrink-0">
                      {column.order}
                    </Badge>
                    <div className="font-medium truncate">{column.label}</div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {column.options.length} {column.options.length === 1 ? 'опция' : 'опций'}
                    </Badge>
                    {column.defaultValues.length > 0 && (
                      <Badge variant="default" className="text-xs shrink-0">
                        По умолчанию: {column.defaultValues.length}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={column.enabled}
                      onCheckedChange={() => toggleColumn(column.id)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(column)}
                    >
                      <Icon name="Settings" size={14} className="mr-1" />
                      Настроить
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon name="Eye" size={20} />
                Предпросмотр
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {sortedColumns
                        .filter(col => col.enabled)
                        .map(column => (
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
                    {Array.from({ 
                      length: Math.max(...sortedColumns.filter(c => c.enabled).map(c => Math.min(c.options.length, 5)))
                    }).map((_, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-border/50">
                        {sortedColumns
                          .filter(col => col.enabled)
                          .map(column => {
                            const option = column.options[rowIndex];
                            const isDefault = column.defaultValues.includes(option);
                            
                            return (
                              <td key={column.id} className="px-3 py-1.5">
                                {option ? (
                                  <div
                                    className={cn(
                                      "w-full text-left px-2 py-1.5 rounded text-xs transition-all",
                                      isDefault && "bg-primary/10 text-primary font-medium"
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="truncate">{getOptionLabel(column.id, option)}</span>
                                      {isDefault && (
                                        <Icon name="Check" size={12} className="shrink-0" />
                                      )}
                                    </div>
                                  </div>
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
              <p className="text-xs text-muted-foreground mt-2">
                Предпросмотр показывает первые 5 строк каждого столбца
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Настройка столбца: {editingColumn?.label}</DialogTitle>
            <DialogDescription>
              Измените порядок опций и установите значения по умолчанию
            </DialogDescription>
          </DialogHeader>

          {editingColumn && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Название столбца</Label>
                <Input
                  value={editingColumn.label}
                  onChange={(e) => setEditingColumn({ ...editingColumn, label: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Путь к атрибуту</Label>
                <Input
                  value={editingColumn.attributePath}
                  onChange={(e) => setEditingColumn({ ...editingColumn, attributePath: e.target.value })}
                  placeholder="attributes.region"
                />
                <p className="text-xs text-muted-foreground">
                  Укажите путь к атрибуту в объекте (напр. attributes.region, status, type)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Порядок опций</Label>
                <div className="border border-border rounded-lg divide-y divide-border max-h-[300px] overflow-y-auto">
                  {editingColumn.options.map((option, index) => {
                    const isDefault = editingColumn.defaultValues.includes(option);
                    return (
                      <div
                        key={`${option}-${index}`}
                        className={cn(
                          "flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors",
                          isDefault && "bg-primary/5"
                        )}
                      >
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => moveOption(index, 'up')}
                            disabled={index === 0}
                          >
                            <Icon name="ChevronUp" size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => moveOption(index, 'down')}
                            disabled={index === editingColumn.options.length - 1}
                          >
                            <Icon name="ChevronDown" size={14} />
                          </Button>
                        </div>

                        <Badge variant="outline" className="shrink-0">
                          {index + 1}
                        </Badge>

                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{getOptionLabel(editingColumn.id, option)}</div>
                          <div className="text-xs text-muted-foreground truncate">{option}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Label htmlFor={`default-${option}`} className="text-xs cursor-pointer">
                            По умолчанию
                          </Label>
                          <Switch
                            id={`default-${option}`}
                            checked={isDefault}
                            onCheckedChange={() => toggleDefaultValue(option)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={handleSaveEdit}>
                  <Icon name="Check" size={16} className="mr-2" />
                  Применить
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFilterSettings;
