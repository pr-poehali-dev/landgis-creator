import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { DisplayConfig } from '@/services/displayConfigService';

interface FormatTypeSelectorProps {
  config: DisplayConfig;
  index: number;
  onConfigChange: (index: number, field: keyof DisplayConfig, value: any) => void;
}

export const FormatTypeSelector = ({
  config,
  index,
  onConfigChange
}: FormatTypeSelectorProps) => {
  return (
    <>
      <div>
        <label className="text-[10px] text-muted-foreground mb-1 block">Тип поля</label>
        <Select
          value={config.formatType || 'text'}
          onValueChange={(value) => {
            onConfigChange(index, 'formatType', value);
            if ((value === 'select' || value === 'multiselect') && (!config.formatOptions?.options || config.formatOptions.options.length === 0)) {
              onConfigChange(index, 'formatOptions', { options: [''] });
            }
            if (value === 'toggle' && !config.formatOptions?.trueLabel) {
              onConfigChange(index, 'formatOptions', { trueLabel: 'Да', falseLabel: 'Нет' });
            }
            if (value === 'button' && !config.formatOptions?.actions) {
              onConfigChange(index, 'formatOptions', { 
                text: 'Кнопка',
                actions: ['Добавить в корзину', 'Добавить в избранное'] 
              });
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
            <SelectItem value="toggle">Переключатель (Да/Нет)</SelectItem>
            <SelectItem value="select">Выпадающий список</SelectItem>
            <SelectItem value="multiselect">Множественный выбор</SelectItem>
            <SelectItem value="date">Дата</SelectItem>
            <SelectItem value="link">Ссылка</SelectItem>
            <SelectItem value="button">Кнопка</SelectItem>
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

      {config.formatType === 'button' && (
        <div className="space-y-2">
          <label className="text-[10px] text-muted-foreground mb-1 block">Настройки кнопки</label>
          <div>
            <label className="text-[10px] text-muted-foreground mb-0.5 block">Текст по умолчанию</label>
            <Input
              value={config.formatOptions?.text || 'Кнопка'}
              onChange={(e) => {
                onConfigChange(index, 'formatOptions', {
                  ...config.formatOptions,
                  text: e.target.value
                });
              }}
              className="text-xs h-7"
              placeholder="Текст кнопки"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Доступные действия</label>
            <div className="space-y-1.5">
              {(config.formatOptions?.actions || []).map((action, actIndex) => (
                <div key={actIndex} className="flex items-center gap-1.5">
                  <Input
                    value={action || ''}
                    onChange={(e) => {
                      const newActions = [...(config.formatOptions?.actions || [])];
                      newActions[actIndex] = e.target.value;
                      onConfigChange(index, 'formatOptions', { 
                        ...config.formatOptions,
                        actions: newActions 
                      });
                    }}
                    className="text-xs h-7 flex-1"
                    placeholder={`Действие ${actIndex + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-400 hover:text-red-300"
                    onClick={() => {
                      const newActions = (config.formatOptions?.actions || []).filter((_, i) => i !== actIndex);
                      onConfigChange(index, 'formatOptions', { 
                        ...config.formatOptions,
                        actions: newActions 
                      });
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
                  const newActions = [...(config.formatOptions?.actions || []), ''];
                  onConfigChange(index, 'formatOptions', { 
                    ...config.formatOptions,
                    actions: newActions 
                  });
                }}
              >
                <Icon name="Plus" size={12} className="mr-1" />
                Добавить действие
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};