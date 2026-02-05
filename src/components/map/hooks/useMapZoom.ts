import { useEffect, useRef } from 'react';
import { getMarkerColor } from '@/components/map/MapHelpers';
import { polygonStyleService } from '@/services/polygonStyleService';

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
  const hoverSvgCacheRef = useRef<Map<string, string>>(new Map());
  
  // Функция зума к участку
  const zoomToProperty = (property: Property) => {
    const map = mapInstanceRef.current;
    if (!map || !property.boundary || property.boundary.length < 3) {
      console.log('❌ Зум невозможен:', { map: !!map, boundary: property.boundary?.length });
      return;
    }

    console.log('🔍 Поиск полигона для участка:', property.title);
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
      console.log('✅ Полигон найден, запускаем анимацию:', bounds);
      if (bounds) {
        isAnimatingRef.current = true;
        
        map.setBounds(bounds, {
          checkZoomRange: true,
          zoomMargin: [100, 450, 100, 360],
          duration: 1500,
          flying: true
        });
        
        const handler = () => {
          console.log('✅ Анимация завершена');
          isAnimatingRef.current = false;
          map.events.remove('actionend', handler);
        };
        
        map.events.add('actionend', handler);
      }
    } else {
      console.log('❌ Полигон не найден среди', polygonsRef.current.length, 'полигонов');
    }
  };

  // Выделение центроида при наведении
  useEffect(() => {
    if (!isMapReady) return;

    centroidsRef.current.forEach(({ centroid, propertyId }) => {
      const property = properties.find(p => p.id === propertyId);
      if (!property) return;

      if (propertyId === hoveredPropertyId) {
        const style = polygonStyleService.getStyleForProperty(property);
        const map = mapInstanceRef.current;
        const currentZoom = map ? map.getZoom() : 10;
        
        // Создаём увеличенную иконку с полной заливкой для ховера
        const hoverKey = `${style.fillColor}-1.0-${style.strokeColor}-${style.strokeWidth}-hover`;
        let hoverSvgDataUrl = hoverSvgCacheRef.current.get(hoverKey);
        
        if (!hoverSvgDataUrl) {
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 45 45"><circle cx="22.5" cy="22.5" r="18" fill="${style.fillColor}" fill-opacity="1.0" stroke="${style.strokeColor}" stroke-width="${Math.max(style.strokeWidth, 3)}"/></svg>`;
          const svgBase64 = btoa(unescape(encodeURIComponent(svg)));
          hoverSvgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;
          hoverSvgCacheRef.current.set(hoverKey, hoverSvgDataUrl);
        }
        
        centroid.options.set('iconImageHref', hoverSvgDataUrl);
        centroid.options.set('iconImageSize', [45, 45]);
        centroid.options.set('iconImageOffset', [-22.5, -22.5]);
        centroid.options.set('zIndex', 1000);
        // Показываем центроид при наведении, если зум не слишком близкий
        centroid.options.set('visible', currentZoom < 14);
      } else {
        const style = polygonStyleService.getStyleForProperty(property);
        
        // Возвращаем нормальную иконку
        const normalKey = `${style.fillColor}-${style.fillOpacity}-${style.strokeColor}-${style.strokeWidth}`;
        let normalSvgDataUrl = hoverSvgCacheRef.current.get(normalKey);
        
        if (!normalSvgDataUrl) {
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" fill="${style.fillColor}" fill-opacity="${style.fillOpacity}" stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"/></svg>`;
          const svgBase64 = btoa(unescape(encodeURIComponent(svg)));
          normalSvgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;
          hoverSvgCacheRef.current.set(normalKey, normalSvgDataUrl);
        }
        
        centroid.options.set('iconImageHref', normalSvgDataUrl);
        centroid.options.set('iconImageSize', [30, 30]);
        centroid.options.set('iconImageOffset', [-15, -15]);
        centroid.options.set('zIndex', hoveredPropertyId ? 1 : 100);
        // Скрываем центроид если зум слишком близкий
        const map = mapInstanceRef.current;
        const currentZoom = map ? map.getZoom() : 10;
        centroid.options.set('visible', currentZoom < 14);
      }
    });
  }, [hoveredPropertyId, isMapReady, properties, mapInstanceRef]);

  // Переключение типа карты
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const layerType = mapType === 'scheme' ? 'map' : 'hybrid';
    mapInstanceRef.current.setType(`yandex#${layerType}`);
  }, [mapType]);

  // Зумирование к выбранному объекту
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Сброс выбора
    if (!selectedProperty) {
      if (previousSelectedRef.current) {
        isAnimatingRef.current = true;
        
        const currentZoom = map.getZoom();
        const targetZoom = Math.max(currentZoom - 2, 10);
        
        map.setZoom(targetZoom, {
          checkZoomRange: true,
          duration: 1500
        });
        
        const handler = () => {
          isAnimatingRef.current = false;
          previousSelectedRef.current = null;
          map.events.remove('actionend', handler);
        };
        
        map.events.add('actionend', handler);
      }
      return;
    }

    // Запоминаем выбранный объект и приближаем камеру
    previousSelectedRef.current = selectedProperty;
    map.balloon.close();

    console.log('📍 Начинаем зум к участку:', selectedProperty.title);
    
    // Зумируем к участку напрямую
    if (!selectedProperty.boundary || selectedProperty.boundary.length < 3) {
      console.log('❌ Нет границ у участка');
      return;
    }

    const existingPolygon = polygonsRef.current.find((polygon: any) => {
      try {
        const coords = polygon.geometry?.getCoordinates()?.[0];
        if (!coords || coords.length !== selectedProperty.boundary?.length) return false;
        return coords.every((coord: [number, number], idx: number) => 
          coord[0] === selectedProperty.boundary?.[idx]?.[0] && 
          coord[1] === selectedProperty.boundary?.[idx]?.[1]
        );
      } catch {
        return false;
      }
    });
    
    if (existingPolygon) {
      const bounds = existingPolygon.geometry?.getBounds();
      console.log('✅ Полигон найден, bounds:', bounds);
      if (bounds) {
        isAnimatingRef.current = true;
        
        // Вычисляем целевой зум и центр с учетом отступов панелей
        const [[minLat, minLng], [maxLat, maxLng]] = bounds;
        
        // Смещаем центр влево, чтобы компенсировать правую панель атрибутов
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        
        // Вычисляем оптимальный зум для границ
        const latDiff = maxLat - minLat;
        const lngDiff = maxLng - minLng;
        const targetZoom = Math.min(
          Math.floor(Math.log2(360 / lngDiff / 1.5)),
          Math.floor(Math.log2(180 / latDiff / 1.5)),
          16
        );
        
        // Двухэтапная анимация: сначала движение, потом зум
        map.panTo([centerLat, centerLng], {
          duration: 1000
        });
        
        setTimeout(() => {
          map.setZoom(targetZoom, {
            duration: 800
          });
          
          const handler = () => {
            console.log('✅ Анимация завершена');
            isAnimatingRef.current = false;
            map.events.remove('actionend', handler);
          };
          
          map.events.add('actionend', handler);
        }, 1000);
      }
    } else {
      console.log('❌ Полигон не найден среди', polygonsRef.current.length, 'полигонов');
    }
  }, [selectedProperty]);

  return { zoomToProperty };
};