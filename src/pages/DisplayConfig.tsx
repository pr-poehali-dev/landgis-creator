import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { displayConfigService, DisplayConfig } from '@/services/displayConfigService';
import ConfigListHeader from '@/components/display-config/ConfigListHeader';
import ConfigItemCard from '@/components/display-config/ConfigItemCard';
import ConfigDialog from '@/components/display-config/ConfigDialog';
import { DEFAULT_DISPLAY_CONFIGS } from '@/config/defaultDisplayConfigs';

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
      const response = await fetch('https://functions.poehali.dev/get-display-configs');
      if (!response.ok) throw new Error('Failed to load configs');
      
      const data = await response.json();
      setConfigs(data.sort((a: DisplayConfig, b: DisplayConfig) => a.displayOrder - b.displayOrder));
    } catch (error) {
      console.error('Error loading configs:', error);
      toast.error('Не удалось загрузить настройки');
      // Используем дефолтные данные при ошибке
      setConfigs(JSON.parse(JSON.stringify(DEFAULT_DISPLAY_CONFIGS)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingConfig) return;

    let updatedConfigs;
    if (editingConfig.id) {
      updatedConfigs = configs.map(c => c.id === editingConfig.id ? editingConfig : c);
    } else {
      const newConfig = { ...editingConfig, id: Date.now() };
      updatedConfigs = [...configs, newConfig];
    }
    
    try {
      const response = await fetch('https://functions.poehali.dev/save-display-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: updatedConfigs })
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      setConfigs(updatedConfigs);
      toast.success(editingConfig.id ? 'Настройки сохранены' : 'Элемент создан');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving configs:', error);
      toast.error('Не удалось сохранить настройки');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот элемент?')) return;
    const updatedConfigs = configs.filter(c => c.id !== id);
    
    try {
      const response = await fetch('https://functions.poehali.dev/save-display-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: updatedConfigs })
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      setConfigs(updatedConfigs);
      toast.success('Элемент удалён');
    } catch (error) {
      console.error('Error deleting config:', error);
      toast.error('Не удалось удалить элемент');
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
    
    try {
      const response = await fetch('https://functions.poehali.dev/save-display-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: updatedConfigs })
      });
      
      if (!response.ok) throw new Error('Failed to save order');
      
      setConfigs(updatedConfigs);
      toast.success('Порядок изменён');
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Не удалось изменить порядок');
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
    
    try {
      const response = await fetch('https://functions.poehali.dev/save-display-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: updatedConfigs })
      });
      
      if (!response.ok) throw new Error('Failed to save order');
      
      setConfigs(updatedConfigs);
      toast.success('Порядок изменён');
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Не удалось изменить порядок');
    }
  };

  const handleToggleEnabled = async (config: DisplayConfig) => {
    const newEnabled = !config.enabled;
    const updatedConfigs = configs.map(c => c.id === config.id ? { ...c, enabled: newEnabled } : c);
    
    try {
      const response = await fetch('https://functions.poehali.dev/save-display-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: updatedConfigs })
      });
      
      if (!response.ok) throw new Error('Failed to toggle');
      
      setConfigs(updatedConfigs);
      toast.success(newEnabled ? 'Атрибут включён в таблице' : 'Атрибут скрыт из таблицы');
    } catch (error) {
      console.error('Error toggling config:', error);
      toast.error('Не удалось изменить настройку');
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

  const handleDrop = (targetIndex: number) => {
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
    toast.success('Порядок изменён перетаскиванием');
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