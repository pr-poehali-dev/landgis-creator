import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import AttributesDisplay from '@/components/AttributesDisplay';

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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const polygonsRef = useRef<any[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showMiniCard, setShowMiniCard] = useState(false);
  const [cardPosition, setCardPosition] = useState<{ top?: string; left?: string; right?: string; bottom?: string }>({});

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      land: 'Земля',
      commercial: 'Коммерция',
      residential: 'Жильё'
    };
    return labels[type as keyof typeof labels];
  };

  const getStatusColor = (status: string) => {
    const colors = {
      available: 'bg-green-500/20 text-green-400 border-green-500/30',
      reserved: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      sold: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[status as keyof typeof colors];
  };

  const getSegmentColor = (segment: string) => {
    const colors = {
      premium: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      standard: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      economy: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    return colors[segment as keyof typeof colors];
  };

  const getMarkerColor = (segment: string) => {
    const colors = {
      premium: '#8B5CF6',
      standard: '#0EA5E9',
      economy: '#F97316'
    };
    return colors[segment as keyof typeof colors];
  };

  const calculatePolygonArea = (boundary?: Array<[number, number]>) => {
    if (!boundary || boundary.length < 3) return 0;
    
    // Формула площади полигона по координатам (Shoelace formula)
    // Результат в квадратных градусах, конвертируем в га
    let area = 0;
    for (let i = 0; i < boundary.length; i++) {
      const j = (i + 1) % boundary.length;
      area += boundary[i][0] * boundary[j][1];
      area -= boundary[j][0] * boundary[i][1];
    }
    area = Math.abs(area) / 2;
    
    // Конвертация квадратных градусов в гектары (приблизительно)
    // На широте Москвы: 1 градус ≈ 111 км
    const areaInSquareMeters = area * 111000 * 111000;
    const areaInHectares = areaInSquareMeters / 10000;
    
    return areaInHectares;
  };

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

      // Удаляем старые полигоны из предыдущего рендера
      polygonsRef.current.forEach(polygon => {
        map.geoObjects.remove(polygon);
      });
      polygonsRef.current = [];
      
      // Очищаем кластер
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
    if (!selectedProperty || !mapRef.current) {
      setCardPosition({});
      return;
    }

    const map = mapInstanceRef.current;
    if (!map) {
      setCardPosition({ bottom: '24px', left: '24px' });
      return;
    }

    const margin = 24;
    const [lat, lng] = selectedProperty.coordinates;
    
    // Зумируем ТОЛЬКО если открыта панель атрибутов (клик из списка или "Подробнее")
    if (showAttributesPanel) {
      console.log('Зумируем к участку:', selectedProperty.title);
      console.log('Координаты:', lat, lng);
      console.log('Есть границы:', !!selectedProperty.boundary);
      
      if (selectedProperty.boundary && selectedProperty.boundary.length >= 3) {
        try {
          console.log('Граница участка:', selectedProperty.boundary);
          // Используем getBounds для расчёта границ
          const bounds = [[
            Math.min(...selectedProperty.boundary.map(p => p[0])),
            Math.min(...selectedProperty.boundary.map(p => p[1]))
          ], [
            Math.max(...selectedProperty.boundary.map(p => p[0])),
            Math.max(...selectedProperty.boundary.map(p => p[1]))
          ]];
          console.log('Рассчитанные границы:', bounds);
          map.setBounds(bounds, { 
            checkZoomRange: true,
            zoomMargin: [100, 100, 100, 100],
            duration: 500
          });
          console.log('Зум к границам выполнен');
        } catch (error) {
          console.error('Ошибка при зуме к границам:', error);
          map.setCenter([lat, lng], 16, { duration: 500 });
        }
      } else {
        console.log('Зумируем к центру участка');
        map.setCenter([lat, lng], 16, { duration: 500 });
      }
    }

    // Расчёт позиции мини-карточки
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
  }, [selectedProperty, showAttributesPanel]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {showAttributesPanel && selectedProperty && selectedProperty.attributes && (
        <Card className="absolute top-0 right-0 h-full w-full sm:w-[450px] shadow-2xl animate-fade-in overflow-hidden flex flex-col">
          <CardHeader className="pb-3 border-b border-border flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base mb-2">Атрибуты объекта</CardTitle>
                <CardDescription className="text-xs">
                  {selectedProperty.title}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mt-1"
                onClick={() => {
                  if (onAttributesPanelChange) onAttributesPanelChange(false);
                  onSelectProperty(null);
                }}
              >
                <Icon name="X" size={20} />
              </Button>
            </div>
            <Badge variant="secondary" className="mt-2 w-fit">
              Всего: {Object.keys(selectedProperty.attributes).filter(k => k !== 'geometry_name').length} атрибутов
            </Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-3 overflow-y-auto flex-1">
            <AttributesDisplay 
              attributes={selectedProperty.attributes}
              userRole={userRole}
              featureId={selectedProperty.id}
              onAttributesUpdate={(updatedAttrs) => {
                onSelectProperty({
                  ...selectedProperty,
                  attributes: updatedAttrs
                });
              }}
            />
          </CardContent>
        </Card>
      )}

      {selectedProperty && !showAttributesPanel && showMiniCard && (
        <Card 
          className="absolute w-96 max-w-md shadow-2xl animate-fade-in transition-all duration-300"
          style={Object.keys(cardPosition).length > 0 ? cardPosition : { bottom: '24px', left: '24px' }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base sm:text-lg mb-2">{selectedProperty.title}</CardTitle>
                <CardDescription className="flex items-center gap-1 text-xs">
                  <Icon name="MapPin" size={14} />
                  {selectedProperty.attributes?.region || 'Не указан'}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowMiniCard(false);
                  onSelectProperty(null);
                }}
              >
                <Icon name="X" size={18} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {(() => {
              const attrs = selectedProperty.attributes || {};
              const statusPub = attrs.status_publ || 'Не указан';
              const segment = attrs.segment ? 
                (Array.isArray(attrs.segment) ? attrs.segment.join(', ') : 
                 typeof attrs.segment === 'string' && attrs.segment.startsWith('[') ? 
                 JSON.parse(attrs.segment).join(', ') : attrs.segment) : 'Не указан';
              const region = attrs.region || 'Не указан';
              const price = attrs.ekspos || attrs.price || '0';
              const priceNum = typeof price === 'string' ? parseFloat(price) : price;
              const square = attrs.square || 'Не указано';

              return (
                <>
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(selectedProperty.status)} variant="outline">
                      {statusPub}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Регион</span>
                      <span className="text-sm font-medium">{region}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Площадь</span>
                      <span className="font-semibold text-sm sm:text-base">{square !== 'Не указано' ? `${square} га` : square}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Цена</span>
                      <span className="font-bold text-lg sm:text-xl text-primary">
                        {formatPrice(priceNum)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">{getTypeLabel(selectedProperty.type)}</Badge>
                    {segment !== 'Не указан' && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs" variant="outline">
                        {segment}
                      </Badge>
                    )}
                  </div>
                </>
              );
            })()}

            <div className="flex gap-2 pt-2">
              <Button className="flex-1" size="sm">
                <Icon name="Phone" size={16} className="sm:mr-2" />
                <span className="hidden sm:inline">Связаться</span>
              </Button>
              <Button variant="outline" className="flex-1" size="sm" onClick={() => {
                setShowMiniCard(false);
                if (onAttributesPanelChange) onAttributesPanelChange(true);
              }}>
                <Icon name="Eye" size={16} className="sm:mr-2" />
                <span className="hidden sm:inline">Подробнее</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default YandexMap;