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

// Константы для зума
const ZOOM_DURATION = 1000; // 1 секунда
const ZOOM_OUT_DURATION = 1000;
const ZOOM_OUT_DELTA = 2; // На сколько уровней отдаляем при закрытии
const MIN_ZOOM_LEVEL = 10;
const CENTROID_ZOOM_THRESHOLD = 14; // Минимальный зум для показа участков вместо центроидов
const CENTROID_ZOOM_LEVEL = 14; // До какого уровня зумим при клике на центроид

// Определяем размеры отступов в зависимости от размера экрана
const getZoomMargins = (): [number, number, number, number] => {
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  
  if (isMobile) {
    // На мобильных: меньше отступ справа (панель над картой)
    return [80, 100, 80, 100];
  } else if (isTablet) {
    // На планшетах: средние отступы
    return [100, 300, 100, 250];
  } else {
    // На десктопе: большой отступ справа для панели
    return [100, 450, 100, 360];
  }
};

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
  
  // Функция зума к участку: если далеко - к центроиду, если близко - к границам
  const performZoomToProperty = (property: Property, source: 'selection' | 'button' = 'selection') => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    const currentZoom = map.getZoom();
    
    // Если зум меньше порога - зумим к центроиду (показываем общую область)
    if (currentZoom < CENTROID_ZOOM_THRESHOLD) {
      const center = property.coordinates;
      isAnimatingRef.current = true;
      
      // Используем setCenter с duration для плавного перемещения + зума
      map.setCenter(center, CENTROID_ZOOM_LEVEL, {
        checkZoomRange: true,
        duration: ZOOM_DURATION
      }).then(() => {
        isAnimatingRef.current = false;
      }).catch(() => {
        isAnimatingRef.current = false;
      });
      return;
    }
    
    // Если зум достаточный и есть границы - зумим к границам участка
    if (!property.boundary || property.boundary.length < 3) {
      return;
    }

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
        
        // Для детального просмотра используем меньшие отступы (ближе к участку)
        const detailedMargins: [number, number, number, number] = [40, 60, 40, 60];
        
        map.setBounds(bounds, {
          checkZoomRange: true,
          zoomMargin: detailedMargins,
          duration: ZOOM_DURATION
        }).then(() => {
          isAnimatingRef.current = false;
        }).catch(() => {
          isAnimatingRef.current = false;
        });
      }
    }
  };
  
  // Публичная функция для внешнего вызова (кнопка зума)
  const zoomToProperty = (property: Property) => {
    performZoomToProperty(property, 'button');
  };
  
  // Функция плавного отдаления при закрытии панели
  const zoomOut = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    const currentZoom = map.getZoom();
    const targetZoom = Math.max(currentZoom - ZOOM_OUT_DELTA, MIN_ZOOM_LEVEL);
    
    isAnimatingRef.current = true;
    map.setZoom(targetZoom, {
      checkZoomRange: true,
      duration: ZOOM_OUT_DURATION
    }).then(() => {
      isAnimatingRef.current = false;
    }).catch(() => {
      isAnimatingRef.current = false;
    });
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

  // Зумирование к выбранному объекту при его выборе
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Сброс выбора
    if (!selectedProperty) {
      if (previousSelectedRef.current) {
        previousSelectedRef.current = null;
      }
      return;
    }

    const currentZoom = map.getZoom();
    const isSameProperty = previousSelectedRef.current?.id === selectedProperty.id;
    
    // Если тот же участок и зум уже детальный (> 15) - ничего не делаем
    if (isSameProperty && currentZoom > 15) {
      return;
    }
    
    // Если тот же участок и зум >= 14 - это второй клик, разрешаем зум к границам
    // НЕ обновляем previousSelectedRef, чтобы третий клик заблокировался
    if (!isSameProperty) {
      previousSelectedRef.current = selectedProperty;
    }
    
    map.balloon.close();

    // Выполняем зум через единую функцию
    performZoomToProperty(selectedProperty, 'selection');
  }, [selectedProperty, isMapReady, mapInstanceRef, polygonsRef, isAnimatingRef]);

  return { zoomToProperty, zoomOut };
};