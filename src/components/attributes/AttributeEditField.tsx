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
      const isTrue = value === 'true' || value === true || value === 'Да';
      const isFalseValue = value === 'false' || value === false || value === 'Нет' || value === '' || value === null || value === undefined;
      const actualValue = isFalseValue ? false : isTrue;
      return actualValue ? (formatOptions?.trueLabel || 'Да') : (formatOptions?.falseLabel || 'Нет');
    case 'date':
      return new Date(value).toLocaleDateString('ru-RU');
    case 'multiselect':
      if (Array.isArray(value)) return value.join(', ');
      if (typeof value === 'string' && value.includes(',')) return value;
      return String(value);
    default:
      return String(value);
  }
};

const MultiselectField = ({ value, config, onValueChange }: AttributeEditFieldProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const options = config?.formatOptions?.options || [];
  
  const selectedValues = Array.isArray(value) 
    ? value 
    : (typeof value === 'string' && value ? value.split(',').map(v => v.trim()) : []);
  
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
      const isTrueBool = value === 'true' || value === true || value === 'Да';
      const isFalseBool = value === 'false' || value === false || value === 'Нет' || value === '' || value === null || value === undefined;
      const currentBoolValue = isFalseBool ? 'false' : (isTrueBool ? 'true' : 'false');
      
      return (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onValueChange('true')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              currentBoolValue === 'true'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Да
          </button>
          <button
            type="button"
            onClick={() => onValueChange('false')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              currentBoolValue === 'false'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Нет
          </button>
        </div>
      );
    
    case 'toggle':
      const trueLabel = config?.formatOptions?.trueLabel || 'Да';
      const falseLabel = config?.formatOptions?.falseLabel || 'Нет';
      const isTrueToggle = value === 'true' || value === true || value === trueLabel;
      const isFalseToggle = value === 'false' || value === false || value === falseLabel || value === '' || value === null || value === undefined;
      const currentValue = isFalseToggle ? 'false' : (isTrueToggle ? 'true' : 'false');
      
      return (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onValueChange('true')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              currentValue === 'true'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {trueLabel}
          </button>
          <button
            type="button"
            onClick={() => onValueChange('false')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              currentValue === 'false'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {falseLabel}
          </button>
        </div>
      );
    
    case 'select':
      const options = config?.formatOptions?.options || [];
      return (
        <Select
          value={value !== null && value !== undefined ? String(value) : ''}
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