import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { AttributeConfig } from '@/services/attributeConfigService';

interface AttributeEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingConfig: Partial<AttributeConfig> | null;
  originalKey: string | null;
  onConfigChange: (config: Partial<AttributeConfig>) => void;
  onSave: () => void;
}

export const AttributeEditDialog = ({
  isOpen,
  onOpenChange,
  editingConfig,
  originalKey,
  onConfigChange,
  onSave,
}: AttributeEditDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
              onChange={(e) => onConfigChange({ ...editingConfig, attributeKey: e.target.value })}
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
              onChange={(e) => onConfigChange({ ...editingConfig, displayName: e.target.value })}
              placeholder="Название"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="visibleInTable"
              checked={editingConfig?.visibleInTable || false}
              onChange={(e) => onConfigChange({ ...editingConfig, visibleInTable: e.target.checked })}
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
                  onConfigChange({
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
                  onConfigChange({
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={onSave}>
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
