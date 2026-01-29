import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

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
    boundary: undefined
  });
  const [kmlFile, setKmlFile] = useState<File | null>(null);
  const [isParsingKml, setIsParsingKml] = useState(false);

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
        boundary: undefined
      });
      setKmlFile(null);
    } catch (error) {
      console.error('Failed to add property:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
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

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
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
              {formData.boundary && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Icon name="Check" size={12} className="text-green-500" />
                  Загружено {formData.boundary.length} точек границы
                </p>
              )}
              {isParsingKml && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Icon name="Loader2" size={12} className="animate-spin" />
                  Обработка файла...
                </p>
              )}
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
                  placeholder="15000000"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  required
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area" className="flex items-center gap-2">
                  <Icon name="Maximize2" size={16} />
                  Площадь (м²)
                </Label>
                <Input
                  id="area"
                  type="number"
                  placeholder="500"
                  value={formData.area || ''}
                  onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                  required
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude" className="flex items-center gap-2">
                  <Icon name="Navigation" size={16} />
                  Широта
                </Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  placeholder="55.751244"
                  value={formData.coordinates[0]}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    coordinates: [Number(e.target.value), formData.coordinates[1]]
                  })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude" className="flex items-center gap-2">
                  <Icon name="Navigation" size={16} />
                  Долгота
                </Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  placeholder="37.618423"
                  value={formData.coordinates[1]}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    coordinates: [formData.coordinates[0], Number(e.target.value)]
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
                  <SelectItem value="available">Доступен</SelectItem>
                  <SelectItem value="reserved">Резерв</SelectItem>
                  <SelectItem value="sold">Продан</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Отмена
            </Button>
            <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить объект
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPropertyDialog;