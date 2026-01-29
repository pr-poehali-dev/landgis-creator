import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FieldMapping } from './GeoJsonTypes';

interface GeoJsonFieldMapperProps {
  availableFields: string[];
  mapping: FieldMapping;
  onMappingChange: (mapping: FieldMapping) => void;
}

const GeoJsonFieldMapper = ({ availableFields, mapping, onMappingChange }: GeoJsonFieldMapperProps) => {
  const updateMapping = (key: keyof FieldMapping, value: string) => {
    onMappingChange({ ...mapping, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base">Маппинг полей</h3>
      <p className="text-sm text-muted-foreground">
        Укажите, какие поля из GeoJSON соответствуют полям базы данных
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Название *</Label>
          <Select value={mapping.title || ''} onValueChange={(v) => updateMapping('title', v)}>
            <SelectTrigger id="title">
              <SelectValue placeholder="Выберите поле" />
            </SelectTrigger>
            <SelectContent>
              {availableFields.map(field => (
                <SelectItem key={field} value={field}>{field}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Тип объекта</Label>
          <Select value={mapping.type || ''} onValueChange={(v) => updateMapping('type', v)}>
            <SelectTrigger id="type">
              <SelectValue placeholder="Выберите поле (опционально)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Не указано</SelectItem>
              {availableFields.map(field => (
                <SelectItem key={field} value={field}>{field}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Цена</Label>
          <Select value={mapping.price || ''} onValueChange={(v) => updateMapping('price', v)}>
            <SelectTrigger id="price">
              <SelectValue placeholder="Выберите поле (опционально)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Не указано</SelectItem>
              {availableFields.map(field => (
                <SelectItem key={field} value={field}>{field}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="area">Площадь</Label>
          <Select value={mapping.area || ''} onValueChange={(v) => updateMapping('area', v)}>
            <SelectTrigger id="area">
              <SelectValue placeholder="Выберите поле (опционально)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Не указано</SelectItem>
              {availableFields.map(field => (
                <SelectItem key={field} value={field}>{field}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Адрес</Label>
          <Select value={mapping.location || ''} onValueChange={(v) => updateMapping('location', v)}>
            <SelectTrigger id="location">
              <SelectValue placeholder="Выберите поле (опционально)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Не указано</SelectItem>
              {availableFields.map(field => (
                <SelectItem key={field} value={field}>{field}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="segment">Сегмент</Label>
          <Select value={mapping.segment || ''} onValueChange={(v) => updateMapping('segment', v)}>
            <SelectTrigger id="segment">
              <SelectValue placeholder="Выберите поле (опционально)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Не указано</SelectItem>
              {availableFields.map(field => (
                <SelectItem key={field} value={field}>{field}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Статус</Label>
          <Select value={mapping.status || ''} onValueChange={(v) => updateMapping('status', v)}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Выберите поле (опционально)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Не указано</SelectItem>
              {availableFields.map(field => (
                <SelectItem key={field} value={field}>{field}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default GeoJsonFieldMapper;
