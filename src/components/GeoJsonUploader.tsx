import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { propertyService } from '@/services/propertyService';

interface GeoJsonFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][] | number[] | number[][][][];
  };
  properties: Record<string, any>;
}

interface GeoJsonData {
  type: string;
  features: GeoJsonFeature[];
}

interface FieldMapping {
  title?: string;
  type?: string;
  price?: string;
  area?: string;
  location?: string;
  segment?: string;
  status?: string;
}

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
        
        const autoMapping: FieldMapping = {};
        fields.forEach(field => {
          const lower = field.toLowerCase();
          if (lower.includes('name') || lower.includes('title') || lower.includes('название')) {
            autoMapping.title = field;
          } else if (lower.includes('price') || lower.includes('цена') || lower.includes('стоимость')) {
            autoMapping.price = field;
          } else if (lower.includes('area') || lower.includes('площадь')) {
            autoMapping.area = field;
          } else if (lower.includes('location') || lower.includes('address') || lower.includes('адрес')) {
            autoMapping.location = field;
          }
        });
        
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

  const isWebMercator = (coords: number[]): boolean => {
    return Math.abs(coords[0]) > 180 || Math.abs(coords[1]) > 90;
  };

  const webMercatorToWGS84 = (x: number, y: number): [number, number] => {
    const lon = (x / 20037508.34) * 180;
    let lat = (y / 20037508.34) * 180;
    lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
    return [lon, lat];
  };

  const normalizeCoordinates = (coords: number[]): [number, number] => {
    const x = coords[0];
    const y = coords[1];
    
    if (isWebMercator([x, y])) {
      return webMercatorToWGS84(x, y);
    }
    
    return [x, y];
  };

  const extractCoordinates = (feature: GeoJsonFeature): [number, number] => {
    const { geometry } = feature;
    
    if (!geometry || !geometry.coordinates) {
      console.warn('Геометрия отсутствует, используются координаты по умолчанию');
      return [55.751244, 37.618423];
    }
    
    if (geometry.type === 'Point') {
      const coords = geometry.coordinates as number[];
      return normalizeCoordinates(coords);
    }
    
    if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
      const coords = geometry.type === 'Polygon' 
        ? (geometry.coordinates as number[][][])[0]
        : (geometry.coordinates as number[][][][])[0][0];
      
      if (!coords || coords.length === 0) {
        console.warn('Пустые координаты полигона');
        return [55.751244, 37.618423];
      }
      
      const sumX = coords.reduce((sum, c) => sum + c[0], 0);
      const sumY = coords.reduce((sum, c) => sum + c[1], 0);
      const centerX = sumX / coords.length;
      const centerY = sumY / coords.length;
      
      return normalizeCoordinates([centerX, centerY]);
    }
    
    console.warn('Неизвестный тип геометрии:', geometry.type);
    return [55.751244, 37.618423];
  };

  const extractBoundary = (feature: GeoJsonFeature): Array<[number, number]> | undefined => {
    const { geometry } = feature;
    
    if (geometry.type === 'Polygon') {
      const coords = (geometry.coordinates as number[][][])[0];
      return coords.map(c => normalizeCoordinates(c));
    }
    
    if (geometry.type === 'MultiPolygon') {
      const coords = (geometry.coordinates as number[][][][])[0][0];
      return coords.map(c => normalizeCoordinates(c));
    }
    
    return undefined;
  };

  const getPropertyValue = (properties: Record<string, any>, fieldName?: string, defaultValue: any = '') => {
    if (!fieldName) return defaultValue;
    return properties[fieldName] ?? defaultValue;
  };

  const normalizePropertyType = (value: any): 'land' | 'commercial' | 'residential' => {
    const str = String(value || 'land').toLowerCase();
    if (str === 'commercial' || str === 'коммерция') return 'commercial';
    if (str === 'residential' || str === 'жилье' || str === 'жильё') return 'residential';
    return 'land';
  };

  const normalizeSegment = (value: any): 'premium' | 'standard' | 'economy' => {
    const str = String(value || 'standard').toLowerCase();
    if (str === 'premium' || str === 'премиум') return 'premium';
    if (str === 'economy' || str === 'эконом') return 'economy';
    return 'standard';
  };

  const normalizeStatus = (value: any): 'available' | 'reserved' | 'sold' => {
    const str = String(value || 'available').toLowerCase();
    if (str === 'reserved' || str === 'резерв') return 'reserved';
    if (str === 'sold' || str === 'продан' || str === 'продано') return 'sold';
    return 'available';
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
      for (let i = 0; i < geoJsonData.features.length; i++) {
        const feature = geoJsonData.features[i];
        try {
          const props = feature.properties || {};
          const coordinates = extractCoordinates(feature);
          const boundary = extractBoundary(feature);

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
            attributes: props
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

      console.log(`Загрузка завершена: успешно ${successCount}, ошибок ${errorCount}`);

      if (successCount > 0) {
        toast.success(`Загружено ${successCount} объектов${errorCount > 0 ? `, ошибок: ${errorCount}` : ''}`);
        propertyService.invalidateCache();
        await propertyService.getProperties(true);
      }
      
      if (errorCount > 0 && successCount === 0) {
        toast.error(`Не удалось загрузить объекты. Ошибок: ${errorCount}`);
      }

      setFile(null);
      setGeoJsonData(null);
      setMapping({});
      setAvailableFields([]);
      setPreview(null);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
      console.error('Критическая ошибка загрузки:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="geojson-file">Выберите GeoJSON файл</Label>
          <Input
            id="geojson-file"
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
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Объектов в файле:</span>
                <Badge variant="secondary">{geoJsonData.features.length}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Доступные поля: {availableFields.join(', ')}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Icon name="Settings" size={16} />
                Сопоставление полей
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Название объекта *</Label>
                  <Select
                    value={mapping.title}
                    onValueChange={(value) => setMapping({ ...mapping, title: value })}
                  >
                    <SelectTrigger>
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
                  <Label>Тип объекта</Label>
                  <Select
                    value={mapping.type || '__none__'}
                    onValueChange={(value) => setMapping({ ...mapping, type: value === '__none__' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите поле (опционально)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Не указано (land по умолчанию)</SelectItem>
                      {availableFields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Цена</Label>
                  <Select
                    value={mapping.price || '__none__'}
                    onValueChange={(value) => setMapping({ ...mapping, price: value === '__none__' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите поле (опционально)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Не указано (0 по умолчанию)</SelectItem>
                      {availableFields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Площадь</Label>
                  <Select
                    value={mapping.area || '__none__'}
                    onValueChange={(value) => setMapping({ ...mapping, area: value === '__none__' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите поле (опционально)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Не указано (0 по умолчанию)</SelectItem>
                      {availableFields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Адрес/Местоположение</Label>
                  <Select
                    value={mapping.location || '__none__'}
                    onValueChange={(value) => setMapping({ ...mapping, location: value === '__none__' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите поле (опционально)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Не указано</SelectItem>
                      {availableFields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Сегмент</Label>
                  <Select
                    value={mapping.segment || '__none__'}
                    onValueChange={(value) => setMapping({ ...mapping, segment: value === '__none__' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите поле (опционально)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Не указано (standard по умолчанию)</SelectItem>
                      {availableFields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Статус</Label>
                  <Select
                    value={mapping.status || '__none__'}
                    onValueChange={(value) => setMapping({ ...mapping, status: value === '__none__' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите поле (опционально)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Не указано (available по умолчанию)</SelectItem>
                      {availableFields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {preview && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Icon name="Eye" size={16} />
                  Предпросмотр первого объекта
                </h3>
                <div className="p-4 bg-muted/20 rounded-lg text-xs font-mono space-y-1">
                  <div><span className="text-muted-foreground">Название:</span> {getPropertyValue(preview.properties, mapping.title, 'Без названия')}</div>
                  <div><span className="text-muted-foreground">Тип:</span> {getPropertyValue(preview.properties, mapping.type, 'land')}</div>
                  <div><span className="text-muted-foreground">Цена:</span> {getPropertyValue(preview.properties, mapping.price, 0)}</div>
                  <div><span className="text-muted-foreground">Площадь:</span> {getPropertyValue(preview.properties, mapping.area, 0)} м²</div>
                  <div><span className="text-muted-foreground">Адрес:</span> {getPropertyValue(preview.properties, mapping.location, 'Не указан')}</div>
                  <div><span className="text-muted-foreground">Границы:</span> {extractBoundary(preview) ? `${extractBoundary(preview)!.length} точек` : 'Нет'}</div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading || !mapping.title}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Icon name="Upload" className="mr-2" size={16} />
                    Загрузить {geoJsonData.features.length} объектов
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setGeoJsonData(null);
                  setMapping({});
                  setAvailableFields([]);
                  setPreview(null);
                }}
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