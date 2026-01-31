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
import func2url from '../../backend/func2url.json';

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
      // Пробуем API
      try {
        const response = await fetch(`${func2url['filter-settings']}?mode=attrs`);
        if (response.ok) {
          const data = await response.json();
          const sorted = data.sort((a: DisplayConfig, b: DisplayConfig) => a.displayOrder - b.displayOrder);
          setConfigs(sorted);
          localStorage.setItem('displayConfigs', JSON.stringify(sorted));
          return;
        }
      } catch {}
      
      // Fallback: localStorage
      const saved = localStorage.getItem('displayConfigs');
      if (saved) {
        setConfigs(JSON.parse(saved));
      } else {
        const defaults = JSON.parse(JSON.stringify(DEFAULT_DISPLAY_CONFIGS));
        setConfigs(defaults);
        localStorage.setItem('displayConfigs', JSON.stringify(defaults));
      }
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
    
    // Сохраняем в localStorage
    setConfigs(updatedConfigs);
    localStorage.setItem('displayConfigs', JSON.stringify(updatedConfigs));
    toast.success(editingConfig.id ? 'Настройки сохранены' : 'Элемент создан');
    setIsDialogOpen(false);
    
    // Пробуем синхронизировать с API
    try {
      await fetch(`${func2url['filter-settings']}?mode=attrs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.dumps({ configs: updatedConfigs })
      });
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот элемент?')) return;
    const updatedConfigs = configs.filter(c => c.id !== id);
    
    setConfigs(updatedConfigs);
    localStorage.setItem('displayConfigs', JSON.stringify(updatedConfigs));
    toast.success('Элемент удалён');
    
    try {
      await fetch(`${func2url['filter-settings']}?mode=attrs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: updatedConfigs })
      });
    } catch {}
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
    localStorage.setItem('displayConfigs', JSON.stringify(updatedConfigs));
    toast.success('Порядок изменён');
    
    try {
      await fetch(`${func2url['filter-settings']}?mode=attrs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: updatedConfigs })
      });
    } catch {}
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
    localStorage.setItem('displayConfigs', JSON.stringify(updatedConfigs));
    toast.success('Порядок изменён');
    
    try {
      await fetch(`${func2url['filter-settings']}?mode=attrs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: updatedConfigs })
      });
    } catch {}
  };

  const handleToggleEnabled = async (config: DisplayConfig) => {
    const newEnabled = !config.enabled;
    const updatedConfigs = configs.map(c => c.id === config.id ? { ...c, enabled: newEnabled } : c);
    
    setConfigs(updatedConfigs);
    localStorage.setItem('displayConfigs', JSON.stringify(updatedConfigs));
    toast.success(newEnabled ? 'Атрибут включён в таблице' : 'Атрибут скрыт из таблицы');
    
    try {
      await fetch(`${func2url['filter-settings']}?mode=attrs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: updatedConfigs })
      });
    } catch {}
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