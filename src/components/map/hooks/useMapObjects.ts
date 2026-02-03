import { useEffect } from 'react';
import { getMarkerColor } from '@/components/map/MapHelpers';

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

interface UseMapObjectsProps {
  isMapReady: boolean;
  properties: Property[];
  selectedProperty: Property | null;
  mapInstanceRef: React.MutableRefObject<any>;
  clustererRef: React.MutableRefObject<any>;
  polygonsRef: React.MutableRefObject<any[]>;
  placeMarksRef: React.MutableRefObject<any[]>;
  centroidsRef: React.MutableRefObject<any[]>;
  initialViewRef: React.MutableRefObject<{ center: [number, number], zoom: number } | null>;
  isAnimatingRef: React.MutableRefObject<boolean>;
  onSelectProperty: (property: Property | null) => void;
  setShowMiniCard: (show: boolean) => void;
  onAttributesPanelChange?: (show: boolean) => void;
}

export const useMapObjects = ({
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
}: UseMapObjectsProps) => {
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !clustererRef.current) return;

    const map = mapInstanceRef.current;
    const clusterer = clustererRef.current;

    // Очищаем старые объекты
    polygonsRef.current.forEach(polygon => map.geoObjects.remove(polygon));
    polygonsRef.current = [];
    centroidsRef.current.forEach(({ centroid }) => map.geoObjects.remove(centroid));
    centroidsRef.current = [];
    clusterer.removeAll();
    placeMarksRef.current = [];

    // Добавляем новые объекты
    properties.forEach((property) => {
      // Добавляем полигон, если есть границы
      if (property.boundary && property.boundary.length >= 3) {
        const polygon = new window.ymaps.Polygon(
          [property.boundary],
          { hintContent: property.title },
          {
            fillColor: getMarkerColor(property.segment) + '40',
            strokeColor: getMarkerColor(property.segment),
            strokeWidth: 2,
            strokeStyle: 'solid',
            // ⚠️ КРИТИЧНО: плавные переходы для полигонов
            fillOpacity: 0.25,
            strokeOpacity: 1
          }
        );

        polygon.events.add('click', () => {
          if (isAnimatingRef.current) return;
          onSelectProperty(property);
          setShowMiniCard(true);
          if (onAttributesPanelChange) onAttributesPanelChange(false);
        });

        map.geoObjects.add(polygon);
        polygonsRef.current.push(polygon);
      }

      // Добавляем центроид
      if (property.boundary && property.boundary.length >= 3) {
        const centroid = new window.ymaps.Placemark(
          property.coordinates,
          { hintContent: property.title },
          {
            preset: 'islands#circleIcon',
            iconColor: getMarkerColor(property.segment),
            iconImageSize: [30, 30],
            iconImageOffset: [-15, -15]
          }
        );

        centroid.events.add('click', () => {
          if (isAnimatingRef.current) return;
          onSelectProperty(property);
          setShowMiniCard(true);
          if (onAttributesPanelChange) onAttributesPanelChange(false);
        });

        map.geoObjects.add(centroid);
        centroidsRef.current.push({ centroid, propertyId: property.id });
      }
    });

    // Автоматический зум к отфильтрованным участкам
    if (properties.length > 0 && !selectedProperty && !isAnimatingRef.current) {
      const allBounds: Array<[number, number]> = [];
      
      properties.forEach(property => {
        if (property.boundary && property.boundary.length >= 3) {
          property.boundary.forEach(coord => allBounds.push(coord));
        } else if (property.coordinates) {
          allBounds.push(property.coordinates);
        }
      });

      if (allBounds.length > 0) {
        const lats = allBounds.map(coord => coord[0]);
        const lngs = allBounds.map(coord => coord[1]);
        
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        
        const bounds: [[number, number], [number, number]] = [
          [minLat, minLng],
          [maxLat, maxLng]
        ];

        // Плавно перемещаемся к границам
        setTimeout(() => {
          map.setBounds(bounds, {
            checkZoomRange: true,
            zoomMargin: 50,
            duration: 800
          });

          const finalHandler = () => {
            const center = map.getCenter();
            const zoom = map.getZoom();
            initialViewRef.current = { center: [center[0], center[1]], zoom };
            map.events.remove('actionend', finalHandler);
          };
          map.events.add('actionend', finalHandler);
        }, 100);
      }
    }

    console.log(`✅ Отрисовано ${properties.length} объектов`);
  }, [properties, isMapReady, selectedProperty]);
};