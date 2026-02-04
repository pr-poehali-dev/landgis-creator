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

interface UseMapZoomProps {
  isMapReady: boolean;
  properties: Property[];
  selectedProperty: Property | null;
  hoveredPropertyId: number | null;
  mapType: 'scheme' | 'hybrid';
  mapRef: React.RefObject<HTMLDivElement>;
  mapInstanceRef: React.MutableRefObject<any>;
  polygonsRef: React.MutableRefObject<any[]>;
  centroidsRef: React.MutableRefObject<any[]>;
  previousSelectedRef: React.MutableRefObject<Property | null>;
  isAnimatingRef: React.MutableRefObject<boolean>;
  initialViewRef: React.MutableRefObject<{ center: [number, number], zoom: number } | null>;
}

export const useMapZoom = ({
  isMapReady,
  properties,
  selectedProperty,
  hoveredPropertyId,
  mapType,
  mapRef,
  mapInstanceRef,
  polygonsRef,
  centroidsRef,
  previousSelectedRef,
  isAnimatingRef,
  initialViewRef
}: UseMapZoomProps) => {
  
  // Функция зума к участку
  const zoomToProperty = (property: Property) => {
    const map = mapInstanceRef.current;
    if (!map || !property.boundary || property.boundary.length < 3) return;

    const existingPolygon = polygonsRef.current.find((polygon: any) => {
      try {
        const coords = polygon.geometry?.getCoordinates()?.[0];
        if (!coords || coords.length !== property.boundary?.length) return false;
        return coords.every((coord: [number, number], idx: number) => 
          coord[0] === property.boundary?.[idx]?.[0] && 
          coord[1] === property.boundary?.[idx]?.[1]
        );
      } catch {
        return false;
      }
    });
    
    if (existingPolygon) {
      const bounds = existingPolygon.geometry?.getBounds();
      if (bounds) {
        isAnimatingRef.current = true;
        
        const currentZoom = map.getZoom();
        const center = property.coordinates;
        
        // Рассчитываем целевой зум на основе размера границ
        const [[minLat, minLng], [maxLat, maxLng]] = bounds;
        const latDiff = maxLat - minLat;
        const lngDiff = maxLng - minLng;
        const maxDiff = Math.max(latDiff, lngDiff);
        
        // Простая формула для расчёта зума
        let targetZoom = 16;
        if (maxDiff > 0.1) targetZoom = 12;
        else if (maxDiff > 0.05) targetZoom = 13;
        else if (maxDiff > 0.02) targetZoom = 14;
        else if (maxDiff > 0.01) targetZoom = 15;
        
        const zoomSteps = Math.abs(targetZoom - currentZoom);
        const stepDuration = 200;
        
        let step = 0;
        const animate = () => {
          if (step >= zoomSteps) {
            map.setBounds(bounds, {
              checkZoomRange: true,
              zoomMargin: 60,
              duration: 800
            });
            
            const finalHandler = () => {
              isAnimatingRef.current = false;
              map.events.remove('actionend', finalHandler);
            };
            map.events.add('actionend', finalHandler);
            return;
          }
          
          const newZoom = currentZoom + ((targetZoom - currentZoom) * (step / zoomSteps));
          map.setCenter(center, Math.round(newZoom), { duration: stepDuration });
          
          step++;
          setTimeout(animate, stepDuration);
        };
        
        animate();
      }
    }
  };

  // Выделение центроида при наведении
  useEffect(() => {
    if (!isMapReady) return;

    centroidsRef.current.forEach(({ centroid, propertyId }) => {
      if (propertyId === hoveredPropertyId) {
        centroid.options.set('preset', 'islands#yellowCircleDotIcon');
        centroid.options.set('iconColor', '#FF0000');
        centroid.options.set('iconImageSize', [60, 60]);
        centroid.options.set('iconImageOffset', [-30, -30]);
        centroid.options.set('zIndex', 1000);
      } else {
        const property = properties.find(p => p.id === propertyId);
        if (property) {
          centroid.options.set('preset', 'islands#circleIcon');
          centroid.options.set('iconColor', getMarkerColor(property.segment));
          centroid.options.set('iconImageSize', [30, 30]);
          centroid.options.set('iconImageOffset', [-15, -15]);
          centroid.options.set('zIndex', hoveredPropertyId ? 1 : 100);
        }
      }
    });
  }, [hoveredPropertyId, isMapReady, properties]);

  // Переключение типа карты
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const layerType = mapType === 'scheme' ? 'map' : 'hybrid';
    mapInstanceRef.current.setType(`yandex#${layerType}`);
  }, [mapType]);

  // Зумирование к выбранному объекту
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapRef.current) return;

    // Сброс выбора
    if (!selectedProperty) {
      if (previousSelectedRef.current) {
        isAnimatingRef.current = true;
        
        const currentZoom = map.getZoom();
        const targetZoom = Math.max(currentZoom - 2, 10); // Отдаляемся на 2 уровня
        
        map.setZoom(targetZoom, {
          checkZoomRange: true,
          duration: 1000
        });
        
        const finalHandler = () => {
          isAnimatingRef.current = false;
          previousSelectedRef.current = null;
          map.events.remove('actionend', finalHandler);
        };
        map.events.add('actionend', finalHandler);
      }
      return;
    }

    // Запоминаем выбранный объект и приближаем камеру
    previousSelectedRef.current = selectedProperty;
    map.balloon.close();

    // Зумируем к участку
    zoomToProperty(selectedProperty);
  }, [selectedProperty]);

  return { zoomToProperty };
};