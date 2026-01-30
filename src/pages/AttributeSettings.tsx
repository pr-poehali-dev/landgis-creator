import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { attributeConfigService, AttributeConfig } from '@/services/attributeConfigService';
import { propertyService } from '@/services/propertyService';

const AttributeSettings = () => {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<AttributeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Partial<AttributeConfig> | null>(null);
  const [originalKey, setOriginalKey] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

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
      // Если ключ изменился, нужно переименовать во всех объектах
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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex === null || draggedIndex === index) return;

    const newConfigs = [...configs];
    const draggedItem = newConfigs[draggedIndex];
    newConfigs.splice(draggedIndex, 1);
    newConfigs.splice(index, 0, draggedItem);
    
    setConfigs(newConfigs);
    setDraggedIndex(index);
  };

  const handleDragEnd = async (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const updates = configs.map((config, index) => ({
      attributeKey: config.attributeKey,
      displayOrder: index + 1
    }));

    try {
      await attributeConfigService.batchUpdateOrder(updates);
      toast.success('Порядок атрибутов обновлён');
      setDraggedIndex(null);
      loadConfigs();
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
          <Card>
            <CardHeader>
              <CardTitle>Инструкция</CardTitle>
              <CardDescription>Как работают настройки атрибутов</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• <strong>Синхронизировать из БД</strong> — автоматически найти все атрибуты из загруженных объектов</p>
              <p>• <strong>Название (латиница)</strong> — ключ атрибута из GeoJSON файла</p>
              <p>• <strong>Отображаемое имя</strong> — название, которое увидят пользователи</p>
              <p>• <strong>Перетаскивание строк</strong> — измените порядок отображения атрибутов</p>
              <p>• <strong>Видимость в таблице</strong> — показывать ли атрибут в основной таблице</p>
              <p>• <strong>Роли</strong> — для каких пользователей доступен атрибут (admin/user)</p>
            </CardContent>
          </Card>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead className="w-[60px]">#</TableHead>
                    <TableHead>Ключ (латиница)</TableHead>
                    <TableHead>Отображаемое имя</TableHead>
                    <TableHead>В таблице</TableHead>
                    <TableHead>Роли</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config, index) => (
                    <TableRow
                      key={config.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className="cursor-move hover:bg-muted/50"
                    >
                      <TableCell>
                        <Icon name="GripVertical" size={16} className="text-muted-foreground" />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{config.displayOrder}</TableCell>
                      <TableCell className="font-mono text-sm">{config.attributeKey}</TableCell>
                      <TableCell className="font-medium">{config.displayName}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleVisibility(config)}
                        >
                          {config.visibleInTable ? (
                            <Icon name="Eye" size={16} className="text-green-400" />
                          ) : (
                            <Icon name="EyeOff" size={16} className="text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {config.visibleRoles.map(role => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(config)}
                          >
                            <Icon name="Pencil" size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(config.attributeKey)}
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingConfig?.id ? 'Редактировать атрибут' : 'Добавить атрибут'}
            </DialogTitle>
            <DialogDescription>
              Настройте отображение атрибута из GeoJSON
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="attributeKey">Ключ атрибута (латиница)</Label>
              <Input
                id="attributeKey"
                value={editingConfig?.attributeKey || ''}
                onChange={(e) => setEditingConfig({ ...editingConfig, attributeKey: e.target.value })}
                placeholder="name"
              />
              {originalKey && originalKey !== editingConfig?.attributeKey && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <Icon name="AlertTriangle" size={12} />
                  Изменение ключа переименует его во всех объектах БД
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Отображаемое имя</Label>
              <Input
                id="displayName"
                value={editingConfig?.displayName || ''}
                onChange={(e) => setEditingConfig({ ...editingConfig, displayName: e.target.value })}
                placeholder="Название"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="visibleInTable"
                checked={editingConfig?.visibleInTable || false}
                onChange={(e) => setEditingConfig({ ...editingConfig, visibleInTable: e.target.checked })}
                className="w-4 h-4 cursor-pointer"
              />
              <Label htmlFor="visibleInTable" className="cursor-pointer">
                Показывать в основной таблице
              </Label>
            </div>
            <div className="space-y-2">
              <Label>Доступ для ролей</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={editingConfig?.visibleRoles?.includes('admin') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const roles = editingConfig?.visibleRoles || [];
                    setEditingConfig({
                      ...editingConfig,
                      visibleRoles: roles.includes('admin') 
                        ? roles.filter(r => r !== 'admin')
                        : [...roles, 'admin']
                    });
                  }}
                >
                  Admin
                </Button>
                <Button
                  type="button"
                  variant={editingConfig?.visibleRoles?.includes('user') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const roles = editingConfig?.visibleRoles || [];
                    setEditingConfig({
                      ...editingConfig,
                      visibleRoles: roles.includes('user')
                        ? roles.filter(r => r !== 'user')
                        : [...roles, 'user']
                    });
                  }}
                >
                  User
                </Button>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttributeSettings;