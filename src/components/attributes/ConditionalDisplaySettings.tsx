import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DisplayConfig } from '@/services/displayConfigService';

interface ConditionalDisplaySettingsProps {
  config: DisplayConfig;
  index: number;
  allConfigs: DisplayConfig[];
  availableValues: string[];
  onConfigChange: (index: number, field: keyof DisplayConfig, value: any) => void;
}

export const ConditionalDisplaySettings = ({
  config,
  index,
  allConfigs,
  availableValues,
  onConfigChange
}: ConditionalDisplaySettingsProps) => {
  return (
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
              
              if (parentConfig?.formatType === 'boolean' || parentConfig?.formatType === 'toggle') {
                return (
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">Показывать когда</label>
                    <Select
                      value={Array.isArray(config.conditionalDisplay.showWhen) 
                        ? config.conditionalDisplay.showWhen[0] 
                        : String(config.conditionalDisplay.showWhen || '')}
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
                        <SelectItem value="Да">Да</SelectItem>
                        <SelectItem value="Нет">Нет</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                );
              }
              
              if (parentConfig?.formatType === 'select' && parentOptions.length > 0) {
                const selectedValues = Array.isArray(config.conditionalDisplay.showWhen) 
                  ? config.conditionalDisplay.showWhen 
                  : config.conditionalDisplay.showWhen 
                    ? [String(config.conditionalDisplay.showWhen)]
                    : [];

                return (
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">Показывать когда (можно выбрать несколько)</label>
                    <div className="border border-border rounded text-xs p-1.5 max-h-32 overflow-y-auto space-y-1">
                      {parentOptions.map((opt: string) => (
                        <label key={opt} className="flex items-center gap-1.5 px-1 py-0.5 hover:bg-accent rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedValues.includes(opt)}
                            onChange={(e) => {
                              const newValues = e.target.checked
                                ? [...selectedValues, opt]
                                : selectedValues.filter(v => v !== opt);
                              
                              onConfigChange(index, 'conditionalDisplay', {
                                ...config.conditionalDisplay,
                                showWhen: newValues.length === 1 ? newValues[0] : newValues
                              });
                            }}
                            className="rounded h-3 w-3"
                          />
                          <span className="text-xs">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              }
              
              const selectedValues = Array.isArray(config.conditionalDisplay.showWhen) 
                ? config.conditionalDisplay.showWhen 
                : config.conditionalDisplay.showWhen 
                  ? [String(config.conditionalDisplay.showWhen)]
                  : [];

              if (availableValues.length > 0) {
                return (
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">Показывать когда значение равно (найдено {availableValues.length} значений)</label>
                    <div className="border border-border rounded text-xs p-1.5 max-h-32 overflow-y-auto space-y-1">
                      {availableValues.map((val: string) => (
                        <label key={val} className="flex items-center gap-1.5 px-1 py-0.5 hover:bg-accent rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedValues.includes(val)}
                            onChange={(e) => {
                              const newValues = e.target.checked
                                ? [...selectedValues, val]
                                : selectedValues.filter(v => v !== val);
                              
                              onConfigChange(index, 'conditionalDisplay', {
                                ...config.conditionalDisplay,
                                showWhen: newValues.length === 1 ? newValues[0] : newValues
                              });
                            }}
                            className="rounded h-3 w-3"
                          />
                          <span className="text-xs">{val}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div>
                  <label className="text-[10px] text-muted-foreground mb-0.5 block">Показывать когда значение равно</label>
                  <Input
                    value={Array.isArray(config.conditionalDisplay.showWhen) 
                      ? config.conditionalDisplay.showWhen.join(', ')
                      : String(config.conditionalDisplay.showWhen || '')}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      const values = inputValue.includes(',') 
                        ? inputValue.split(',').map(v => v.trim()).filter(v => v)
                        : inputValue;
                      
                      onConfigChange(index, 'conditionalDisplay', {
                        ...config.conditionalDisplay,
                        showWhen: values
                      });
                    }}
                    className="text-xs h-7"
                    placeholder="Значение или несколько через запятую"
                  />
                  <p className="text-[9px] text-muted-foreground mt-0.5">Нет значений в объектах. Можно ввести вручную через запятую</p>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
