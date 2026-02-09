import { useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';
import PropertyAttributesPanel from '@/components/map/PropertyAttributesPanel';
import { useMapInitialization } from '@/components/map/hooks/useMapInitialization';
import { useMapObjects } from '@/components/map/hooks/useMapObjects';
import { useMapZoom } from '@/components/map/hooks/useMapZoom';
import { captureMapScreenshots, generatePropertyPDF } from '@/utils/pdfGenerator';

interface Property {
  id: number;
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

interface YandexMapProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (property: Property | null) => void;
  mapType: 'scheme' | 'hybrid';
  userRole?: string;
  showAttributesPanel?: boolean;
  onAttributesPanelChange?: (show: boolean) => void;
  hoveredPropertyId?: number | null;
  logoUrl?: string;
  companyName?: string;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

const YandexMap = ({ 
  properties, 
  selectedProperty, 
  onSelectProperty, 
  mapType, 
  userRole = 'user1', 
  showAttributesPanel = false, 
  onAttributesPanelChange,
  hoveredPropertyId,
  logoUrl,
  companyName
}: YandexMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const polygonsRef = useRef<any[]>([]);
  const placeMarksRef = useRef<any[]>([]);
  const centroidsRef = useRef<any[]>([]);
  const previousSelectedRef = useRef<Property | null>(null);
  const isAnimatingRef = useRef(false);
  const initialViewRef = useRef<{ center: [number, number], zoom: number } | null>(null);
  const hasPannedRef = useRef(false);

  const [isMapReady, setIsMapReady] = useState(false);

  // Инициализация карты
  useMapInitialization({
    mapRef,
    mapInstanceRef,
    clustererRef,
    polygonsRef,
    placeMarksRef,
    initialViewRef,
    setIsMapReady
  });

  // Управление зумом и анимацией
  const { zoomToProperty, zoomToPropertyDetail, zoomOut } = useMapZoom({
    isMapReady,
    properties,
    selectedProperty,
    hoveredPropertyId: hoveredPropertyId ?? null,
    mapType,
    mapRef,
    mapInstanceRef,
    polygonsRef,
    centroidsRef,
    previousSelectedRef,
    isAnimatingRef,
    initialViewRef
  });

  // Управление объектами на карте
  useMapObjects({
    isMapReady,
    properties,
    selectedProperty,
    mapInstanceRef,
    clustererRef,
    polygonsRef,
    placeMarksRef,
    centroidsRef,
    initialViewRef,
    isAnimatingRef,
    onSelectProperty,
    onAttributesPanelChange,
    zoomToPropertyDetail
  });



  // Обработчик resize для корректной адаптации карты
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !mapRef.current) return;

    const map = mapInstanceRef.current;
    const container = mapRef.current;
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (mapInstanceRef.current && mapRef.current) {
          const width = mapRef.current.offsetWidth;
          const height = mapRef.current.offsetHeight;
          
          const mapContainer = mapInstanceRef.current.container.getElement();
          if (mapContainer) {
            mapContainer.style.width = `${width}px`;
            mapContainer.style.height = `${height}px`;
          }
          
          mapInstanceRef.current.container.fitToViewport();
        }
      }, 100);
    };

    // ResizeObserver для отслеживания изменений размера контейнера
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Дополнительно слушаем window resize
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [isMapReady]);

  // Обработчик клика на карту для закрытия панели атрибутов
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    
    const handleMapClick = (e: any) => {
      // Проверяем, что клик был по самой карте, а не по объекту
      const target = e.get('target');
      if (!target || target === map) {
        if (showAttributesPanel) {
          handleClosePanel();
        }
      }
    };

    map.events.add('click', handleMapClick);

    return () => {
      map.events.remove('click', handleMapClick);
    };
  }, [isMapReady, showAttributesPanel]);

  const handleGeneratePDF = async () => {
    if (!selectedProperty || !mapInstanceRef.current) {
      toast.error('Не удалось сгенерировать PDF');
      return;
    }

    try {
      toast.info('Генерация PDF-тизера...', { duration: 2000 });
      
      const screenshots = await captureMapScreenshots(mapInstanceRef.current, selectedProperty);
      await generatePropertyPDF(selectedProperty, screenshots, logoUrl, companyName);
      
      toast.success('PDF-тизер успешно скачан!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Ошибка при генерации PDF');
    }
  };

  const handleClosePanel = () => {
    // Плавная анимация отдаления при закрытии панели через единую функцию
    if (selectedProperty) {
      zoomOut();
    }
    
    // Сбрасываем флаг смещения при закрытии панели
    hasPannedRef.current = false;
    
    if (onAttributesPanelChange) onAttributesPanelChange(false);
    onSelectProperty(null);
  };

  const handlePanelOpened = () => {
    // Смещаем карту при открытии панели атрибутов только один раз
    if (!mapInstanceRef.current || !selectedProperty || hasPannedRef.current) return;
    
    // Устанавливаем флаг, что смещение уже произведено
    hasPannedRef.current = true;
    
    const map = mapInstanceRef.current;
    const currentCenter = map.getCenter();
    const isMobile = window.innerWidth < 768;
    
    // Получаем текущий центр в пикселях
    const projection = map.options.get('projection');
    const zoom = map.getZoom();
    const pixelCenter = projection.toGlobalPixels(currentCenter, zoom);
    
    // На мобильных смещаем вниз (чтобы участок оказался выше панели), на десктопе - вправо (чтобы участок сдвинулся влево от панели)
    const offsetX = isMobile ? 0 : 180;  // Вправо на 180px для десктопа
    const offsetY = isMobile ? 120 : 0;  // Вниз на 120px для мобильных
    
    // Новый центр в пикселях
    const newPixelCenter = [
      pixelCenter[0] + offsetX,
      pixelCenter[1] + offsetY
    ];
    
    // Конвертируем обратно в географические координаты
    const newCenter = projection.fromGlobalPixels(newPixelCenter, zoom);
    
    // Плавно перемещаем карту
    map.panTo(newCenter, {
      delay: 0,
      duration: 400,
      checkZoomRange: true
    });
  };

  const handleReturnToOverview = () => {
    if (!mapInstanceRef.current || properties.length === 0) return;

    // Сначала закрываем панель
    if (onAttributesPanelChange) onAttributesPanelChange(false);
    onSelectProperty(null);

    // Затем анимируем возврат к общему виду всех участков
    const bounds = properties.reduce((acc, prop) => {
      if (prop.boundary && prop.boundary.length >= 3) {
        prop.boundary.forEach(coord => {
          if (!acc) {
            acc = [[coord[0], coord[1]], [coord[0], coord[1]]];
          } else {
            acc[0][0] = Math.min(acc[0][0], coord[0]);
            acc[0][1] = Math.min(acc[0][1], coord[1]);
            acc[1][0] = Math.max(acc[1][0], coord[0]);
            acc[1][1] = Math.max(acc[1][1], coord[1]);
          }
        });
      } else {
        const [lat, lon] = prop.coordinates;
        if (!acc) {
          acc = [[lat, lon], [lat, lon]];
        } else {
          acc[0][0] = Math.min(acc[0][0], lat);
          acc[0][1] = Math.min(acc[0][1], lon);
          acc[1][0] = Math.max(acc[1][0], lat);
          acc[1][1] = Math.max(acc[1][1], lon);
        }
      }
      return acc;
    }, null as [[number, number], [number, number]] | null);

    if (bounds) {
      isAnimatingRef.current = true;
      const options: any = {
        checkZoomRange: true,
        zoomMargin: 100,
        duration: 1000
      };
      
      mapInstanceRef.current.setBounds(bounds, options).then(() => {
        isAnimatingRef.current = false;
      });
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {showAttributesPanel && selectedProperty && (
        <PropertyAttributesPanel
          property={selectedProperty}
          onClose={handleClosePanel}
          userRole={userRole}
          onZoomToProperty={() => zoomToProperty(selectedProperty)}
          onAttributesUpdate={(updatedAttributes) => {
            // Обновляем selectedProperty с новыми атрибутами
            const updatedProperty = { ...selectedProperty, attributes: updatedAttributes };
            onSelectProperty(updatedProperty);
          }}
          onGeneratePDF={handleGeneratePDF}
          onReturnToOverview={handleReturnToOverview}
          onPanelOpened={handlePanelOpened}
        />
      )}
    </div>
  );
};

export default YandexMap;