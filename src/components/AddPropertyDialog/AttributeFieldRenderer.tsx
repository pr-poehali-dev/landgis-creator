import { useState } from 'react';
import { format, parse } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';
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
    let dependValue = formData.attributes?.[dependsOnKey];
    
    console.log('[Conditional Display Debug]', {
      field: config.displayName,
      dependsOn: dependsOnKey,
      showWhen,
      rawDependValue: dependValue,
      dependValueType: typeof dependValue
    });
    
    if (dependValue === undefined || dependValue === null || dependValue === '') {
      console.log('  → Hidden: dependValue is empty');
      return false;
    }
    
    // Если dependValue - это JSON-массив в виде строки, распарсим его
    if (typeof dependValue === 'string' && dependValue.startsWith('[')) {
      try {
        const parsed = JSON.parse(dependValue);
        if (Array.isArray(parsed)) {
          dependValue = parsed;
          console.log('  → Parsed JSON array:', dependValue);
        }
      } catch (e) {
        console.log('  → Failed to parse JSON array');
      }
    }
    
    const normalizeValue = (val: any): string => {
      const strVal = String(val).toLowerCase().trim();
      if (val === true || strVal === 'true' || strVal === 'да') return 'да';
      if (val === false || strVal === 'false' || strVal === 'нет') return 'нет';
      return strVal;
    };
    
    // Если зависимое значение - массив, проверяем вхождение любого элемента
    if (Array.isArray(dependValue)) {
      console.log('  → dependValue is array:', dependValue);
      if (Array.isArray(showWhen)) {
        const result = dependValue.some(dv => 
          showWhen.some(when => {
            const match = normalizeValue(dv) === normalizeValue(when);
            console.log(`    Comparing: "${dv}" vs "${when}" = ${match}`);
            return match;
          })
        );
        console.log(`  → Result (array vs array): ${result}`);
        return result;
      }
      const result = dependValue.some(dv => {
        const match = normalizeValue(dv) === normalizeValue(showWhen);
        console.log(`    Comparing: "${dv}" vs "${showWhen}" = ${match}`);
        return match;
      });
      console.log(`  → Result (array vs single): ${result}`);
      return result;
    }
    
    // Если showWhen - массив, проверяем вхождение
    if (Array.isArray(showWhen)) {
      console.log('  → showWhen is array:', showWhen);
      const result = showWhen.some(when => {
        const match = normalizeValue(dependValue) === normalizeValue(when);
        console.log(`    Comparing: "${dependValue}" vs "${when}" = ${match}`);
        return match;
      });
      console.log(`  → Result (single vs array): ${result}`);
      return result;
    }
    
    const result = normalizeValue(dependValue) === normalizeValue(showWhen);
    console.log(`  → Result (single vs single): "${dependValue}" vs "${showWhen}" = ${result}`);
    return result;
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
      const selectValue = value !== null && value !== undefined && value !== '' ? String(value) : undefined;
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-sm font-medium">
            {config.displayName}
          </Label>
          <Select value={selectValue} onValueChange={(val) => onAttributeChange(key, val)}>
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

    case 'date': {
      const parseDate = (val: string | undefined): Date | undefined => {
        if (!val) return undefined;
        try {
          const parsed = parse(val, 'dd.MM.yyyy', new Date());
          if (!isNaN(parsed.getTime())) return parsed;
          const isoDate = new Date(val);
          if (!isNaN(isoDate.getTime())) return isoDate;
        } catch { /* ignore */ }
        return undefined;
      };
      const dateValue = parseDate(value);

      return (
        <DatePickerField
          fieldKey={key}
          label={config.displayName}
          dateValue={dateValue}
          onAttributeChange={onAttributeChange}
        />
      );
    }

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

const DatePickerField = ({
  fieldKey,
  label,
  dateValue,
  onAttributeChange
}: {
  fieldKey: string;
  label: string;
  dateValue: Date | undefined;
  onAttributeChange: (key: string, value: string) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div key={fieldKey} className="space-y-2">
      <Label htmlFor={fieldKey} className="text-sm font-medium">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateValue && "text-muted-foreground"
            )}
          >
            <Icon name="Calendar" size={16} className="mr-2" />
            {dateValue
              ? format(dateValue, 'dd.MM.yyyy', { locale: ru })
              : 'Выберите дату'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={(date) => {
              if (date) {
                onAttributeChange(fieldKey, format(date, 'dd.MM.yyyy'));
              }
              setOpen(false);
            }}
            locale={ru}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};