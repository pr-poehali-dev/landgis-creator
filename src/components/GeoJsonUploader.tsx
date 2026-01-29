import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { propertyService } from '@/services/propertyService';
import { attributeConfigService } from '@/services/attributeConfigService';
import { GeoJsonData, GeoJsonFeature, FieldMapping } from './geojson/GeoJsonTypes';
import { 
  extractCoordinates, 
  extractBoundary, 
  getPropertyValue,
  normalizePropertyType,
  normalizeSegment,
  normalizeStatus,
  autoDetectMapping
} from './geojson/GeoJsonUtils';
import GeoJsonFieldMapper from './geojson/GeoJsonFieldMapper';

const GeoJsonUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonData | null>(null);
  const [mapping, setMapping] = useState<FieldMapping>({});
  const [isUploading, setIsUploading] = useState(false);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [preview, setPreview] = useState<GeoJsonFeature | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.geojson') && !selectedFile.name.endsWith('.json')) {
      toast.error('Пожалуйста, выберите GeoJSON файл');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data: GeoJsonData = JSON.parse(event.target?.result as string);
        
        console.log('Загружен GeoJSON:', data);
        
        if (!data.type || data.type !== 'FeatureCollection') {
          toast.error('Неверный формат: ожидается FeatureCollection');
          return;
        }
        
        if (!data.features || !Array.isArray(data.features) || data.features.length === 0) {
          toast.error('GeoJSON файл не содержит объектов');
          return;
        }

        setGeoJsonData(data);
        setPreview(data.features[0]);
        
        const fields = Object.keys(data.features[0].properties || {});
        console.log('Найдены поля:', fields);
        setAvailableFields(fields);
        
        const autoMapping = autoDetectMapping(fields);
        console.log('Авто-маппинг:', autoMapping);
        setMapping(autoMapping);
        toast.success(`Загружено ${data.features.length} объектов`);
      } catch (error) {
        toast.error('Ошибка чтения файла. Проверьте формат GeoJSON');
        console.error('Ошибка парсинга GeoJSON:', error);
      }
    };

    reader.onerror = () => {
      toast.error('Ошибка чтения файла');
      console.error('FileReader error');
    };

    reader.readAsText(selectedFile);
  };

  const syncAttributeConfigs = async () => {
    if (!geoJsonData || geoJsonData.features.length === 0) return;

    try {
      const allAttributes = new Set<string>();
      geoJsonData.features.forEach(feature => {
        if (feature.properties) {
          Object.keys(feature.properties).forEach(key => {
            if (key !== 'geometry_name') {
              allAttributes.add(key);
            }
          });
        }
      });

      const existingConfigs = await attributeConfigService.getConfigs();
      const existingKeys = new Set(existingConfigs.map(c => c.attributeKey));

      let createdCount = 0;
      for (const attributeKey of allAttributes) {
        if (!existingKeys.has(attributeKey)) {
          await attributeConfigService.createOrUpdateConfig({
            attributeKey,
            displayName: attributeKey.charAt(0).toUpperCase() + attributeKey.slice(1),
            displayOrder: existingConfigs.length + createdCount + 1,
            visibleInTable: false,
            visibleRoles: ['admin', 'user']
          });
          createdCount++;
        }
      }

      if (createdCount > 0) {
        console.log(`Создано ${createdCount} новых настроек атрибутов`);
      }
    } catch (error) {
      console.error('Ошибка синхронизации атрибутов:', error);
    }
  };

  const handleUpload = async () => {
    if (!geoJsonData || !mapping.title) {
      toast.error('Укажите как минимум поле для названия объекта');
      return;
    }

    console.log('Начало загрузки объектов:', geoJsonData.features.length);
    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      await syncAttributeConfigs();

      for (let i = 0; i < geoJsonData.features.length; i++) {
        const feature = geoJsonData.features[i];
        try {
          const props = feature.properties || {};
          const coordinates = extractCoordinates(feature);
          const boundary = extractBoundary(feature);

          const filteredAttributes = { ...props };
          delete filteredAttributes.geometry_name;
          const mappedFields = Object.values(mapping).filter(Boolean);
          mappedFields.forEach(field => delete filteredAttributes[field as string]);

          const propertyData = {
            title: getPropertyValue(props, mapping.title, `Объект ${i + 1}`),
            type: normalizePropertyType(getPropertyValue(props, mapping.type, 'land')),
            price: Number(getPropertyValue(props, mapping.price, 0)) || 0,
            area: Number(getPropertyValue(props, mapping.area, 0)) || 0,
            location: getPropertyValue(props, mapping.location, 'Не указан'),
            coordinates,
            segment: normalizeSegment(getPropertyValue(props, mapping.segment, 'standard')),
            status: normalizeStatus(getPropertyValue(props, mapping.status, 'available')),
            boundary,
            attributes: filteredAttributes
          };

          console.log(`Создание объекта ${i + 1}:`, propertyData);
          await propertyService.createProperty(propertyData);
          successCount++;
          console.log(`Объект ${i + 1} успешно создан`);
        } catch (error) {
          console.error(`Ошибка при создании объекта ${i + 1}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Успешно загружено: ${successCount} объектов${errorCount > 0 ? `, ошибок: ${errorCount}` : ''}`);
      }
      if (errorCount > 0 && successCount === 0) {
        toast.error(`Не удалось загрузить объекты`);
      }

      setFile(null);
      setGeoJsonData(null);
      setMapping({});
      setAvailableFields([]);
      setPreview(null);
      
    } catch (error) {
      console.error('Критическая ошибка загрузки:', error);
      toast.error('Критическая ошибка при загрузке объектов');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Загрузка GeoJSON</h2>
        <p className="text-muted-foreground text-sm">
          Импортируйте объекты недвижимости из GeoJSON файла
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">Выберите GeoJSON файл</Label>
        <Input
          id="file"
          type="file"
          accept=".geojson,.json"
          onChange={handleFileSelect}
          disabled={isUploading}
        />
        {file && (
          <p className="text-sm text-muted-foreground">
            Файл: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      {geoJsonData && (
        <>
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Icon name="FileJson" className="text-primary" size={20} />
              <span className="font-semibold">Информация о файле</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Тип:</span>
                <Badge variant="secondary" className="ml-2">{geoJsonData.type}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Объектов:</span>
                <Badge variant="secondary" className="ml-2">{geoJsonData.features.length}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Полей:</span>
                <Badge variant="secondary" className="ml-2">{availableFields.length}</Badge>
              </div>
              {preview && preview.geometry && (
                <div>
                  <span className="text-muted-foreground">Геометрия:</span>
                  <Badge variant="secondary" className="ml-2">{preview.geometry.type}</Badge>
                </div>
              )}
            </div>
          </div>

          <GeoJsonFieldMapper
            availableFields={availableFields}
            mapping={mapping}
            onMappingChange={setMapping}
          />

          {preview && (
            <div className="p-4 bg-muted/30 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Icon name="Eye" className="text-primary" size={20} />
                <span className="font-semibold">Превью первого объекта</span>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>Название:</strong> {getPropertyValue(preview.properties, mapping.title, 'Не указано')}</p>
                <p><strong>Тип:</strong> {getPropertyValue(preview.properties, mapping.type, 'Не указано')}</p>
                <p><strong>Цена:</strong> {getPropertyValue(preview.properties, mapping.price, 'Не указано')}</p>
                <p><strong>Площадь:</strong> {getPropertyValue(preview.properties, mapping.area, 'Не указано')}</p>
                <p><strong>Адрес:</strong> {getPropertyValue(preview.properties, mapping.location, 'Не указано')}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-primary hover:underline">
                    Показать все поля ({Object.keys(preview.properties || {}).length})
                  </summary>
                  <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto max-h-60">
                    {JSON.stringify(preview.properties, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={handleUpload}
              disabled={isUploading || !mapping.title}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                  Загрузка... ({geoJsonData.features.length} объектов)
                </>
              ) : (
                <>
                  <Icon name="Upload" size={16} className="mr-2" />
                  Загрузить {geoJsonData.features.length} объектов
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                setFile(null);
                setGeoJsonData(null);
                setMapping({});
                setAvailableFields([]);
                setPreview(null);
              }}
              variant="outline"
              disabled={isUploading}
            >
              Отмена
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default GeoJsonUploader;
