import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DisplayConfig } from '@/services/displayConfigService';
import { PropertyFormData } from './AddPropertyDialog/types';
import { KmlUploadSection } from './AddPropertyDialog/KmlUploadSection';
import { BasicFieldsSection } from './AddPropertyDialog/BasicFieldsSection';
import { AttributeFieldRenderer } from './AddPropertyDialog/AttributeFieldRenderer';

interface AddPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (property: PropertyFormData) => Promise<void>;
}

export type { PropertyFormData };

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

  const handleFieldChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-accent">+</span>
            Добавить объект недвижимости
          </DialogTitle>
          <DialogDescription>
            Заполните информацию о новом объекте. Все поля обязательны для заполнения.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground/80">Основная информация</h3>
            
            <BasicFieldsSection 
              formData={formData} 
              onFieldChange={handleFieldChange} 
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground/80">Границы участка</h3>
            
            <KmlUploadSection
              kmlFile={kmlFile}
              isParsingKml={isParsingKml}
              onKmlUpload={handleKmlUpload}
            />
          </div>

          {attributeConfigs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground/80">Дополнительные атрибуты</h3>
              
              {attributeConfigs.map((config) => {
                const key = config.originalKey || config.configKey;
                const value = formData.attributes?.[key] || '';
                
                return (
                  <AttributeFieldRenderer
                    key={key}
                    config={config}
                    value={value}
                    formData={formData}
                    onAttributeChange={handleAttributeChange}
                  />
                );
              })}
            </div>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90">
              Добавить объект
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPropertyDialog;
