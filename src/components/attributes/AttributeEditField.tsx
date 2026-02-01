import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DisplayConfig } from '@/services/displayConfigService';

interface AttributeEditFieldProps {
  value: any;
  config?: DisplayConfig;
  onValueChange: (value: string) => void;
}

export const formatValue = (value: any, formatType?: string): string => {
  if (value === null || value === undefined) return '—';
  
  switch (formatType) {
    case 'money':
      return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(Number(value));
    case 'number':
      return new Intl.NumberFormat('ru-RU').format(Number(value));
    case 'boolean':
      return value ? 'Да' : 'Нет';
    case 'date':
      return new Date(value).toLocaleDateString('ru-RU');
    default:
      return String(value);
  }
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
    
    case 'number':
    case 'money':
      return (
        <Input
          type="number"
          value={value !== null && value !== undefined ? String(value) : ''}
          onChange={(e) => onValueChange(e.target.value)}
          className="text-sm"
        />
      );
    
    case 'boolean':
      return (
        <Switch
          checked={Boolean(value)}
          onCheckedChange={(checked) => onValueChange(String(checked))}
        />
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
