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
  
  // Плавная анимация через промежуточные точки
  const smoothAnimateToBounds = async (map: any, targetBounds: any, margins: number[]) => {
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    
    // Вычисляем целевой центр и зум
    const [[minLat, minLng], [maxLat, maxLng]] = targetBounds;
    const targetCenter: [number, number] = [
      (minLat + maxLat) / 2,
      (minLng + maxLng) / 2
    ];
    
    // Вычисляем целевой зум на основе размера bounds
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    const targetZoom = Math.max(10, Math.min(18, 17 - Math.log2(maxDiff * 100)));
    
    const steps = 10; // Количество промежуточных шагов
    const stepDuration = 150; // Длительность каждого шага в мс
    
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
      
      const intermediateCenter: [number, number] = [
        currentCenter[0] + (targetCenter[0] - currentCenter[0]) * easeProgress,
        currentCenter[1] + (targetCenter[1] - currentCenter[1]) * easeProgress
      ];
      const intermediateZoom = currentZoom + (targetZoom - currentZoom) * easeProgress;
      
      map.setCenter(intermediateCenter, { duration: 0 });
      map.setZoom(intermediateZoom, { duration: 0 });
      
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
  };

  // Функция зума к участку
  const zoomToProperty = async (property: Property) => {
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
      console.log('✅ Полигон найден, запускаем плавную анимацию:', bounds);
      if (bounds) {
        isAnimatingRef.current = true;
        const startTime = performance.now();
        
        console.log('⏱️ СТАРТ плавной анимации (кнопка зума)');
        await smoothAnimateToBounds(map, bounds, [100, 450, 100, 360]);
        
        const elapsed = Math.round(performance.now() - startTime);
        console.log(`✅ Плавная анимация (кнопка) завершена за ${elapsed}мс`);
        isAnimatingRef.current = false;
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
    let isCancelled = false;
    
    const performZoom = async () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Сброс выбора
    if (!selectedProperty) {
      if (previousSelectedRef.current) {
        // Не делаем анимацию при закрытии - она управляется из YandexMap
        previousSelectedRef.current = null;
      }
      return;
    }

    // Не делаем ничего, если выбран тот же участок
    if (previousSelectedRef.current?.id === selectedProperty.id) {
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
      if (bounds && !isCancelled) {
        isAnimatingRef.current = true;
        const startTime = performance.now();
        
        console.log('⏱️ СТАРТ плавной анимации к участку');
        await smoothAnimateToBounds(map, bounds, [100, 450, 100, 360]);
        
        if (!isCancelled) {
          const elapsed = Math.round(performance.now() - startTime);
          console.log(`✅ Плавная анимация завершена за ${elapsed}мс`);
          isAnimatingRef.current = false;
        }
      }
    } else {
      console.log('❌ Полигон не найден среди', polygonsRef.current.length, 'полигонов');
    }
    };
    
    performZoom();
    
    return () => {
      isCancelled = true;
    };
  }, [selectedProperty]);

  return { zoomToProperty };
};