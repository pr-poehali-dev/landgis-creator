import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

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
}

interface YandexMapProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (property: Property | null) => void;
  mapType: 'scheme' | 'hybrid';
}

declare global {
  interface Window {
    ymaps: any;
  }
}

const YandexMap = ({ properties, selectedProperty, onSelectProperty, mapType }: YandexMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);

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

  useEffect(() => {
    if (!window.ymaps) {
      console.warn('Яндекс.Карты не загружены');
      return;
    }

    window.ymaps.ready(() => {
      if (!mapRef.current || mapInstanceRef.current) return;

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

      properties.forEach((property) => {
        if (property.boundary && property.boundary.length >= 3) {
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
          });

          map.geoObjects.add(polygon);
        }

        const placemark = new window.ymaps.Placemark(
          property.coordinates,
          {
            title: property.title,
            location: property.location,
            priceFormatted: formatPrice(property.price),
            balloonContent: `
              <div style="font-family: Inter, sans-serif; max-width: 280px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${property.title}</h3>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">📍 ${property.location}</p>
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                  <span style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${getTypeLabel(property.type)}</span>
                  <span style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${property.area} м²</span>
                </div>
                <p style="margin: 0; font-size: 18px; font-weight: 700; color: #0EA5E9;">${formatPrice(property.price)}</p>
                ${property.boundary ? '<p style="margin: 8px 0 0 0; font-size: 12px; color: #0EA5E9;">✓ Границы загружены</p>' : ''}
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
        });

        clusterer.add(placemark);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const layerType = mapType === 'scheme' ? 'map' : 'hybrid';
    mapInstanceRef.current.setType(`yandex#${layerType}`);
  }, [mapType]);

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedProperty) return;

    mapInstanceRef.current.setCenter(selectedProperty.coordinates, 15, {
      duration: 500
    });
  }, [selectedProperty]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {selectedProperty && (
        <Card className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto sm:w-96 max-w-md shadow-2xl animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base sm:text-lg mb-2">{selectedProperty.title}</CardTitle>
                <CardDescription className="flex items-center gap-1 text-xs">
                  <Icon name="MapPin" size={14} />
                  {selectedProperty.location}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSelectProperty(null)}
              >
                <Icon name="X" size={18} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Тип</div>
                <Badge variant="secondary" className="text-xs">{getTypeLabel(selectedProperty.type)}</Badge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Сегмент</div>
                <Badge className={`${getSegmentColor(selectedProperty.segment)} text-xs`} variant="outline">
                  {selectedProperty.segment === 'premium' ? 'Премиум' :
                   selectedProperty.segment === 'standard' ? 'Стандарт' : 'Эконом'}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Площадь</span>
                <span className="font-semibold text-sm sm:text-base">{selectedProperty.area} м²</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Цена</span>
                <span className="font-bold text-lg sm:text-xl text-primary">
                  {formatPrice(selectedProperty.price)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Статус</span>
                <Badge className={getStatusColor(selectedProperty.status)} variant="outline">
                  {selectedProperty.status === 'available' ? 'Доступен' : 
                   selectedProperty.status === 'reserved' ? 'Резерв' : 'Продан'}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="flex-1" size="sm">
                <Icon name="Phone" size={16} className="sm:mr-2" />
                <span className="hidden sm:inline">Связаться</span>
              </Button>
              <Button variant="outline" className="flex-1" size="sm">
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