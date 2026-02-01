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
  allConfigs: DisplayConfig[];
  onConfigChange: (index: number, field: keyof DisplayConfig, value: any) => void;
  onMoveConfig: (index: number, direction: 'up' | 'down') => void;
  onToggleEnabled: (index: number) => void;
  onDelete: (index: number) => void;
}

const AttributeConfigItem = ({
  config,
  index,
  totalConfigs,
  allConfigs,
  onConfigChange,
  onMoveConfig,
  onToggleEnabled,
  onDelete
}: AttributeConfigItemProps) => {
  return (
    <div className="border rounded-lg p-3 space-y-3 bg-card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => config.enabled || onToggleEnabled(index)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                config.enabled
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Вкл
            </button>
            <button
              type="button"
              onClick={() => !config.enabled || onToggleEnabled(index)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                !config.enabled
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Выкл
            </button>
          </div>
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
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={() => onDelete(index)}
            title="Удалить атрибут"
          >
            <Icon name="Trash2" size={14} />
          </Button>
        </div>
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground mb-1 block">Тип поля</label>
        <Select
          value={config.formatType || 'text'}
          onValueChange={(value) => {
            onConfigChange(index, 'formatType', value);
            if ((value === 'select' || value === 'multiselect') && (!config.formatOptions?.options || config.formatOptions.options.length === 0)) {
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
            <SelectItem value="multiselect">Множественный выбор</SelectItem>
            <SelectItem value="date">Дата</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(config.formatType === 'select' || config.formatType === 'multiselect') && (
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
        <label className="text-[10px] text-muted-foreground mb-1 block">Условное отображение</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  if (!config.conditionalDisplay) {
                    onConfigChange(index, 'conditionalDisplay', { dependsOn: '', showWhen: '' });
                  }
                }}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  config.conditionalDisplay
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Да
              </button>
              <button
                type="button"
                onClick={() => {
                  if (config.conditionalDisplay) {
                    onConfigChange(index, 'conditionalDisplay', null);
                  }
                }}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  !config.conditionalDisplay
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Нет
              </button>
            </div>
            <span className="text-[11px] text-muted-foreground">Показывать при условии</span>
          </div>
          
          {config.conditionalDisplay && (
            <div className="space-y-2 pl-8">
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Зависит от атрибута</label>
                <Select
                  value={config.conditionalDisplay.dependsOn || ''}
                  onValueChange={(value) => {
                    onConfigChange(index, 'conditionalDisplay', {
                      ...config.conditionalDisplay,
                      dependsOn: value,
                      showWhen: ''
                    });
                  }}
                >
                  <SelectTrigger className="text-xs h-7">
                    <SelectValue placeholder="Выберите атрибут" />
                  </SelectTrigger>
                  <SelectContent>
                    {allConfigs
                      .filter(c => c.configKey !== config.configKey && c.configType === 'attribute')
                      .map(c => (
                        <SelectItem key={c.configKey} value={c.configKey}>
                          {c.displayName} ({c.configKey})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              {config.conditionalDisplay.dependsOn && (() => {
                const parentConfig = allConfigs.find(c => c.configKey === config.conditionalDisplay?.dependsOn);
                const parentOptions = parentConfig?.formatOptions?.options || [];
                
                if (parentConfig?.formatType === 'boolean') {
                  return (
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-0.5 block">Показывать когда</label>
                      <Select
                        value={String(config.conditionalDisplay.showWhen)}
                        onValueChange={(value) => {
                          onConfigChange(index, 'conditionalDisplay', {
                            ...config.conditionalDisplay,
                            showWhen: value
                          });
                        }}
                      >
                        <SelectTrigger className="text-xs h-7">
                          <SelectValue placeholder="Выберите значение" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Да</SelectItem>
                          <SelectItem value="false">Нет</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }
                
                if (parentConfig?.formatType === 'select' && parentOptions.length > 0) {
                  return (
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-0.5 block">Показывать когда</label>
                      <Select
                        value={String(config.conditionalDisplay.showWhen)}
                        onValueChange={(value) => {
                          onConfigChange(index, 'conditionalDisplay', {
                            ...config.conditionalDisplay,
                            showWhen: value
                          });
                        }}
                      >
                        <SelectTrigger className="text-xs h-7">
                          <SelectValue placeholder="Выберите значение" />
                        </SelectTrigger>
                        <SelectContent>
                          {parentOptions.map((opt: string) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }
                
                return (
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">Показывать когда значение равно</label>
                    <Input
                      value={String(config.conditionalDisplay.showWhen || '')}
                      onChange={(e) => {
                        onConfigChange(index, 'conditionalDisplay', {
                          ...config.conditionalDisplay,
                          showWhen: e.target.value
                        });
                      }}
                      className="text-xs h-7"
                      placeholder="Введите значение"
                    />
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

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