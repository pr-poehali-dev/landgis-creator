import { useEffect, useRef, useState } from 'react';
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
  onAttributesPanelChange
}: UseMapObjectsProps) => {
  const previousPropertiesHashRef = useRef<string>('');
  const [stylesLoaded, setStylesLoaded] = useState(false);
  const svgCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    polygonStyleService.loadSettings().then(() => setStylesLoaded(true));
    
    const unsubscribe = polygonStyleService.subscribe(() => {
      setStylesLoaded(false);
      setTimeout(() => setStylesLoaded(true), 100);
    });
    
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !clustererRef.current || !stylesLoaded) return;

    const map = mapInstanceRef.current;
    const clusterer = clustererRef.current;

    // Вычисляем хеш списка участков для определения изменений
    const propertiesHash = properties.map(p => p.id).sort().join(',');
    const shouldZoom = propertiesHash !== previousPropertiesHashRef.current;
    previousPropertiesHashRef.current = propertiesHash;

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
        const style = polygonStyleService.getStyleForProperty(property);
        
        const polygon = new window.ymaps.Polygon(
          [property.boundary],
          { hintContent: property.title },
          {
            fillColor: style.fillColor,
            strokeColor: style.strokeColor,
            strokeWidth: style.strokeWidth,
            strokeStyle: 'solid',
            fillOpacity: style.fillOpacity,
            strokeOpacity: 1
          }
        );

        polygon.events.add('click', () => {
          if (isAnimatingRef.current) return;
          onSelectProperty(property);
          if (onAttributesPanelChange) onAttributesPanelChange(true);
        });

        map.geoObjects.add(polygon);
        polygonsRef.current.push(polygon);
      }

      // Добавляем центроид
      if (property.boundary && property.boundary.length >= 3) {
        const style = polygonStyleService.getStyleForProperty(property);
        
        // Кешируем SVG иконки по стилю
        const styleKey = `${style.fillColor}-${style.fillOpacity}-${style.strokeColor}-${style.strokeWidth}`;
        let svgDataUrl = svgCacheRef.current.get(styleKey);
        
        if (!svgDataUrl) {
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" fill="${style.fillColor}" fill-opacity="${style.fillOpacity}" stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"/></svg>`;
          const svgBase64 = btoa(unescape(encodeURIComponent(svg)));
          svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;
          svgCacheRef.current.set(styleKey, svgDataUrl);
        }
        
        const centroid = new window.ymaps.Placemark(
          property.coordinates,
          { hintContent: property.title },
          {
            iconLayout: 'default#image',
            iconImageHref: svgDataUrl,
            iconImageSize: [30, 30],
            iconImageOffset: [-15, -15]
          }
        );

        centroid.events.add('click', () => {
          if (isAnimatingRef.current) return;
          onSelectProperty(property);
          if (onAttributesPanelChange) onAttributesPanelChange(true);
        });

        map.geoObjects.add(centroid);
        centroidsRef.current.push({ centroid, propertyId: property.id });
      }
    });

    // Автоматический зум к отфильтрованным участкам (только при изменении списка)
    if (shouldZoom && properties.length > 0 && !selectedProperty && !isAnimatingRef.current) {
      console.log('🔍 Зумируем к отфильтрованным участкам:', properties.length);
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
            duration: 1500
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
  }, [properties, isMapReady, selectedProperty, stylesLoaded]);
};