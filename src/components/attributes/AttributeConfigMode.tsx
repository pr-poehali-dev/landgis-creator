import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { DisplayConfig } from '@/services/displayConfigService';
import AttributeConfigItem from '@/components/attributes/AttributeConfigItem';
import AddElementDialog from '@/components/AddElementDialog';

interface AttributeConfigModeProps {
  configs: DisplayConfig[];
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (open: boolean) => void;
  onCancel: () => void;
  onSave: () => void;
  onCleanup: () => void;
  onConfigChange: (index: number, field: keyof DisplayConfig, value: any) => void;
  onMoveConfig: (index: number, direction: 'up' | 'down') => void;
  onToggleEnabled: (index: number) => void;
  onDelete: (index: number) => void;
  onAdd: (type: string) => void;
}

const AttributeConfigMode = ({
  configs,
  isAddDialogOpen,
  setIsAddDialogOpen,
  onCancel,
  onSave,
  onCleanup,
  onConfigChange,
  onMoveConfig,
  onToggleEnabled,
  onDelete,
  onAdd
}: AttributeConfigModeProps) => {
  return (
    <>
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h3 className="text-sm font-semibold">Настройка атрибутов</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCleanup}
            title="Очистить атрибуты, которых больше нет в базе"
          >
            <Icon name="Trash2" size={16} className="mr-2" />
            Очистка
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            <Icon name="X" size={16} className="mr-2" />
            Отмена
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
          >
            <Icon name="Check" size={16} className="mr-2" />
            Сохранить
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {configs.map((config, index) => (
          <AttributeConfigItem
            key={config.id}
            config={config}
            index={index}
            totalConfigs={configs.length}
            allConfigs={configs}
            onConfigChange={onConfigChange}
            onMoveConfig={onMoveConfig}
            onToggleEnabled={onToggleEnabled}
            onDelete={onDelete}
          />
        ))}

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 mt-2"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Icon name="Plus" size={16} />
          Добавить элемент
        </Button>
        
        <AddElementDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAdd={onAdd}
        />
      </div>
    </>
  );
};

export default AttributeConfigMode;
