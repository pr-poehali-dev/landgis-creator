import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { DisplayConfig } from '@/services/displayConfigService';
import { useState } from 'react';

interface AttributeEditFieldProps {
  value: any;
  config?: DisplayConfig;
  onValueChange: (value: string) => void;
}

export const formatValue = (value: any, formatType?: string, formatOptions?: any): string => {
  if (value === null || value === undefined) return '—';
  
  switch (formatType) {
    case 'money':
      const moneyNum = Number(value);
      if (isNaN(moneyNum)) return String(value);
      return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(moneyNum);
    case 'number':
      const num = Number(value);
      if (isNaN(num)) return String(value);
      return new Intl.NumberFormat('ru-RU').format(num);
    case 'boolean':
      return value ? 'Да' : 'Нет';
    case 'toggle':
      // Проверяем все возможные варианты "истины"
      const isTrueToggle = value === 'true' || value === true || 
                           value === 'Да' || value === 'да' || 
                           String(value).toLowerCase() === 'да' ||
                           String(value).toLowerCase() === (formatOptions?.trueLabel || 'да').toLowerCase();
      
      // Если не истина - то ложь
      return isTrueToggle ? (formatOptions?.trueLabel || 'Да') : (formatOptions?.falseLabel || 'Нет');
    case 'date':
      return new Date(value).toLocaleDateString('ru-RU');
    case 'multiselect':
      if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : '—';
      }
      if (typeof value === 'string') {
        if (value.trim() === '') return '—';
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            return parsed.length > 0 ? parsed.join(', ') : '—';
          }
        } catch {
          // Если не JSON, возвращаем как есть
        }
        return value.includes(',') ? value : value;
      }
      return String(value);
    case 'button':
      try {
        const buttonData = typeof value === 'string' ? JSON.parse(value) : value;
        return buttonData?.text || 'Кнопка';
      } catch {
        return 'Кнопка';
      }
    default:
      // Дефолтная обработка для обычных полей - тоже проверяем на JSON-массив
      if (typeof value === 'string' && (value.startsWith('[') || value.includes(','))) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            return parsed.join(', ');
          }
        } catch {
          if (value.includes(',')) {
            return value.split(',').map(v => v.trim()).join(', ');
          }
        }
      }
      return String(value);
  }
};

const MultiselectField = ({ value, config, onValueChange }: AttributeEditFieldProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const options = config?.formatOptions?.options || [];
  
  const parseValue = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val) {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [val];
      } catch {
        return val.split(',').map(v => v.trim());
      }
    }
    return [];
  };
  
  const selectedValues = parseValue(value);
  
  const toggleOption = (option: string) => {
    const newValues = selectedValues.includes(option)
      ? selectedValues.filter(v => v !== option)
      : [...selectedValues, option];
    onValueChange(JSON.stringify(newValues));
  };
  
  const removeOption = (option: string) => {
    const newValues = selectedValues.filter(v => v !== option);
    onValueChange(JSON.stringify(newValues));
  };
  
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedValues.map(val => (
          <Badge key={val} variant="secondary" className="flex items-center gap-1">
            {val}
            <button
              onClick={() => removeOption(val)}
              className="ml-1 hover:text-destructive"
            >
              <Icon name="X" size={12} />
            </button>
          </Badge>
        ))}
      </div>
      <Select open={isOpen} onOpenChange={setIsOpen} value="" onValueChange={toggleOption}>
        <SelectTrigger className="text-sm">
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
  );
};

