import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { attributeConfigService, AttributeConfig } from '@/services/attributeConfigService';
import { propertyService } from '@/services/propertyService';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AttributeSortableRow } from './AttributeSettings/AttributeSortableRow';
import { AttributeEditDialog } from './AttributeSettings/AttributeEditDialog';
import { AttributeInstructionCard } from './AttributeSettings/AttributeInstructionCard';

const AttributeSettings = () => {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<AttributeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Partial<AttributeConfig> | null>(null);
  const [originalKey, setOriginalKey] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const data = await attributeConfigService.getConfigs();
      setConfigs(data);
    } catch (error) {
      console.error('Error loading configs:', error);
      toast.error('Не удалось загрузить настройки атрибутов');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingConfig || !editingConfig.attributeKey || !editingConfig.displayName) {
      toast.error('Заполните обязательные поля');
      return;
    }

    try {
      if (originalKey && originalKey !== editingConfig.attributeKey) {
        const confirmed = confirm(
          `Переименовать ключ "${originalKey}" в "${editingConfig.attributeKey}" во всех объектах базы данных?\n\nЭто изменит атрибут во всех ${await getPropertiesCount()} объектах.`
        );
        
        if (!confirmed) {
          return;
        }

        await attributeConfigService.renameAttributeKey(originalKey, editingConfig.attributeKey);
        toast.success(`Ключ переименован во всех объектах`);
      } else {
        await attributeConfigService.createOrUpdateConfig(editingConfig);
        toast.success('Настройки сохранены');
      }
      
      setIsEditDialogOpen(false);
      setEditingConfig(null);
      setOriginalKey(null);
      loadConfigs();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Ошибка сохранения');
    }
  };

  const getPropertiesCount = async () => {
    try {
      const properties = await propertyService.getProperties();
      return properties.length;
    } catch {
      return 0;
    }
  };

  const handleDelete = async (attributeKey: string) => {
    if (!confirm('Удалить настройку атрибута?')) return;

    try {
      await attributeConfigService.deleteConfig(attributeKey);
      toast.success('Настройка удалена');
      loadConfigs();
    } catch (error) {
      console.error('Error deleting config:', error);
      toast.error('Ошибка удаления');
    }
  };

  const handleToggleVisibility = async (config: AttributeConfig) => {
    try {
      await attributeConfigService.updateConfig({
        attributeKey: config.attributeKey,
        visibleInTable: !config.visibleInTable
      });
      loadConfigs();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Ошибка изменения видимости');
    }
  };

  const handleTogglePopup = async (config: AttributeConfig) => {
    try {
      await attributeConfigService.updateConfig({
        attributeKey: config.attributeKey,
        visibleInPopup: !config.visibleInPopup
      });
      loadConfigs();
    } catch (error) {
      console.error('Error toggling popup:', error);
      toast.error('Ошибка изменения popup');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('handleDragEnd called', { active: active.id, over: over?.id });

    if (!over || active.id === over.id) {
      console.log('No move needed');
      return;
    }

    const oldIndex = configs.findIndex((c) => String(c.id) === active.id);
    const newIndex = configs.findIndex((c) => String(c.id) === over.id);
    
    console.log('Move from', oldIndex, 'to', newIndex);

    const newConfigs = arrayMove(configs, oldIndex, newIndex);
    
    setConfigs(newConfigs);

    const updates = newConfigs.map((config, index) => ({
      attributeKey: config.attributeKey,
      displayOrder: index + 1
    }));
    
    console.log('Sending updates:', updates);

    try {
      await attributeConfigService.batchUpdateOrder(updates);
      toast.success('Порядок атрибутов обновлён');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Ошибка обновления порядка');
      loadConfigs();
    }
  };

  const openEditDialog = (config?: AttributeConfig) => {
    setEditingConfig(config || {
      attributeKey: '',
      displayName: '',
      displayOrder: configs.length + 1,
      visibleInTable: false,
      visibleInPopup: false,
      visibleRoles: ['admin']
    });
    setOriginalKey(config?.attributeKey || null);
    setIsEditDialogOpen(true);
  };

  const handleSyncFromDatabase = async () => {
    setIsSyncing(true);
    try {
      const properties = await propertyService.getProperties();
      const allAttributes = new Set<string>();
      
      properties.forEach(property => {
        if (property.attributes) {
          Object.keys(property.attributes).forEach(key => {
            if (key !== 'geometry_name') {
              allAttributes.add(key);
            }
          });
        }
      });

      const existingKeys = new Set(configs.map(c => c.attributeKey));
      let createdCount = 0;

      for (const attributeKey of allAttributes) {
        if (!existingKeys.has(attributeKey)) {
          await attributeConfigService.createOrUpdateConfig({
            attributeKey,
            displayName: attributeKey.charAt(0).toUpperCase() + attributeKey.slice(1).replace(/_/g, ' '),
            displayOrder: configs.length + createdCount + 1,
            visibleInTable: false,
            visibleInPopup: false,
            visibleRoles: ['admin', 'user']
          });
          createdCount++;
        }
      }

      if (createdCount > 0) {
        toast.success(`Добавлено ${createdCount} новых атрибутов`);
        loadConfigs();
      } else {
        toast.info('Все атрибуты уже настроены');
      }
    } catch (error) {
      console.error('Error syncing attributes:', error);
      toast.error('Ошибка синхронизации атрибутов');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/30 backdrop-blur">
        <div className="container mx-auto px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin')}
              >
                <Icon name="ArrowLeft" size={20} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Icon name="Settings" className="text-primary" size={28} />
                  Настройки атрибутов
                </h1>
                <p className="text-sm text-muted-foreground">Управление отображением атрибутов объектов</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleSyncFromDatabase}
                variant="outline"
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                    Синхронизация...
                  </>
                ) : (
                  <>
                    <Icon name="RefreshCw" size={16} className="mr-2" />
                    Синхронизировать из БД
                  </>
                )}
              </Button>
              <Button onClick={() => openEditDialog()}>
                <Icon name="Plus" size={16} className="mr-2" />
                Добавить атрибут
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-6 py-6">
        <div className="grid gap-4 mb-6">
          <AttributeInstructionCard />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Настроенные атрибуты ({configs.length})</CardTitle>
            <CardDescription>Перетащите строки для изменения порядка</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Icon name="Loader2" className="animate-spin text-primary" size={32} />
              </div>
            ) : configs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Settings" className="mx-auto mb-4 opacity-20" size={48} />
                <p>Нет настроенных атрибутов</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead className="w-[60px]">#</TableHead>
                      <TableHead>Ключ (латиница)</TableHead>
                      <TableHead>Отображаемое имя</TableHead>
                      <TableHead>В таблице</TableHead>
                      <TableHead>В popup</TableHead>
                      <TableHead>Роли</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext
                      items={configs.map(c => String(c.id))}
                      strategy={verticalListSortingStrategy}
                    >
                      {configs.map((config, index) => (
                        <AttributeSortableRow
                          key={config.id}
                          config={config}
                          index={index}
                          handleToggleVisibility={handleToggleVisibility}
                          handleTogglePopup={handleTogglePopup}
                          openEditDialog={openEditDialog}
                          handleDelete={handleDelete}
                        />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </div>

      <AttributeEditDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingConfig={editingConfig}
        originalKey={originalKey}
        onConfigChange={setEditingConfig}
        onSave={handleSave}
      />
    </div>
  );
};

export default AttributeSettings;