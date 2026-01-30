import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { displayConfigService, DisplayConfig } from '@/services/displayConfigService';

const DisplayConfigPage = () => {
  const [configs, setConfigs] = useState<DisplayConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<DisplayConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const data = await displayConfigService.getConfigs();
      setConfigs(data);
    } catch (error) {
      console.error('Error loading configs:', error);
      toast.error('Не удалось загрузить настройки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingConfig) return;

    try {
      if (editingConfig.id) {
        await displayConfigService.updateConfig(editingConfig.id, editingConfig);
        toast.success('Настройки сохранены');
      } else {
        await displayConfigService.createConfig(editingConfig);
        toast.success('Элемент создан');
      }
      setIsDialogOpen(false);
      loadConfigs();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Не удалось сохранить');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот элемент?')) return;

    try {
      await displayConfigService.deleteConfig(id);
      toast.success('Элемент удалён');
      loadConfigs();
    } catch (error) {
      console.error('Error deleting config:', error);
      toast.error('Не удалось удалить');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newConfigs = [...baseFilteredConfigs];
    [newConfigs[index - 1], newConfigs[index]] = [newConfigs[index], newConfigs[index - 1]];

    const updates = newConfigs.map((config, idx) => ({
      id: config.id,
      displayOrder: idx
    }));

    try {
      await displayConfigService.batchUpdateOrder(updates);
      toast.success('Порядок обновлён');
      loadConfigs();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Не удалось обновить порядок');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === baseFilteredConfigs.length - 1) return;

    const newConfigs = [...baseFilteredConfigs];
    [newConfigs[index], newConfigs[index + 1]] = [newConfigs[index + 1], newConfigs[index]];

    const updates = newConfigs.map((config, idx) => ({
      id: config.id,
      displayOrder: idx
    }));

    try {
      await displayConfigService.batchUpdateOrder(updates);
      toast.success('Порядок обновлён');
      loadConfigs();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Не удалось обновить порядок');
    }
  };

  const handleToggleEnabled = async (config: DisplayConfig) => {
    try {
      await displayConfigService.updateConfig(config.id, { enabled: !config.enabled });
      toast.success(config.enabled ? 'Элемент скрыт' : 'Элемент отображается');
      loadConfigs();
    } catch (error) {
      console.error('Error toggling enabled:', error);
      toast.error('Не удалось изменить видимость');
    }
  };

  const openCreateDialog = (type: DisplayConfig['configType']) => {
    setEditingConfig({
      id: 0,
      configType: type,
      configKey: '',
      displayName: '',
      displayOrder: configs.length,
      visibleRoles: ['admin'],
      enabled: true,
      settings: {}
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (config: DisplayConfig) => {
    setEditingConfig({ ...config });
    setIsDialogOpen(true);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newConfigs = [...baseFilteredConfigs];
    const [draggedItem] = newConfigs.splice(draggedIndex, 1);
    newConfigs.splice(targetIndex, 0, draggedItem);

    const updates = newConfigs.map((config, idx) => ({
      id: config.id,
      displayOrder: idx
    }));

    try {
      await displayConfigService.batchUpdateOrder(updates);
      toast.success('Порядок обновлён');
      loadConfigs();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Не удалось обновить порядок');
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const baseFilteredConfigs = configs.filter(c => 
    activeTab === 'all' || c.configType === activeTab
  ).sort((a, b) => a.displayOrder - b.displayOrder);

  const filteredConfigs = (() => {
    if (draggedIndex === null || dragOverIndex === null) {
      return baseFilteredConfigs;
    }

    const items = [...baseFilteredConfigs];
    const [draggedItem] = items.splice(draggedIndex, 1);
    items.splice(dragOverIndex, 0, draggedItem);
    return items;
  })();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'attribute': return 'Tag';
      case 'image': return 'Image';
      case 'document': return 'FileText';
      case 'contact_button': return 'Phone';
      default: return 'Box';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'attribute': return 'Атрибут';
      case 'image': return 'Изображения';
      case 'document': return 'Документы';
      case 'contact_button': return 'Кнопка связи';
      case 'custom_element': return 'Другое';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />

      <div className="container mx-auto px-4 lg:px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Окно атрибутов</h2>
          <p className="text-muted-foreground">
            Настройте порядок отображения атрибутов и элементов на карточке объекта
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">Все элементы</TabsTrigger>
            <TabsTrigger value="attribute">Атрибуты</TabsTrigger>
            <TabsTrigger value="image">Изображения</TabsTrigger>
            <TabsTrigger value="document">Документы</TabsTrigger>
            <TabsTrigger value="contact_button">Кнопки</TabsTrigger>
            <TabsTrigger value="custom_element">Другое</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2 mb-4">
          <Button onClick={() => openCreateDialog('attribute')} size="sm">
            <Icon name="Plus" size={16} className="mr-2" />
            Добавить атрибут
          </Button>
          <Button onClick={() => openCreateDialog('image')} variant="outline" size="sm">
            <Icon name="Image" size={16} className="mr-2" />
            Изображения
          </Button>
          <Button onClick={() => openCreateDialog('document')} variant="outline" size="sm">
            <Icon name="FileText" size={16} className="mr-2" />
            Документы
          </Button>
          <Button onClick={() => openCreateDialog('contact_button')} variant="outline" size="sm">
            <Icon name="Phone" size={16} className="mr-2" />
            Кнопка связи
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Элементы карточки объекта
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Icon name="Loader2" className="animate-spin text-primary" size={32} />
              </div>
            ) : filteredConfigs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Box" className="mx-auto mb-4 opacity-20" size={48} />
                <p>Нет элементов</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConfigs.map((config, index) => {
                  const originalIndex = baseFilteredConfigs.findIndex(c => c.id === config.id);
                  return (
                  <div
                    key={config.id}
                    draggable
                    onDragStart={() => handleDragStart(originalIndex)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onDrop={() => handleDrop(index)}
                    className={`flex items-center gap-3 p-4 border rounded-lg transition-all duration-200 ${
                      !config.enabled ? 'opacity-50' : ''
                    } ${
                      draggedIndex === originalIndex ? 'opacity-40' : ''
                    } cursor-move hover:border-primary/50`}
                  >
                    <Icon name="GripVertical" size={20} className="text-muted-foreground cursor-grab active:cursor-grabbing" />
                    <Icon name={getTypeIcon(config.configType) as any} size={20} className="text-primary" />
                    
                    <div className="flex-1">
                      <div className="font-medium">{config.displayName}</div>
                      <div className="text-sm text-muted-foreground">
                        {getTypeLabel(config.configType)} · {config.configKey}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {config.visibleRoles.map(role => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>

                    <Switch
                      checked={config.enabled}
                      onCheckedChange={() => handleToggleEnabled(config)}
                    />

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <Icon name="ChevronUp" size={18} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === baseFilteredConfigs.length - 1}
                      >
                        <Icon name="ChevronDown" size={18} />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(config)}
                    >
                      <Icon name="Pencil" size={18} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(config.id)}
                    >
                      <Icon name="Trash2" size={18} className="text-destructive" />
                    </Button>
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingConfig?.id ? 'Редактировать элемент' : 'Создать элемент'}
            </DialogTitle>
            <DialogDescription>
              Настройте параметры отображения элемента
            </DialogDescription>
          </DialogHeader>

          {editingConfig && (
            <div className="space-y-4">
              <div>
                <Label>Тип элемента</Label>
                <Select
                  value={editingConfig.configType}
                  onValueChange={(value: any) =>
                    setEditingConfig({ ...editingConfig, configType: value })
                  }
                  disabled={!!editingConfig.id}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attribute">Атрибут</SelectItem>
                    <SelectItem value="image">Изображения</SelectItem>
                    <SelectItem value="document">Документы</SelectItem>
                    <SelectItem value="contact_button">Кнопка связи</SelectItem>
                    <SelectItem value="custom_element">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ключ (для атрибутов - название поля)</Label>
                <Input
                  value={editingConfig.configKey}
                  onChange={(e) =>
                    setEditingConfig({ ...editingConfig, configKey: e.target.value })
                  }
                  placeholder="name"
                />
              </div>

              <div>
                <Label>Отображаемое название</Label>
                <Input
                  value={editingConfig.displayName}
                  onChange={(e) =>
                    setEditingConfig({ ...editingConfig, displayName: e.target.value })
                  }
                  placeholder="Название"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editingConfig.enabled}
                  onCheckedChange={(checked) =>
                    setEditingConfig({ ...editingConfig, enabled: checked })
                  }
                />
                <Label>Отображать на карточке</Label>
              </div>

              <div>
                <Label>Роли с доступом</Label>
                <div className="flex gap-2 mt-2">
                  {['admin', 'user'].map((role) => (
                    <label key={role} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingConfig.visibleRoles.includes(role)}
                        onChange={(e) => {
                          const roles = e.target.checked
                            ? [...editingConfig.visibleRoles, role]
                            : editingConfig.visibleRoles.filter(r => r !== role);
                          setEditingConfig({ ...editingConfig, visibleRoles: roles });
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{role}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              {editingConfig?.id ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DisplayConfigPage;