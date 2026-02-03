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
  cityMarkersRef: React.MutableRefObject<any[]>;
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
  cityMarkersRef,
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
    cityMarkersRef.current.forEach(marker => map.geoObjects.remove(marker));
    cityMarkersRef.current = [];
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

    // Группируем участки по городам
    const citiesMap = new Map<string, { city: string; properties: Property[]; center: [number, number] }>();
    
    properties.forEach(property => {
      const city = property.attributes?.city || property.attributes?.region || 'Неизвестный город';
      if (!citiesMap.has(city)) {
        citiesMap.set(city, {
          city,
          properties: [],
          center: property.coordinates
        });
      }
      citiesMap.get(city)!.properties.push(property);
    });

    // Создаём метки городов
    citiesMap.forEach(({ city, properties: cityProperties, center }) => {
      const cityMarker = new window.ymaps.Placemark(
        center,
        { 
          hintContent: `${city} (${cityProperties.length} объектов)`,
          balloonContent: `<strong>${city}</strong><br/>${cityProperties.length} объектов`
        },
        {
          preset: 'islands#blueDotIconWithCaption',
          iconCaptionMaxWidth: '200',
          iconCaption: city,
          hideIconOnBalloonOpen: false,
          visible: true
        }
      );

      cityMarker.events.add('click', () => {
        if (isAnimatingRef.current) return;
        
        // Находим границы всех участков города
        const cityBounds: Array<[number, number]> = [];
        cityProperties.forEach(prop => {
          if (prop.boundary && prop.boundary.length >= 3) {
            cityBounds.push(...prop.boundary);
          }
        });

        if (cityBounds.length > 0) {
          let minLat = cityBounds[0][0];
          let maxLat = cityBounds[0][0];
          let minLng = cityBounds[0][1];
          let maxLng = cityBounds[0][1];

          cityBounds.forEach(([lat, lng]) => {
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
          });

          const bounds = [[minLat, minLng], [maxLat, maxLng]];
          
          isAnimatingRef.current = true;
          map.setBounds(bounds as [[number, number], [number, number]], {
            checkZoomRange: true,
            zoomMargin: 80,
            duration: 1000
          });

          const handler = () => {
            isAnimatingRef.current = false;
            map.events.remove('actionend', handler);
          };
          map.events.add('actionend', handler);
        }
      });

      map.geoObjects.add(cityMarker);
      cityMarkersRef.current.push(cityMarker);
    });

    // Рассчитываем границы всех участков и устанавливаем зум
    if (properties.length > 0 && !selectedProperty) {
      const allBounds: Array<[number, number]> = [];
      
      properties.forEach(property => {
        if (property.boundary && property.boundary.length >= 3) {
          allBounds.push(...property.boundary);
        }
      });

      if (allBounds.length > 0) {
        // Находим минимальные и максимальные координаты
        let minLat = allBounds[0][0];
        let maxLat = allBounds[0][0];
        let minLng = allBounds[0][1];
        let maxLng = allBounds[0][1];

        allBounds.forEach(([lat, lng]) => {
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
        });

        const bounds = [[minLat, minLng], [maxLat, maxLng]];
        
        // Устанавливаем зум с учётом всех участков
        map.setBounds(bounds as [[number, number], [number, number]], {
          checkZoomRange: true,
          zoomMargin: 50,
          duration: 300
        });

        // Обновляем стартовую позицию
        const center = map.getCenter();
        const zoom = map.getZoom();
        initialViewRef.current = { center: [center[0], center[1]], zoom };
      }
    }

    console.log(`✅ Отрисовано ${properties.length} объектов`);
  }, [properties, isMapReady, selectedProperty]);
};
