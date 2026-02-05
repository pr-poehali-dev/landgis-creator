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
        
        // Рассчитываем смещение для центрирования между панелями
        // Левая панель: 320px (80 * 4), правая панель: ~400px
        const mapContainer = mapRef.current;
        if (mapContainer) {
          const containerWidth = mapContainer.offsetWidth;
          const leftPanelWidth = 320; // ширина сайдбара в пикселях
          const rightPanelWidth = 400; // примерная ширина панели атрибутов
          
          // Рассчитываем центр видимой области между панелями
          const visibleWidth = containerWidth - leftPanelWidth - rightPanelWidth;
          const offsetX = (leftPanelWidth - rightPanelWidth) / 2;
          
          // Преобразуем пиксельное смещение в географические координаты
          const pixelCenter = map.getGlobalPixelCenter();
          const projection = map.options.get('projection');
          
          map.setBounds(bounds, {
            checkZoomRange: true,
            zoomMargin: [80, 100, 80, 100], // [top, right, bottom, left]
            duration: 1000,
            timingFunction: 'ease-in-out'
          }).then(() => {
            // После установки bounds смещаем центр для учета боковых панелей
            const currentCenter = map.getCenter();
            const currentPixelCenter = map.getGlobalPixelCenter(currentCenter);
            const newPixelCenter = [
              currentPixelCenter[0] + offsetX,
              currentPixelCenter[1]
            ];
            const newGeoCenter = map.options.get('projection').fromGlobalPixels(newPixelCenter, map.getZoom());
            
            map.panTo(newGeoCenter, {
              duration: 400,
              timingFunction: 'ease-out'
            }).then(() => {
              isAnimatingRef.current = false;
            });
          });
        } else {
          // Fallback если не удалось получить контейнер
          map.setBounds(bounds, {
            checkZoomRange: true,
            zoomMargin: 100,
            duration: 1000,
            timingFunction: 'ease-in-out'
          });
          
          const finalHandler = () => {
            isAnimatingRef.current = false;
            map.events.remove('actionend', finalHandler);
          };
          map.events.add('actionend', finalHandler);
        }
      }
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