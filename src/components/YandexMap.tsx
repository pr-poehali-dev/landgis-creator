import { useRef, useState } from 'react';
import PropertyMiniCard from '@/components/map/PropertyMiniCard';
import PropertyAttributesPanel from '@/components/map/PropertyAttributesPanel';
import { useMapInitialization } from '@/components/map/hooks/useMapInitialization';
import { useMapObjects } from '@/components/map/hooks/useMapObjects';
import { useMapZoom } from '@/components/map/hooks/useMapZoom';

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
  const [showMiniCard, setShowMiniCard] = useState(false);
  const [cardPosition, setCardPosition] = useState<{ top?: string; left?: string; right?: string; bottom?: string }>({});

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
    setShowMiniCard,
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
    initialViewRef,
    setCardPosition,
    setShowMiniCard
  });

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {showMiniCard && selectedProperty && (
        <PropertyMiniCard
          property={selectedProperty}
          position={cardPosition}
          onClose={() => {
            setShowMiniCard(false);
            onSelectProperty(null);
          }}
          onOpenAttributes={() => {
            setShowMiniCard(false);
            if (onAttributesPanelChange) onAttributesPanelChange(true);
          }}
          userRole={userRole}
        />
      )}

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
        />
      )}
    </div>
  );
};

export default YandexMap;