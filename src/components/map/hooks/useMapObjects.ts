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
  const [currentZoom, setCurrentZoom] = useState<number>(10);

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
            strokeOpacity: 1,
            cursor: 'pointer'
          }
        );

        polygon.events.add('click', (e: any) => {
          console.log('🖱️ Polygon clicked:', property.title);
          e.stopPropagation();
          if (isAnimatingRef.current) return;
          onSelectProperty(property);
          if (onAttributesPanelChange) onAttributesPanelChange(true);
        });

        polygon.events.add('mouseenter', () => {
          polygon.options.set('strokeWidth', style.strokeWidth + 2);
          polygon.options.set('fillOpacity', Math.min(style.fillOpacity + 0.2, 1));
        });

        polygon.events.add('mouseleave', () => {
          polygon.options.set('strokeWidth', style.strokeWidth);
          polygon.options.set('fillOpacity', style.fillOpacity);
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
            iconImageOffset: [-15, -15],
            cursor: 'pointer'
          }
        );

        centroid.events.add('click', (e: any) => {
          console.log('🖱️ Centroid clicked:', property.title);
          e.stopPropagation();
          if (isAnimatingRef.current) return;
          onSelectProperty(property);
          if (onAttributesPanelChange) onAttributesPanelChange(true);
        });

        centroid.events.add('mouseenter', () => {
          centroid.options.set('iconImageSize', [36, 36]);
          centroid.options.set('iconImageOffset', [-18, -18]);
        });

        centroid.events.add('mouseleave', () => {
          centroid.options.set('iconImageSize', [30, 30]);
          centroid.options.set('iconImageOffset', [-15, -15]);
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

        // Плавная анимация к отфильтрованным участкам с увеличенными отступами
        setTimeout(() => {
          const options: any = {
            checkZoomRange: true,
            zoomMargin: 100,
            duration: 2000
          };
          
          map.setBounds(bounds, options);

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

    // Подписываемся на изменение зума для управления видимостью центроидов
    const handleZoomChange = () => {
      const zoom = map.getZoom();
      setCurrentZoom(zoom);
      
      const shouldShowCentroids = zoom < 14;
      centroidsRef.current.forEach(({ centroid }) => {
        if (shouldShowCentroids) {
          centroid.options.set('visible', true);
        } else {
          centroid.options.set('visible', false);
        }
      });
    };
    
    map.events.add('boundschange', handleZoomChange);
    handleZoomChange(); // Первоначальная проверка

    console.log(`✅ Отрисовано ${properties.length} объектов`);
    
    return () => {
      map.events.remove('boundschange', handleZoomChange);
    };
  }, [properties, isMapReady, stylesLoaded]);

  // Отдельный эффект для выделения выбранного участка
  useEffect(() => {
    if (!isMapReady || !selectedProperty) return;

    const selectedCentroid = centroidsRef.current.find(({ propertyId }) => propertyId === selectedProperty.id);
    if (!selectedCentroid) return;

    const style = polygonStyleService.getStyleForProperty(selectedProperty);
    
    // Создаем увеличенную иконку с полной заливкой для выбранного центроида
    const styleKey = `${style.fillColor}-1.0-${style.strokeColor}-${style.strokeWidth}-selected`;
    let svgDataUrl = svgCacheRef.current.get(styleKey);
    
    if (!svgDataUrl) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 45 45"><circle cx="22.5" cy="22.5" r="18" fill="${style.fillColor}" fill-opacity="1.0" stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"/></svg>`;
      const svgBase64 = btoa(unescape(encodeURIComponent(svg)));
      svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;
      svgCacheRef.current.set(styleKey, svgDataUrl);
    }

    selectedCentroid.centroid.options.set('iconImageHref', svgDataUrl);
    selectedCentroid.centroid.options.set('iconImageSize', [45, 45]);
    selectedCentroid.centroid.options.set('iconImageOffset', [-22.5, -22.5]);
    selectedCentroid.centroid.options.set('zIndex', 2000);
    
    // Скрываем центроид если зум слишком близкий
    const map = mapInstanceRef.current;
    const currentZoom = map ? map.getZoom() : 10;
    selectedCentroid.centroid.options.set('visible', currentZoom < 14);
    
    // Подписываемся на изменение зума для выбранного центроида
    const handleSelectedZoomChange = () => {
      const zoom = map.getZoom();
      selectedCentroid.centroid.options.set('visible', zoom < 14);
    };
    
    map.events.add('boundschange', handleSelectedZoomChange);

    // Возвращаем cleanup для сброса при снятии выделения
    return () => {
      if (map && selectedCentroid?.centroid) {
        map.events.remove('boundschange', handleSelectedZoomChange);
        
        const normalStyleKey = `${style.fillColor}-${style.fillOpacity}-${style.strokeColor}-${style.strokeWidth}`;
        const normalSvgDataUrl = svgCacheRef.current.get(normalStyleKey);
        
        if (normalSvgDataUrl) {
          selectedCentroid.centroid.options.set('iconImageHref', normalSvgDataUrl);
          selectedCentroid.centroid.options.set('iconImageSize', [30, 30]);
          selectedCentroid.centroid.options.set('iconImageOffset', [-15, -15]);
          selectedCentroid.centroid.options.set('zIndex', 100);
          // Восстанавливаем видимость в зависимости от зума
          const zoom = map.getZoom();
          selectedCentroid.centroid.options.set('visible', zoom < 14);
        }
      }
    };
  }, [selectedProperty, isMapReady, currentZoom]);
};