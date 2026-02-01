import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { DisplayConfig } from '@/services/displayConfigService';

interface AttributeConfigItemProps {
  config: DisplayConfig;
  index: number;
  totalConfigs: number;
  onConfigChange: (index: number, field: keyof DisplayConfig, value: any) => void;
  onMoveConfig: (index: number, direction: 'up' | 'down') => void;
  onToggleEnabled: (index: number) => void;
}

const AttributeConfigItem = ({
  config,
  index,
  totalConfigs,
  onConfigChange,
  onMoveConfig,
  onToggleEnabled
}: AttributeConfigItemProps) => {
  return (
    <div className="border rounded-lg p-3 space-y-3 bg-card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Switch
            checked={config.enabled}
            onCheckedChange={() => onToggleEnabled(index)}
          />
          <div className="flex-1 grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground mb-0.5 block">
                Ключ
                {config.originalKey && config.originalKey !== config.configKey && (
                  <span className="ml-1 text-orange-400" title={`Будет переименован из "${config.originalKey}"`}>
                    (было: {config.originalKey})
                  </span>
                )}
              </label>
              <Input
                value={config.configKey}
                onChange={(e) => onConfigChange(index, 'configKey', e.target.value)}
                className="text-xs h-7"
                placeholder="key_name"
                title="Ключ атрибута в базе данных"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-0.5 block">Название</label>
              <Input
                value={config.displayName}
                onChange={(e) => onConfigChange(index, 'displayName', e.target.value)}
                className="text-xs h-7"
                placeholder="Отображаемое имя"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onMoveConfig(index, 'up')}
            disabled={index === 0}
          >
            <Icon name="ChevronUp" size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onMoveConfig(index, 'down')}
            disabled={index === totalConfigs - 1}
          >
            <Icon name="ChevronDown" size={14} />
          </Button>
        </div>
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground mb-1 block">Тип поля</label>
        <Select
          value={config.formatType || 'text'}
          onValueChange={(value) => {
            onConfigChange(index, 'formatType', value);
            if (value === 'select' && (!config.formatOptions?.options || config.formatOptions.options.length === 0)) {
              onConfigChange(index, 'formatOptions', { options: [''] });
            }
          }}
        >
          <SelectTrigger className="text-xs h-7">
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

      {config.formatType === 'select' && (
        <div className="space-y-2">
          <label className="text-[10px] text-muted-foreground mb-1 block">Варианты списка</label>
          <div className="space-y-1.5">
            {(config.formatOptions?.options || []).map((option, optIndex) => (
              <div key={optIndex} className="flex items-center gap-1.5">
                <Input
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...(config.formatOptions?.options || [])];
                    newOptions[optIndex] = e.target.value;
                    onConfigChange(index, 'formatOptions', { options: newOptions });
                  }}
                  className="text-xs h-7 flex-1"
                  placeholder={`Вариант ${optIndex + 1}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-400 hover:text-red-300"
                  onClick={() => {
                    const newOptions = (config.formatOptions?.options || []).filter((_, i) => i !== optIndex);
                    onConfigChange(index, 'formatOptions', { options: newOptions });
                  }}
                >
                  <Icon name="X" size={12} />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={() => {
                const newOptions = [...(config.formatOptions?.options || []), ''];
                onConfigChange(index, 'formatOptions', { options: newOptions });
              }}
            >
              <Icon name="Plus" size={12} className="mr-1" />
              Добавить вариант
            </Button>
          </div>
        </div>
      )}

      <div>
        <label className="text-[10px] text-muted-foreground mb-1 block">Доступно для ролей</label>
        <div className="flex flex-wrap gap-1.5">
          {['admin', 'user1', 'user2', 'user3', 'user4'].map((role) => (
            <label key={role} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-border hover:bg-accent cursor-pointer">
              <input
                type="checkbox"
                checked={config.visibleRoles.includes(role)}
                onChange={(e) => {
                  const roles = e.target.checked
                    ? [...config.visibleRoles, role]
                    : config.visibleRoles.filter(r => r !== role);
                  onConfigChange(index, 'visibleRoles', roles);
                }}
                className="rounded h-3 w-3"
              />
              <span>{role === 'admin' ? 'Админ' : role === 'user1' ? 'Free' : role === 'user2' ? 'Light' : role === 'user3' ? 'Max' : 'VIP'}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttributeConfigItem;