const AttributeEditField = ({ value, config, onValueChange }: AttributeEditFieldProps) => {
  const formatType = config?.formatType || 'text';
  
  console.log('🎨 AttributeEditField render:', {
    configKey: config?.configKey,
    displayName: config?.displayName,
    formatType,
    hasConfig: !!config,
    value: typeof value === 'object' ? JSON.stringify(value) : value
  });
  
  switch (formatType) {
    case 'textarea':
      return (
        <Textarea
          value={value !== null && value !== undefined ? String(value) : ''}
          onChange={(e) => onValueChange(e.target.value)}
          className="text-sm min-h-[80px]"
        />
      );
    
    case 'money':
      const moneyValue = value !== null && value !== undefined ? String(value).replace(/\s/g, '') : '';
      const formattedMoney = moneyValue ? new Intl.NumberFormat('ru-RU').format(Number(moneyValue)) : '';
      
      return (
        <Input
          type="text"
          value={formattedMoney}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/\s/g, '');
            if (cleaned === '' || /^\d+$/.test(cleaned)) {
              onValueChange(cleaned);
            }
          }}
          className="text-sm"
          placeholder="0"
        />
      );
    
    case 'number':
      return (
        <Input
          type="number"
          value={value !== null && value !== undefined ? String(value) : ''}
          onChange={(e) => onValueChange(e.target.value)}
          className="text-sm"
        />
      );
    
    case 'boolean':
      const boolCheckedValue = (value === 'true' || value === true || value === 'Да') ? 'true' : 'false';
      
      return (
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`bool-${Math.random()}`}
              value="true"
              checked={boolCheckedValue === 'true'}
              onChange={() => onValueChange('true')}
              className="w-4 h-4 cursor-pointer"
            />
            <span className="text-sm">Да</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`bool-${Math.random()}`}
              value="false"
              checked={boolCheckedValue === 'false'}
              onChange={() => onValueChange('false')}
              className="w-4 h-4 cursor-pointer"
            />
            <span className="text-sm">Нет</span>
          </label>
        </div>
      );
    
    case 'toggle':
      const trueLabel = config?.formatOptions?.trueLabel || 'Да';
      const falseLabel = config?.formatOptions?.falseLabel || 'Нет';
      
      // Нормализуем значение
      const normalizeToggleValue = (val: any): boolean => {
        if (val === null || val === undefined || val === '') return false;
        if (typeof val === 'boolean') return val;
        const strVal = String(val).toLowerCase().trim();
        return strVal === 'true' || strVal === 'да' || strVal === trueLabel.toLowerCase();
      };
      
      const isTrueValue = normalizeToggleValue(value);
      const toggleCheckedValue = isTrueValue ? 'true' : 'false';
      const radioName = `toggle-${config?.configKey || Math.random()}`;
      
      return (
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={radioName}
              value="true"
              checked={toggleCheckedValue === 'true'}
              onChange={() => {
                console.log('Toggle onChange TRUE:', config?.configKey, 'saving as: true');
                onValueChange('true');
              }}
              className="w-4 h-4 cursor-pointer"
            />
            <span className="text-sm">{trueLabel}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={radioName}
              value="false"
              checked={toggleCheckedValue === 'false'}
              onChange={() => {
                console.log('Toggle onChange FALSE:', config?.configKey, 'saving as: false');
                onValueChange('false');
              }}
              className="w-4 h-4 cursor-pointer"
            />
            <span className="text-sm">{falseLabel}</span>
          </label>
        </div>
      );
    
    case 'select':
      const options = config?.formatOptions?.options || [];
      const selectValue = value !== null && value !== undefined && value !== '' ? String(value) : undefined;
      return (
        <Select
          value={selectValue}
          onValueChange={(val) => onValueChange(val)}
        >
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Выберите значение" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option: string) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    
    case 'multiselect':
      return <MultiselectField value={value} config={config} onValueChange={onValueChange} />;
    
    case 'button':
      const buttonActions = config?.formatOptions?.actions || ['Добавить в корзину', 'Добавить в избранное'];
      const buttonText = config?.formatOptions?.text || 'Кнопка';
      
      // value содержит объект { text: string, action: string }
      let buttonValue = { text: buttonText, action: buttonActions[0] };
      try {
        if (typeof value === 'string' && value) {
          buttonValue = JSON.parse(value);
        } else if (typeof value === 'object' && value !== null) {
          buttonValue = value;
        }
      } catch {
        // Используем дефолтные значения
      }
      
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Текст кнопки</label>
            <Input
              value={buttonValue.text || ''}
              onChange={(e) => {
                const newValue = { ...buttonValue, text: e.target.value };
                onValueChange(JSON.stringify(newValue));
              }}
              placeholder="Введите текст"
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Действие</label>
            <Select
              value={buttonValue.action || buttonActions[0]}
              onValueChange={(action) => {
                const newValue = { ...buttonValue, action };
                onValueChange(JSON.stringify(newValue));
              }}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {buttonActions.map((action: string) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    
    case 'date':
      return (
        <Input
          type="date"
          value={value !== null && value !== undefined ? String(value) : ''}
          onChange={(e) => onValueChange(e.target.value)}
          className="text-sm"
        />
      );
    
    default:
      return (
        <Input
          value={value !== null && value !== undefined ? String(value) : ''}
          onChange={(e) => onValueChange(e.target.value)}
          className="text-sm"
        />
      );
  }
};

export default AttributeEditField;