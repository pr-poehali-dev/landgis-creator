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

const YandexMap = ({ properties, selectedProperty, onSelectProperty, mapType, userRole = 'user1', showAttributesPanel = false, onAttributesPanelChange }: YandexMapProps) => {
  console.log('YandexMap рендер! selectedProperty:', selectedProperty?.title, 'showAttributesPanel:', showAttributesPanel);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const polygonsRef = useRef<any[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showMiniCard, setShowMiniCard] = useState(false);
  const [cardPosition, setCardPosition] = useState<{ top?: string; left?: string; right?: string; bottom?: string }>({});

  useEffect(() => {
    if (!window.ymaps) {
      console.warn('Яндекс.Карты не загружены');
      return;
    }

    window.ymaps.ready(() => {
      if (!mapRef.current) return;

      if (!mapInstanceRef.current) {
        const map = new window.ymaps.Map(mapRef.current, {
          center: [55.751244, 37.618423],
          zoom: 12,
          controls: ['zoomControl', 'fullscreenControl']
        });

        mapInstanceRef.current = map;
        setIsMapReady(true);

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
      }

      const map = mapInstanceRef.current;
      const clusterer = clustererRef.current;

      polygonsRef.current.forEach(polygon => {
        map.geoObjects.remove(polygon);
      });
      polygonsRef.current = [];
      
      clusterer.removeAll();

      properties.forEach((property) => {
        if (property.boundary && property.boundary.length >= 3) {
          console.log('Рисуем границы для:', property.title, property.boundary);
          const polygon = new window.ymaps.Polygon(
            [property.boundary],
            {
              hintContent: property.title
            },
            {
              fillColor: getMarkerColor(property.segment) + '40',
              strokeColor: getMarkerColor(property.segment),
              strokeWidth: 2,
              strokeStyle: 'solid'
            }
          );

          polygon.events.add('click', () => {
            onSelectProperty(property);
            setShowMiniCard(true);
            if (onAttributesPanelChange) onAttributesPanelChange(false);
          });

          map.geoObjects.add(polygon);
          polygonsRef.current.push(polygon);
        }

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
                ${property.attributes && Object.keys(property.attributes).length > 0 ? `
                  <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e5e5; max-height: 300px; overflow-y: auto;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #0EA5E9;">Атрибуты объекта (${Object.keys(property.attributes).length}):</p>
                    ${Object.entries(property.attributes)
                      .filter(([key]) => key !== 'geometry_name')
                      .map(([key, value]) => {
                        const strValue = value !== null && value !== undefined ? String(value) : '—';
                        const truncated = strValue.length > 200 ? strValue.substring(0, 200) + '...' : strValue;
                        return `<div style="font-size: 11px; margin: 6px 0; padding: 4px 0; border-bottom: 1px solid #f0f0f0;">
                          <span style="color: #666; font-weight: 600; display: block; margin-bottom: 2px;">${key}</span>
                          <span style="color: #333; word-break: break-word; white-space: pre-wrap;">${truncated}</span>
                        </div>`;
                      }).join('')}
                  </div>
                ` : ''}
              </div>
            `
          },
          {
            preset: 'islands#icon',
            iconColor: getMarkerColor(property.segment)
          }
        );

        placemark.events.add('click', () => {
          onSelectProperty(property);
          setShowMiniCard(true);
          if (onAttributesPanelChange) onAttributesPanelChange(false);
        });

        clusterer.add(placemark);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
        clustererRef.current = null;
      }
    };
  }, [properties]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const layerType = mapType === 'scheme' ? 'map' : 'hybrid';
    mapInstanceRef.current.setType(`yandex#${layerType}`);
  }, [mapType]);

  useEffect(() => {
    console.log('UseEffect сработал! selectedProperty:', selectedProperty?.title, 'showAttributesPanel:', showAttributesPanel, 'mapInstanceRef:', !!mapInstanceRef.current);
    
    if (!selectedProperty || !mapRef.current) {
      console.log('Выход: нет selectedProperty или mapRef');
      setCardPosition({});
      return;
    }

    const performZoom = () => {
      const map = mapInstanceRef.current;
      if (!map) {
        console.log('performZoom: карта ещё не готова');
        return false;
      }

      console.log('performZoom: Карта готова, выполняем зум!');
      
      const margin = 24;
      const [lat, lng] = selectedProperty.coordinates;
      
      console.log('Проверка showAttributesPanel:', showAttributesPanel);
      
      if (showAttributesPanel) {
        console.log('Зумируем к участку:', selectedProperty.title);
        console.log('Координаты:', lat, lng);
        console.log('Есть границы:', !!selectedProperty.boundary);
        
        if (selectedProperty.boundary && selectedProperty.boundary.length >= 3) {
          try {
            console.log('Граница участка:', selectedProperty.boundary);
            
            // Создаём временный полигон для расчёта границ
            const tempPolygon = new window.ymaps.Polygon([selectedProperty.boundary]);
            const polygonBounds = tempPolygon.geometry.getBounds();
            
            console.log('Границы полигона:', polygonBounds);
            
            // Центр границ
            const centerPoint = [
              (polygonBounds[0][0] + polygonBounds[1][0]) / 2,
              (polygonBounds[0][1] + polygonBounds[1][1]) / 2
            ];
            
            console.log('Центр участка:', centerPoint);
            
            // Вычисляем оптимальный зум
            const latDiff = polygonBounds[1][0] - polygonBounds[0][0];
            const lngDiff = polygonBounds[1][1] - polygonBounds[0][1];
            const maxDiff = Math.max(latDiff, lngDiff);
            
            let targetZoom = 17;
            if (maxDiff > 0.01) targetZoom = 15;
            if (maxDiff > 0.02) targetZoom = 14;
            if (maxDiff > 0.05) targetZoom = 13;
            if (maxDiff > 0.1) targetZoom = 12;
            
            console.log('Целевой зум:', targetZoom);
            
            const currentZoom = map.getZoom();
            console.log('Текущий зум:', currentZoom);
            
            // Если зум слишком большой (очень близко), сначала плавно отдаляемся
            if (currentZoom > targetZoom + 2) {
              console.log('Отдаляемся для плавного перехода');
              map.setZoom(targetZoom + 1, { duration: 400 }).then(() => {
                // Затем летим к новому участку
                map.panTo(centerPoint, { 
                  flying: 1,
                  duration: 600
                }).then(() => {
                  // И доводим зум до целевого
                  map.setZoom(targetZoom, { duration: 400 });
                });
              });
            } else {
              // Если зум нормальный, просто летим напрямую
              map.panTo(centerPoint, { 
                flying: 1,
                duration: 800
              }).then(() => {
                map.setZoom(targetZoom, { duration: 600 });
              });
            }
            
            console.log('Зум к границам выполнен');
          } catch (error) {
            console.error('Ошибка при зуме к границам:', error);
            // @ts-ignore
            if (window.ymaps && window.ymaps.map && window.ymaps.map.action && window.ymaps.map.action.Single) {
              // @ts-ignore
              const action = new window.ymaps.map.action.Single({
                center: [lat, lng],
                zoom: 16,
                duration: 800,
                timingFunction: 'ease-in-out'
              });
              map.action.execute(action);
            } else {
              map.panTo([lat, lng], { flying: true, duration: 800 });
            }
          }
        } else {
          console.log('Зумируем к центру участка');
          // @ts-ignore
          if (window.ymaps && window.ymaps.map && window.ymaps.map.action && window.ymaps.map.action.Single) {
            // @ts-ignore
            const action = new window.ymaps.map.action.Single({
              center: [lat, lng],
              zoom: 16,
              duration: 800,
              timingFunction: 'ease-in-out'
            });
            map.action.execute(action);
          } else {
            map.panTo([lat, lng], { flying: true, duration: 800 });
          }
        }
      }

      setTimeout(() => {
        const mapCenter = map.getCenter();
        const [centerLat, centerLng] = mapCenter;

        const position: { top?: string; left?: string; right?: string; bottom?: string } = {};

        if (lng < centerLng) {
          position.right = `${margin}px`;
        } else {
          position.left = `${margin}px`;
        }

        if (lat > centerLat) {
          position.bottom = `${margin}px`;
        } else {
          position.top = `${margin}px`;
        }

        setCardPosition(position);
      }, showAttributesPanel ? 100 : 0);
      
      return true;
    };

    if (!performZoom()) {
      console.log('Карта не готова, повторная попытка через 100мс');
      setTimeout(performZoom, 100);
    }
  }, [selectedProperty, showAttributesPanel, isMapReady]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {showAttributesPanel && selectedProperty && selectedProperty.attributes && (
        <PropertyAttributesPanel
          property={selectedProperty}
          userRole={userRole}
          onClose={() => {
            if (onAttributesPanelChange) onAttributesPanelChange(false);
            onSelectProperty(null);
          }}
          onAttributesUpdate={(updatedAttrs) => {
            onSelectProperty({
              ...selectedProperty,
              attributes: updatedAttrs
            });
          }}
        />
      )}

      {selectedProperty && !showAttributesPanel && showMiniCard && (
        <PropertyMiniCard
          property={selectedProperty}
          cardPosition={cardPosition}
          onClose={() => {
            setShowMiniCard(false);
            onSelectProperty(null);
          }}
          onShowDetails={() => {
            setShowMiniCard(false);
            if (onAttributesPanelChange) onAttributesPanelChange(true);
          }}
        />
      )}
    </div>
  );
};

export default YandexMap;