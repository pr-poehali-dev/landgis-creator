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
    </>
  );
};