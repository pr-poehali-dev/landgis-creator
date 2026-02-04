import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { DisplayConfig } from '@/services/displayConfigService';

interface AddPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (property: PropertyFormData) => Promise<void>;
}

export interface PropertyFormData {
  title: string;
  type: 'land' | 'commercial' | 'residential';
  price: number;
  area: number;
  location: string;
  coordinates: [number, number];
  segment: 'premium' | 'standard' | 'economy';
  status: 'available' | 'reserved' | 'sold';
  boundary?: Array<[number, number]>;
  attributes?: Record<string, any>;
}

const AddPropertyDialog = ({ open, onOpenChange, onAdd }: AddPropertyDialogProps) => {
  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    type: 'land',
    price: 0,
    area: 0,
    location: '',
    coordinates: [55.751244, 37.618423],
    segment: 'standard',
    status: 'available',
    boundary: undefined,
    attributes: {}
  });
  const [kmlFile, setKmlFile] = useState<File | null>(null);
  const [isParsingKml, setIsParsingKml] = useState(false);
  const [attributeConfigs, setAttributeConfigs] = useState<DisplayConfig[]>([]);

  useEffect(() => {
    if (open) {
      loadAttributeConfigs();
    }
  }, [open]);

  const loadAttributeConfigs = () => {
    const saved = localStorage.getItem('attributeConfigs');
    if (saved) {
      try {
        const configsMap: Record<string, DisplayConfig> = JSON.parse(saved);
        const configsArray = Object.values(configsMap)
          .filter(config => config.enabled)
          .sort((a, b) => a.displayOrder - b.displayOrder);
        setAttributeConfigs(configsArray);
        
        const initialAttributes: Record<string, any> = {};
        configsArray.forEach(config => {
          const key = config.originalKey || config.configKey;
          if (config.formatType === 'toggle' || config.formatType === 'boolean') {
            initialAttributes[key] = false;
          } else if (config.formatType === 'number' || config.formatType === 'money') {
            initialAttributes[key] = 0;
          } else if (config.formatType === 'multiselect') {
            initialAttributes[key] = JSON.stringify([]);
          } else {
            initialAttributes[key] = '';
          }
        });
        setFormData(prev => ({ ...prev, attributes: initialAttributes }));
      } catch (error) {
        console.error('Error loading attribute configs:', error);
      }
    }
  };

  const parseKmlFile = async (file: File) => {
    setIsParsingKml(true);
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      
      const coordinates = xmlDoc.getElementsByTagName('coordinates')[0]?.textContent?.trim();
      
      if (!coordinates) {
        toast.error('Не удалось найти координаты в KML файле');
        return;
      }

      const coords = coordinates
        .split(/\s+/)
        .map(coord => {
          const [lon, lat] = coord.split(',').map(Number);
          return [lat, lon] as [number, number];
        })
        .filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));

      if (coords.length < 3) {
        toast.error('KML должен содержать минимум 3 точки');
        return;
      }

      const centerLat = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
      const centerLon = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;

      setFormData(prev => ({
        ...prev,
        boundary: coords,
        coordinates: [centerLat, centerLon]
      }));

      toast.success(`Загружена граница из ${coords.length} точек`);
    } catch (error) {
      console.error('Ошибка парсинга KML:', error);
      toast.error('Ошибка чтения KML файла');
    } finally {
      setIsParsingKml(false);
    }
  };

  const handleKmlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.kml')) {
        toast.error('Выберите файл формата KML');
        return;
      }
      setKmlFile(file);
      parseKmlFile(file);
    }
  };

  const handleAttributeChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [key]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.location || formData.price <= 0 || formData.area <= 0) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    try {
      await onAdd(formData);
      onOpenChange(false);

      setFormData({
        title: '',
        type: 'land',
        price: 0,
        area: 0,
        location: '',
        coordinates: [55.751244, 37.618423],
        segment: 'standard',
        status: 'available',
        boundary: undefined,
        attributes: {}
      });
      setKmlFile(null);
    } catch (error) {
      console.error('Failed to add property:', error);
    }
  };

  const renderAttributeField = (config: DisplayConfig) => {
    const key = config.originalKey || config.configKey;
    const value = formData.attributes?.[key] || '';

    const shouldShow = () => {
      if (!config.conditionalDisplay) return true;
      const dependsOnKey = config.conditionalDisplay.dependsOn;
      const showWhen = config.conditionalDisplay.showWhen;
      const dependValue = formData.attributes?.[dependsOnKey];
      
      if (Array.isArray(showWhen)) {
        return showWhen.includes(String(dependValue));
      }
      return String(dependValue) === String(showWhen);
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
              onChange={(e) => handleAttributeChange(key, e.target.value)}
              className="min-h-[80px]"
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
              type="number"
              value={value}
              onChange={(e) => handleAttributeChange(key, parseFloat(e.target.value) || 0)}
            />
          </div>
        );

      case 'money':
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key} className="text-sm font-medium">
              {config.displayName}
            </Label>
            <div className="relative">
              <Input
                id={key}
                type="number"
                value={value}
                onChange={(e) => handleAttributeChange(key, parseFloat(e.target.value) || 0)}
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
            <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
              {config.displayName}
            </Label>
            <Button
              type="button"
              variant={value ? "default" : "outline"}
              size="sm"
              onClick={() => handleAttributeChange(key, !value)}
              className="h-8"
            >
              {value ? (config.formatOptions?.trueLabel || 'Да') : (config.formatOptions?.falseLabel || 'Нет')}
            </Button>
          </div>
        );

      case 'select':
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key} className="text-sm font-medium">
              {config.displayName}
            </Label>
            <Select value={value} onValueChange={(val) => handleAttributeChange(key, val)}>
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
          handleAttributeChange(key, JSON.stringify(newValues));
        };

        const removeMultiselectOption = (option: string) => {
          const newValues = selectedValues.filter(v => v !== option);
          handleAttributeChange(key, JSON.stringify(newValues));
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

      case 'date':
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key} className="text-sm font-medium">
              {config.displayName}
            </Label>
            <Input
              id={key}
              type="date"
              value={value}
              onChange={(e) => handleAttributeChange(key, e.target.value)}
            />
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
              onChange={(e) => handleAttributeChange(key, e.target.value)}
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 px-6">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="Plus" className="text-primary" size={18} />
            </div>
            Добавить объект недвижимости
          </DialogTitle>
          <DialogDescription>
            Заполните информацию о новом объекте. Все поля обязательны для заполнения.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-4 px-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <Icon name="FileText" size={16} />
                Название объекта
              </Label>
              <Input
                id="title"
                placeholder="Например: Участок в центре города"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="flex items-center gap-2">
                  <Icon name="Building" size={16} />
                  Тип объекта
                </Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="land">Земля</SelectItem>
                    <SelectItem value="commercial">Коммерция</SelectItem>
                    <SelectItem value="residential">Жильё</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="segment" className="flex items-center gap-2">
                  <Icon name="Tag" size={16} />
                  Сегмент
                </Label>
                <Select value={formData.segment} onValueChange={(value: any) => setFormData({ ...formData, segment: value })}>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <Icon name="MapPin" size={16} />
                Адрес
              </Label>
              <Input
                id="location"
                placeholder="Например: ул. Ленина, 15"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kml" className="flex items-center gap-2">
                <Icon name="MapPin" size={16} />
                Границы участка (KML файл)
              </Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="kml"
                    type="file"
                    accept=".kml"
                    onChange={handleKmlUpload}
                    disabled={isParsingKml}
                    className="cursor-pointer"
                  />
                </div>
                {kmlFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setKmlFile(null);
                      setFormData(prev => ({ ...prev, boundary: undefined }));
                    }}
                    disabled={isParsingKml}
                  >
                    <Icon name="X" size={16} />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Опционально: загрузите KML файл с границами участка для отображения на карте
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="flex items-center gap-2">
                  <Icon name="DollarSign" size={16} />
                  Цена (₽)
                </Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="1500000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area" className="flex items-center gap-2">
                  <Icon name="Maximize" size={16} />
                  Площадь (м²)
                </Label>
                <Input
                  id="area"
                  type="number"
                  placeholder="500"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat" className="flex items-center gap-2">
                  <Icon name="MapPin" size={16} />
                  Широта
                </Label>
                <Input
                  id="lat"
                  type="number"
                  step="0.000001"
                  placeholder="55.751244"
                  value={formData.coordinates[0]}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    coordinates: [parseFloat(e.target.value) || 0, formData.coordinates[1]] 
                  })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lon" className="flex items-center gap-2">
                  <Icon name="MapPin" size={16} />
                  Долгота
                </Label>
                <Input
                  id="lon"
                  type="number"
                  step="0.000001"
                  placeholder="37.618423"
                  value={formData.coordinates[1]}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    coordinates: [formData.coordinates[0], parseFloat(e.target.value) || 0] 
                  })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="flex items-center gap-2">
                <Icon name="CheckCircle" size={16} />
                Статус
              </Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Доступно</SelectItem>
                  <SelectItem value="reserved">Резерв</SelectItem>
                  <SelectItem value="sold">Продано</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {attributeConfigs.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Icon name="List" size={16} />
                  Дополнительные атрибуты
                </h3>
                <div className="space-y-4">
                  {attributeConfigs.map(config => renderAttributeField(config))}
                </div>
              </div>
            )}
          </div>
        </form>

        <DialogFooter className="flex-shrink-0 border-t pt-4 px-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} className="gap-2">
            <Icon name="Plus" size={16} />
            Добавить объект
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPropertyDialog;