import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { DisplayConfig } from '@/services/displayConfigService';

interface ConfigHeaderProps {
  config: DisplayConfig;
  index: number;
  totalConfigs: number;
  onConfigChange: (index: number, field: keyof DisplayConfig, value: any) => void;
  onMoveConfig: (index: number, direction: 'up' | 'down') => void;
  onToggleEnabled: (index: number) => void;
  onDelete: (index: number) => void;
}

export const ConfigHeader = ({
  config,
  index,
  totalConfigs,
  onConfigChange,
  onMoveConfig,
  onToggleEnabled,
  onDelete
}: ConfigHeaderProps) => {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 flex-1">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => !config.enabled && onToggleEnabled(index)}
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
            onClick={() => config.enabled && onToggleEnabled(index)}
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
  );
};
