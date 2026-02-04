import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PropertyFormData } from './types';

interface BasicFieldsSectionProps {
  formData: PropertyFormData;
  onFieldChange: (field: keyof PropertyFormData, value: any) => void;
}

export const BasicFieldsSection = ({ formData, onFieldChange }: BasicFieldsSectionProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          Название
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
          placeholder="Например: Участок в центре города"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type" className="text-sm font-medium">
          Тип объекта
        </Label>
        <Select value={formData.type} onValueChange={(val) => onFieldChange('type', val)}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="land">Земельный участок</SelectItem>
            <SelectItem value="commercial">Коммерческая</SelectItem>
            <SelectItem value="residential">Жилая</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price" className="text-sm font-medium">
            Цена, ₽
          </Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => onFieldChange('price', parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="area" className="text-sm font-medium">
            Площадь, га
          </Label>
          <Input
            id="area"
            type="number"
            step="0.01"
            value={formData.area}
            onChange={(e) => onFieldChange('area', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="text-sm font-medium">
          Адрес
        </Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => onFieldChange('location', e.target.value)}
          placeholder="Например: Москва, ул. Тверская, д. 1"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="segment" className="text-sm font-medium">
          Сегмент
        </Label>
        <Select value={formData.segment} onValueChange={(val) => onFieldChange('segment', val)}>
          <SelectTrigger id="segment">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="premium">Премиум</SelectItem>
            <SelectItem value="standard">Стандарт</SelectItem>
            <SelectItem value="economy">Эконом</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status" className="text-sm font-medium">
          Статус
        </Label>
        <Select value={formData.status} onValueChange={(val) => onFieldChange('status', val)}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Доступен</SelectItem>
            <SelectItem value="reserved">Забронирован</SelectItem>
            <SelectItem value="sold">Продан</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
};
