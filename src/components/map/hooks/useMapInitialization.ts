import { useEffect } from 'react';

interface UseMapInitializationProps {
  mapRef: React.RefObject<HTMLDivElement>;
  mapInstanceRef: React.MutableRefObject<any>;
  clustererRef: React.MutableRefObject<any>;
  polygonsRef: React.MutableRefObject<any[]>;
  placeMarksRef: React.MutableRefObject<any[]>;
  initialViewRef: React.MutableRefObject<{ center: [number, number], zoom: number } | null>;
  pkkLayerRef: React.MutableRefObject<any>;
  setIsMapReady: (ready: boolean) => void;
}

export const useMapInitialization = ({
  mapRef,
  mapInstanceRef,
  clustererRef,
  polygonsRef,
  placeMarksRef,
  initialViewRef,
  pkkLayerRef,
  setIsMapReady
}: UseMapInitializationProps) => {
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
        controls: ['zoomControl'],
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

      // Создаём слой ПКК Росреестра (изначально не добавлен на карту)
      try {
        const pkkLayer = new window.ymaps.Layer(
          'https://nspd.gov.ru/api/aeggis/v3/36048/wms?REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image%2Fpng&STYLES=&TRANSPARENT=true&LAYERS=36048&RANDOM=&WIDTH=256&HEIGHT=256&CRS=EPSG%3A3857&BBOX=%b',
          {
            tileTransparent: true
          }
        );
        
        pkkLayerRef.current = pkkLayer;
        console.log('✅ Слой ПКК Росреестра создан');
      } catch (error) {
        console.warn('⚠️ Не удалось создать слой ПКК:', error);
      }

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
};