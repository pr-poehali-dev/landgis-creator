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
import { DisplayConfig } from '@/services/displayConfigService';

interface ConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingConfig: DisplayConfig | null;
  onConfigChange: (config: DisplayConfig) => void;
  onSave: () => void;
}

const ConfigDialog = ({
  open,
  onOpenChange,
  editingConfig,
  onConfigChange,
  onSave,
}: ConfigDialogProps) => {
  if (!editingConfig) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingConfig?.id ? 'Редактировать элемент' : 'Создать элемент'}
          </DialogTitle>
          <DialogDescription>
            Настройте параметры отображения элемента
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Тип элемента</Label>
            <Select
              value={editingConfig.configType}
              onValueChange={(value: any) =>
                onConfigChange({ ...editingConfig, configType: value })
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
                onConfigChange({ ...editingConfig, configKey: e.target.value })
              }
              placeholder="name"
            />
          </div>

          <div>
            <Label>Отображаемое название</Label>
            <Input
              value={editingConfig.displayName}
              onChange={(e) =>
                onConfigChange({ ...editingConfig, displayName: e.target.value })
              }
              placeholder="Название"
            />
          </div>

          {editingConfig.configType === 'attribute' && (
            <>
              <div>
                <Label>Формат атрибута</Label>
                <Select
                  value={editingConfig.formatType || 'text'}
                  onValueChange={(value: any) =>
                    onConfigChange({ ...editingConfig, formatType: value, formatOptions: value === 'select' ? { options: [] } : null })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Текст</SelectItem>
                    <SelectItem value="textarea">Многострочный текст</SelectItem>
                    <SelectItem value="number">Число</SelectItem>
                    <SelectItem value="money">Денежная сумма</SelectItem>
                    <SelectItem value="boolean">Да/Нет</SelectItem>
                    <SelectItem value="select">Выпадающий список</SelectItem>
                    <SelectItem value="date">Дата</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingConfig.formatType === 'select' && (
                <div>
                  <Label>Варианты для списка (через запятую)</Label>
                  <Input
                    value={editingConfig.formatOptions?.options?.join(', ') || ''}
                    onChange={(e) => {
                      const options = e.target.value.split(',').map(o => o.trim()).filter(Boolean);
                      onConfigChange({ 
                        ...editingConfig, 
                        formatOptions: { options } 
                      });
                    }}
                    placeholder="Опция 1, Опция 2, Опция 3"
                  />
                </div>
              )}
            </>
          )}

          <div className="flex items-center gap-2">
            <Switch
              checked={editingConfig.enabled}
              onCheckedChange={(checked) =>
                onConfigChange({ ...editingConfig, enabled: checked })
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
                      onConfigChange({ ...editingConfig, visibleRoles: roles });
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{role}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={onSave}>
            {editingConfig?.id ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigDialog;
