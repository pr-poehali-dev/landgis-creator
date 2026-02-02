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
  onAttributesPanelChange 
}: YandexMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const polygonsRef = useRef<any[]>([]);
  const placeMarksRef = useRef<any[]>([]);
  const previousSelectedRef = useRef<Property | null>(null);
  const isAnimatingRef = useRef(false);
  
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

      // Добавляем метку
      const placemark = new window.ymaps.Placemark(
        property.coordinates,
        {
          title: property.title,
          location: property.location,
          priceFormatted: formatPrice(property.price),
          balloonContent: `
            <div style="font-family: Inter, sans-serif; max-width: 320px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${property.title}</h3>
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">📍 ${property.location}</p>
              <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <span style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${getTypeLabel(property.type)}</span>
                <span style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${property.area} м²</span>
              </div>
              <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #0EA5E9;">${formatPrice(property.price)}</p>
              ${property.boundary ? '<p style="margin: 0 0 8px 0; font-size: 12px; color: #0EA5E9;">✓ Границы загружены</p>' : ''}
            </div>
          `
        },
        {
          preset: 'islands#icon',
          iconColor: getMarkerColor(property.segment)
        }
      );

      placemark.events.add('click', () => {
        if (isAnimatingRef.current) return;
        onSelectProperty(property);
        setShowMiniCard(true);
        if (onAttributesPanelChange) onAttributesPanelChange(false);
      });

      clusterer.add(placemark);
      placeMarksRef.current.push(placemark);
    });

    console.log(`✅ Отрисовано ${properties.length} объектов`);
  }, [properties, isMapReady]);

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
      
      if (previousSelectedRef.current) {
        isAnimatingRef.current = true;
        
        map.setCenter([55.751244, 37.618423], 12, {
          checkZoomRange: true,
          duration: 700
        });

        const resetHandler = () => {
          isAnimatingRef.current = false;
          previousSelectedRef.current = null;
          map.events.remove('actionend', resetHandler);
        };
        map.events.add('actionend', resetHandler);
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
        />
      )}
    </div>
  );
};

export default YandexMap;