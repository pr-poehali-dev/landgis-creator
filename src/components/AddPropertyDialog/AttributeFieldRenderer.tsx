import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { DisplayConfig } from '@/services/displayConfigService';

interface AttributeFieldRendererProps {
  config: DisplayConfig;
  value: any;
  formData: any;
  onAttributeChange: (key: string, value: any) => void;
}

export const AttributeFieldRenderer = ({ 
  config, 
  value, 
  formData, 
  onAttributeChange 
}: AttributeFieldRendererProps) => {
  const key = config.originalKey || config.configKey;

  const shouldShow = () => {
    if (!config.conditionalDisplay) return true;
    const dependsOnKey = config.conditionalDisplay.dependsOn;
    const showWhen = config.conditionalDisplay.showWhen;
    const dependValue = formData.attributes?.[dependsOnKey];
    
    const normalizeValue = (val: any): string => {
      if (val === true || val === 'true') return 'да';
      if (val === false || val === 'false') return 'нет';
      return String(val).toLowerCase();
    };
    
    if (Array.isArray(showWhen)) {
      return showWhen.some(when => normalizeValue(dependValue) === normalizeValue(when));
    }
    return normalizeValue(dependValue) === normalizeValue(showWhen);
  };

  if (!shouldShow()) return null;

  switch (config.formatType) {
    case 'textarea':
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-sm font-medium">
            {config.displayName}
          </Label>
          <Textarea
            id={key}
            value={value}
            onChange={(e) => {
              onAttributeChange(key, e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            className="min-h-[80px] resize-none overflow-hidden"
          />
        </div>
      );

    case 'number':
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-sm font-medium">
            {config.displayName}
          </Label>
          <Input
            id={key}
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => {
              const val = e.target.value.replace(',', '.');
              if (val === '' || val === '0' || /^0?\.\d*$/.test(val) || /^\d+\.?\d*$/.test(val)) {
                onAttributeChange(key, val === '' ? 0 : val);
              }
            }}
          />
        </div>
      );

    case 'money':
      const formatMoneyDisplay = (val: any): string => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num) || num === 0) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      };

      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-sm font-medium">
            {config.displayName}
          </Label>
          <div className="relative">
            <Input
              id={key}
              type="text"
              inputMode="numeric"
              value={formatMoneyDisplay(value)}
              onChange={(e) => {
                const raw = e.target.value.replace(/\s/g, '');
                if (raw === '' || /^\d+$/.test(raw)) {
                  onAttributeChange(key, raw === '' ? 0 : parseInt(raw));
                }
              }}
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₽</span>
          </div>
        </div>
      );

    case 'toggle':
    case 'boolean':
      return (
        <div key={key} className="flex items-center justify-between py-2 border-b border-border">
          <Label htmlFor={key} className="text-sm font-medium">
            {config.displayName}
          </Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={value ? "default" : "outline"}
              size="sm"
              onClick={() => onAttributeChange(key, true)}
              className="min-w-[60px]"
            >
              Да
            </Button>
            <Button
              type="button"
              variant={!value ? "default" : "outline"}
              size="sm"
              onClick={() => onAttributeChange(key, false)}
              className="min-w-[60px]"
            >
              Нет
            </Button>
          </div>
        </div>
      );

    case 'select':
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-sm font-medium">
            {config.displayName}
          </Label>
          <Select value={value} onValueChange={(val) => onAttributeChange(key, val)}>
            <SelectTrigger id={key}>
              <SelectValue placeholder="Выберите значение" />
            </SelectTrigger>
            <SelectContent>
              {config.formatOptions?.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'multiselect':
      const parseMultiselectValue = (val: any): string[] => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string' && val) {
          try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        return [];
      };

      const selectedValues = parseMultiselectValue(value);
      const options = config.formatOptions?.options || [];

      const toggleMultiselectOption = (option: string) => {
        const newValues = selectedValues.includes(option)
          ? selectedValues.filter(v => v !== option)
          : [...selectedValues, option];
        onAttributeChange(key, JSON.stringify(newValues));
      };

      const removeMultiselectOption = (option: string) => {
        const newValues = selectedValues.filter(v => v !== option);
        onAttributeChange(key, JSON.stringify(newValues));
      };

      return (
        <div key={key} className="space-y-2">
          <Label className="text-sm font-medium">
            {config.displayName}
          </Label>
          <div className="space-y-2">
            {selectedValues.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedValues.map(val => (
                  <Badge key={val} variant="secondary" className="flex items-center gap-1">
                    {val}
                    <button
                      type="button"
                      onClick={() => removeMultiselectOption(val)}
                      className="ml-1 hover:text-destructive"
                    >
                      <Icon name="X" size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <Select value="" onValueChange={toggleMultiselectOption}>
              <SelectTrigger>
                <SelectValue placeholder="Добавить значение..." />
              </SelectTrigger>
              <SelectContent>
                {options.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    <div className="flex items-center gap-2">
                      {selectedValues.includes(option) && <Icon name="Check" size={14} />}
                      {option}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    default:
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-sm font-medium">
            {config.displayName}
          </Label>
          <Input
            id={key}
            type="text"
            value={value}
            onChange={(e) => onAttributeChange(key, e.target.value)}
          />
        </div>
      );
  }
};