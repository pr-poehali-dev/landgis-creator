import { useRef, useState } from 'react';
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
  hoveredPropertyId 
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
    onAttributesPanelChange
  });

  // Управление зумом и анимацией
  const { zoomToProperty } = useMapZoom({
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

  const handleGeneratePDF = async () => {
    if (!selectedProperty || !mapInstanceRef.current) {
      toast.error('Не удалось сгенерировать PDF');
      return;
    }

    try {
      toast.info('Генерация PDF-тизера...', { duration: 2000 });
      
      const screenshots = await captureMapScreenshots(mapInstanceRef.current, selectedProperty);
      await generatePropertyPDF(selectedProperty, screenshots);
      
      toast.success('PDF-тизер успешно скачан!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Ошибка при генерации PDF');
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {showAttributesPanel && selectedProperty && (
        <PropertyAttributesPanel
          property={selectedProperty}
          onClose={() => {
            if (onAttributesPanelChange) onAttributesPanelChange(false);
            onSelectProperty(null);
          }}
          userRole={userRole}
          onZoomToProperty={() => zoomToProperty(selectedProperty)}
          onAttributesUpdate={() => {}}
          onGeneratePDF={handleGeneratePDF}
        />
      )}
    </div>
  );
};

export default YandexMap;