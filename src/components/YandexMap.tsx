import { useEffect, useRef, useState } from 'react';
import PropertyMiniCard from '@/components/map/PropertyMiniCard';
import PropertyAttributesPanel from '@/components/map/PropertyAttributesPanel';
import { formatPrice, getTypeLabel, getMarkerColor } from '@/components/map/MapHelpers';

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
        const stepDuration = 150;
        
        let step = 0;
        const animate = () => {
          if (step >= zoomSteps) {
            map.setBounds(bounds, {
              checkZoomRange: true,
              zoomMargin: 60,
              duration: 500
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
  
  const [isMapReady, setIsMapReady] = useState(false);
  const [showMiniCard, setShowMiniCard] = useState(false);
  const [cardPosition, setCardPosition] = useState<{ top?: string; left?: string; right?: string; bottom?: string }>({});

  // ========== ИНИЦИАЛИЗАЦИЯ КАРТЫ ==========
  useEffect(() => {
    if (!window.ymaps) {
      console.error('Яндекс.Карты не загружены');
      return;
    }

    window.ymaps.ready(() => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = new window.ymaps.Map(mapRef.current, {
        center: [55.751244, 37.618423],
        zoom: 12,
        controls: ['zoomControl', 'fullscreenControl'],
        // ⚠️ КРИТИЧНО: настройки для плавной работы
        suppressMapOpenBlock: true,
      }, {
        // Отключаем автоматическое выравнивание и прыжки
        autoFitToViewport: 'always',
        minZoom: 3,
        maxZoom: 19
      });

      // ⚠️ КРИТИЧНО: отключаем все поведения, которые вызывают мигание
      map.behaviors.disable('scrollZoom'); // отключаем зум колёсиком
      map.behaviors.enable('scrollZoom'); // включаем обратно, но с плавностью
      
      const clusterer = new window.ymaps.Clusterer({
        preset: 'islands#invertedVioletClusterIcons',
        clusterDisableClickZoom: false,
        clusterOpenBalloonOnClick: true,
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        clusterBalloonPagerSize: 5,
        clusterBalloonItemContentLayout: window.ymaps.templateLayoutFactory.createClass(
          '<div style="padding: 8px;">' +
          '<strong style="font-size: 14px;">{{ properties.title }}</strong><br/>' +
          '<small style="color: #999;">{{ properties.location }}</small><br/>' +
          '<strong style="color: #0EA5E9; font-size: 16px;">{{ properties.priceFormatted }}</strong>' +
          '</div>'
        )
      });

      clustererRef.current = clusterer;
      map.geoObjects.add(clusterer);
      mapInstanceRef.current = map;
      initialViewRef.current = { center: [55.751244, 37.618423], zoom: 12 };
      setIsMapReady(true);

      console.log('✅ Карта инициализирована');
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
        clustererRef.current = null;
        polygonsRef.current = [];
        placeMarksRef.current = [];
      }
    };
  }, []);

  // ========== ОБНОВЛЕНИЕ ОБЪЕКТОВ НА КАРТЕ ==========
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !clustererRef.current) return;

    const map = mapInstanceRef.current;
    const clusterer = clustererRef.current;

    // Очищаем старые объекты
    polygonsRef.current.forEach(polygon => map.geoObjects.remove(polygon));
    polygonsRef.current = [];
    centroidsRef.current.forEach(centroid => map.geoObjects.remove(centroid));
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

    console.log(`✅ Отрисовано ${properties.length} объектов`);
  }, [properties, isMapReady]);

  // ========== ВЫДЕЛЕНИЕ ЦЕНТРОИДА ПРИ НАВЕДЕНИИ ==========
  useEffect(() => {
    if (!isMapReady) return;

    centroidsRef.current.forEach(({ centroid, propertyId }) => {
      if (propertyId === hoveredPropertyId) {
        centroid.options.set('preset', 'islands#yellowCircleDotIcon');
        centroid.options.set('iconColor', '#FF0000');
        centroid.options.set('iconImageSize', [60, 60]);
        centroid.options.set('iconImageOffset', [-30, -30]);
      } else {
        const property = properties.find(p => p.id === propertyId);
        if (property) {
          centroid.options.set('preset', 'islands#circleIcon');
          centroid.options.set('iconColor', getMarkerColor(property.segment));
          centroid.options.set('iconImageSize', [30, 30]);
          centroid.options.set('iconImageOffset', [-15, -15]);
        }
      }
    });
  }, [hoveredPropertyId, isMapReady, properties]);

  // ========== ПЕРЕКЛЮЧЕНИЕ ТИПА КАРТЫ ==========
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const layerType = mapType === 'scheme' ? 'map' : 'hybrid';
    mapInstanceRef.current.setType(`yandex#${layerType}`);
  }, [mapType]);

  // ========== ЗУМИРОВАНИЕ К ВЫБРАННОМУ ОБЪЕКТУ ==========
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapRef.current) return;

    // Сброс выбора
    if (!selectedProperty) {
      setCardPosition({});
      
      if (previousSelectedRef.current && initialViewRef.current) {
        isAnimatingRef.current = true;
        
        const currentZoom = map.getZoom();
        const targetZoom = initialViewRef.current.zoom;
        const targetCenter = initialViewRef.current.center;
        
        const zoomSteps = Math.abs(targetZoom - currentZoom);
        const stepDuration = 150;
        
        let step = 0;
        const animate = () => {
          if (step >= zoomSteps) {
            map.setCenter(targetCenter, targetZoom, {
              checkZoomRange: true,
              duration: 500
            });
            
            const finalHandler = () => {
              isAnimatingRef.current = false;
              previousSelectedRef.current = null;
              map.events.remove('actionend', finalHandler);
            };
            map.events.add('actionend', finalHandler);
            return;
          }
          
          const newZoom = currentZoom + ((targetZoom - currentZoom) * (step / zoomSteps));
          map.setCenter(targetCenter, Math.round(newZoom), { duration: stepDuration });
          
          step++;
          setTimeout(animate, stepDuration);
        };
        
        animate();
      }
      return;
    }

    // Запоминаем выбранный объект
    previousSelectedRef.current = selectedProperty;
    map.balloon.close();
    isAnimatingRef.current = true;

    const [lat, lng] = selectedProperty.coordinates;

    // ⚠️ КРИТИЧНО: слушаем завершение анимации через события
    const actionEndHandler = () => {
      isAnimatingRef.current = false;
      
      try {
        const projection = map.options.get('projection');
        const globalPixels = projection.toGlobalPixels([lat, lng], map.getZoom());
        const mapSize = map.container.getSize();
        const mapOffset = map.converter.globalToPage(globalPixels);

        const x = mapOffset[0];
        const y = mapOffset[1];
        const margin = 16;

        const position: any = {};

        if (x > mapSize[0] / 2) {
          position.right = `${mapSize[0] - x + margin}px`;
        } else {
          position.left = `${x + margin}px`;
        }

        if (y < mapSize[1] / 2) {
          position.top = `${y + margin}px`;
        } else {
          position.bottom = `${mapSize[1] - y + margin}px`;
        }

        setCardPosition(position);
        setShowMiniCard(true);
      } catch (error) {
        console.error('Ошибка позиционирования:', error);
      }

      map.events.remove('actionend', actionEndHandler);
    };

    map.events.add('actionend', actionEndHandler);
  }, [selectedProperty]);

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