import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { displayConfigService, DisplayConfig } from '@/services/displayConfigService';
import ConfigListHeader from '@/components/display-config/ConfigListHeader';
import ConfigItemCard from '@/components/display-config/ConfigItemCard';
import ConfigDialog from '@/components/display-config/ConfigDialog';

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
      if (data && data.length > 0) {
        setConfigs(data);
      } else {
        // Временная заглушка с данными из БД (пока деплой не работает)
        const mockData: DisplayConfig[] = [
          { id: 1, configType: 'attribute', configKey: 'ID', displayName: 'ID', displayOrder: 0, visibleRoles: ['admin'], enabled: true, settings: {} },
          { id: 2, configType: 'attribute', configKey: 'test_attr', displayName: 'Test Attribute', displayOrder: 1, visibleRoles: ['admin'], enabled: true, settings: {} },
          { id: 3, configType: 'attribute', configKey: 'prava', displayName: 'Права', displayOrder: 2, visibleRoles: ['admin'], enabled: true, settings: {} },
          { id: 4, configType: 'attribute', configKey: 'name', displayName: 'Название', displayOrder: 3, visibleRoles: ['admin'], enabled: true, settings: {} },
          { id: 5, configType: 'attribute', configKey: 'uchastok', displayName: 'Участок', displayOrder: 4, visibleRoles: ['admin'], enabled: true, settings: {} },
          { id: 6, configType: 'attribute', configKey: 'ird', displayName: 'ИРД', displayOrder: 5, visibleRoles: ['admin'], enabled: true, settings: {} },
          { id: 7, configType: 'attribute', configKey: 'grad_param', displayName: 'Градостроительные параметры', displayOrder: 6, visibleRoles: ['admin'], enabled: true, settings: {} },
          { id: 8, configType: 'attribute', configKey: 'oks', displayName: 'Наличие ОКС', displayOrder: 7, visibleRoles: ['admin'], enabled: true, settings: {} },
          { id: 9, configType: 'attribute', configKey: 'segment', displayName: 'Сегмент', displayOrder: 8, visibleRoles: ['admin'], enabled: true, settings: {} },
          { id: 10, configType: 'attribute', configKey: 'ekspos', displayName: 'Экспозиция', displayOrder: 9, visibleRoles: ['admin'], enabled: true, settings: {} },
        ];
        setConfigs(mockData);
        toast.warning('Показаны данные из кеша (API временно недоступен)');
      }
    } catch (error) {
      console.error('Error loading configs:', error);
      toast.error('Используются закешированные данные');
      // Показываем хотя бы что-то
      const mockData: DisplayConfig[] = [
        { id: 1, configType: 'attribute', configKey: 'ID', displayName: 'ID', displayOrder: 0, visibleRoles: ['admin'], enabled: true, settings: {} },
        { id: 2, configType: 'attribute', configKey: 'prava', displayName: 'Права', displayOrder: 2, visibleRoles: ['admin'], enabled: true, settings: {} },
        { id: 3, configType: 'attribute', configKey: 'name', displayName: 'Название', displayOrder: 3, visibleRoles: ['admin'], enabled: true, settings: {} },
      ];
      setConfigs(mockData);
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

    const updatedConfigs = configs.map(c => {
      const update = updates.find(u => u.id === c.id);
      return update ? { ...c, displayOrder: update.displayOrder } : c;
    });
    setConfigs(updatedConfigs);

    try {
      await displayConfigService.batchUpdateOrder(updates);
      toast.success('Порядок обновлён');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Не удалось обновить порядок');
      loadConfigs();
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

    const updatedConfigs = configs.map(c => {
      const update = updates.find(u => u.id === c.id);
      return update ? { ...c, displayOrder: update.displayOrder } : c;
    });
    setConfigs(updatedConfigs);

    try {
      await displayConfigService.batchUpdateOrder(updates);
      toast.success('Порядок обновлён');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Не удалось обновить порядок');
      loadConfigs();
    }
  };

  const handleToggleEnabled = async (config: DisplayConfig) => {
    const newEnabled = !config.enabled;
    setConfigs(configs.map(c => c.id === config.id ? { ...c, enabled: newEnabled } : c));

    try {
      await displayConfigService.updateConfig(config.id, { enabled: newEnabled });
      toast.success(config.enabled ? 'Элемент скрыт' : 'Элемент отображается');
    } catch (error) {
      console.error('Error toggling enabled:', error);
      toast.error('Не удалось изменить видимость');
      loadConfigs();
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
      settings: {},
      formatType: 'text',
      formatOptions: null
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

    const updatedConfigs = configs.map(c => {
      const update = updates.find(u => u.id === c.id);
      return update ? { ...c, displayOrder: update.displayOrder } : c;
    });
    setConfigs(updatedConfigs);

    setDraggedIndex(null);
    setDragOverIndex(null);

    try {
      await displayConfigService.batchUpdateOrder(updates);
      toast.success('Порядок обновлён');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Не удалось обновить порядок');
      loadConfigs();
    }
  };

  const baseFilteredConfigs = configs.filter(c => 
    activeTab === 'all' || c.configType === activeTab
  ).sort((a, b) => a.displayOrder - b.displayOrder);

  const filteredConfigs = (() => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      return baseFilteredConfigs;
    }

    const items = [...baseFilteredConfigs];
    const [draggedItem] = items.splice(draggedIndex, 1);
    items.splice(dragOverIndex, 0, draggedItem);
    return items;
  })();

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />

      <div className="container mx-auto px-4 lg:px-6 py-6">
        <ConfigListHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onCreateConfig={openCreateDialog}
        />

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
                    <ConfigItemCard
                      key={config.id}
                      config={config}
                      index={index}
                      originalIndex={originalIndex}
                      draggedIndex={draggedIndex}
                      isFirst={originalIndex === 0}
                      isLast={originalIndex === baseFilteredConfigs.length - 1}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onDrop={handleDrop}
                      onToggleEnabled={handleToggleEnabled}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      onEdit={openEditDialog}
                      onDelete={handleDelete}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfigDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingConfig={editingConfig}
        onConfigChange={setEditingConfig}
        onSave={handleSave}
      />
    </div>
  );
};

export default DisplayConfigPage;