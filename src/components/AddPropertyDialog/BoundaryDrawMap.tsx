import { useRef, useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

declare global {
  interface Window {
    ymaps: any;
  }
}

interface BoundaryDrawMapProps {
  points: Array<[number, number]>;
  onPointsChange: (points: Array<[number, number]>) => void;
  onApply: () => void;
  onCancel: () => void;
}

const VERTEX_COLOR = '#3b82f6';
const VERTEX_HOVER_COLOR = '#1d4ed8';
const MIDPOINT_COLOR = '#94a3b8';
const EDIT_POLYGON_FILL = '#3b82f680';
const EDIT_POLYGON_STROKE = '#3b82f6';

const createVertexSvg = (color: string, size: number) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="${color}" stroke="white" stroke-width="2"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

const createMidpointSvg = (color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.7"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

function distToSegment(p: number[], a: [number, number], b: [number, number]): number {
  const dx = b[1] - a[1];
  const dy = b[0] - a[0];
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const ddx = p[1] - a[1];
    const ddy = p[0] - a[0];
    return Math.sqrt(ddx * ddx + ddy * ddy);
  }
  let t = ((p[1] - a[1]) * dx + (p[0] - a[0]) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projLon = a[1] + t * dx;
  const projLat = a[0] + t * dy;
  const ddx = p[1] - projLon;
  const ddy = p[0] - projLat;
  return Math.sqrt(ddx * ddx + ddy * ddy);
}

const BoundaryDrawMap = ({ points, onPointsChange, onApply, onCancel }: BoundaryDrawMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const vertexMarkersRef = useRef<any[]>([]);
  const midpointMarkersRef = useRef<any[]>([]);
  const pointsRef = useRef(points);
  const [isMapReady, setIsMapReady] = useState(false);
  pointsRef.current = points;

  useEffect(() => {
    if (!window.ymaps || !mapContainerRef.current) return;

    let mapInstance: any = null;

    window.ymaps.ready(() => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      mapInstance = new window.ymaps.Map(mapContainerRef.current, {
        center: [55.751244, 37.618423],
        zoom: 12,
        controls: ['zoomControl', 'searchControl'],
        suppressMapOpenBlock: true,
      }, {
        autoFitToViewport: 'always',
        minZoom: 3,
        maxZoom: 19
      });

      mapInstance.behaviors.disable('dblClickZoom');
      mapInstanceRef.current = mapInstance;
      setIsMapReady(true);

      mapInstance.events.add('click', (e: any) => {
        const coords = e.get('coords');
        if (!coords) return;
        const newPoint: [number, number] = [coords[0], coords[1]];
        const updated = [...pointsRef.current, newPoint];
        onPointsChange(updated);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const clearOverlay = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (polygonRef.current) {
      map.geoObjects.remove(polygonRef.current);
      polygonRef.current = null;
    }
    vertexMarkersRef.current.forEach(m => map.geoObjects.remove(m));
    vertexMarkersRef.current = [];
    midpointMarkersRef.current.forEach(m => map.geoObjects.remove(m));
    midpointMarkersRef.current = [];
  }, []);

  const rebuildOverlay = useCallback((pts: Array<[number, number]>) => {
    const map = mapInstanceRef.current;
    if (!map || !window.ymaps) return;

    clearOverlay();

    if (pts.length === 0) return;

    pts.forEach((coord, i) => {
      const marker = new window.ymaps.Placemark(
        coord,
        {},
        {
          iconLayout: 'default#image',
          iconImageHref: createVertexSvg(VERTEX_COLOR, 18),
          iconImageSize: [18, 18],
          iconImageOffset: [-9, -9],
          draggable: true,
          zIndex: 2000,
          cursor: 'grab'
        }
      );

      marker.events.add('dragend', () => {
        const newCoords = marker.geometry.getCoordinates();
        const updated = [...pointsRef.current];
        updated[i] = [newCoords[0], newCoords[1]];
        onPointsChange(updated);
      });

      marker.events.add('drag', () => {
        const newCoords = marker.geometry.getCoordinates();
        const currentPts = [...pointsRef.current];
        currentPts[i] = [newCoords[0], newCoords[1]];
        if (polygonRef.current && currentPts.length >= 3) {
          polygonRef.current.geometry.setCoordinates([currentPts]);
        }
        midpointMarkersRef.current.forEach(m => map.geoObjects.remove(m));
        midpointMarkersRef.current = [];
      });

      marker.events.add('mouseenter', () => {
        marker.options.set('iconImageHref', createVertexSvg(VERTEX_HOVER_COLOR, 22));
        marker.options.set('iconImageSize', [22, 22]);
        marker.options.set('iconImageOffset', [-11, -11]);
      });

      marker.events.add('mouseleave', () => {
        marker.options.set('iconImageHref', createVertexSvg(VERTEX_COLOR, 18));
        marker.options.set('iconImageSize', [18, 18]);
        marker.options.set('iconImageOffset', [-9, -9]);
      });

      marker.events.add('dblclick', (e: any) => {
        e.get('domEvent').originalEvent.preventDefault();
        e.get('domEvent').originalEvent.stopPropagation();
        const currentPts = pointsRef.current;
        if (currentPts.length <= 3) {
          toast.error('Минимум 3 точки');
          return;
        }
        const newPts = currentPts.filter((_, idx) => idx !== i);
        onPointsChange(newPts);
      });

      marker.events.add('contextmenu', (e: any) => {
        e.get('domEvent').originalEvent.preventDefault();
        const currentPts = pointsRef.current;
        if (currentPts.length <= 3) {
          toast.error('Минимум 3 точки');
          return;
        }
        const newPts = currentPts.filter((_, idx) => idx !== i);
        onPointsChange(newPts);
      });

      map.geoObjects.add(marker);
      vertexMarkersRef.current.push(marker);
    });

    if (pts.length >= 3) {
      const polygon = new window.ymaps.Polygon(
        [pts],
        {},
        {
          fillColor: EDIT_POLYGON_FILL,
          strokeColor: EDIT_POLYGON_STROKE,
          strokeWidth: 2,
          strokeStyle: 'dash',
          fillOpacity: 0.3,
          zIndex: 1500
        }
      );

      polygon.events.add('click', (e: any) => {
        const coords = e.get('coords');
        if (!coords) return;
        const currentPts = pointsRef.current;
        if (currentPts.length < 2) return;

        let bestIndex = 0;
        let bestDist = Infinity;
        for (let i = 0; i < currentPts.length; i++) {
          const j = (i + 1) % currentPts.length;
          const dist = distToSegment(coords, currentPts[i], currentPts[j]);
          if (dist < bestDist) {
            bestDist = dist;
            bestIndex = j;
          }
        }
        const newPts = [...currentPts];
        newPts.splice(bestIndex, 0, [coords[0], coords[1]]);
        onPointsChange(newPts);
      });

      map.geoObjects.add(polygon);
      polygonRef.current = polygon;

      for (let i = 0; i < pts.length; i++) {
        const j = (i + 1) % pts.length;
        const midLat = (pts[i][0] + pts[j][0]) / 2;
        const midLon = (pts[i][1] + pts[j][1]) / 2;

        const midMarker = new window.ymaps.Placemark(
          [midLat, midLon],
          {},
          {
            iconLayout: 'default#image',
            iconImageHref: createMidpointSvg(MIDPOINT_COLOR),
            iconImageSize: [14, 14],
            iconImageOffset: [-7, -7],
            zIndex: 1800,
            cursor: 'pointer'
          }
        );

        const insertIdx = j;
        midMarker.events.add('click', () => {
          const currentPts = [...pointsRef.current];
          currentPts.splice(insertIdx, 0, [midLat, midLon]);
          onPointsChange(currentPts);
        });

        midMarker.events.add('mouseenter', () => {
          midMarker.options.set('iconImageHref', createMidpointSvg(VERTEX_COLOR));
          midMarker.options.set('iconImageSize', [16, 16]);
          midMarker.options.set('iconImageOffset', [-8, -8]);
        });

        midMarker.events.add('mouseleave', () => {
          midMarker.options.set('iconImageHref', createMidpointSvg(MIDPOINT_COLOR));
          midMarker.options.set('iconImageSize', [14, 14]);
          midMarker.options.set('iconImageOffset', [-7, -7]);
        });

        map.geoObjects.add(midMarker);
        midpointMarkersRef.current.push(midMarker);
      }
    }
  }, [clearOverlay, onPointsChange]);

  useEffect(() => {
    if (!isMapReady) return;
    rebuildOverlay(points);
  }, [points, isMapReady, rebuildOverlay]);

  const handleUndo = () => {
    if (points.length === 0) return;
    onPointsChange(points.slice(0, -1));
  };

  const handleClear = () => {
    onPointsChange([]);
  };

  return (
    <div className="space-y-2 border border-border rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm font-medium">Рисование границ</span>
          <Badge variant="secondary" className="text-xs">
            {points.length} точек
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleUndo}
            disabled={points.length === 0}
            title="Отменить последнюю точку"
          >
            <Icon name="Undo2" size={14} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
            onClick={handleClear}
            disabled={points.length === 0}
            title="Очистить все точки"
          >
            <Icon name="Trash2" size={14} />
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground px-3 -mt-1">
        Кликайте на карту для добавления точек. Тяните точку для перемещения. 2× клик = удалить.
      </p>

      <div ref={mapContainerRef} className="w-full h-[350px]" />

      <div className="flex gap-2 px-3 pb-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onCancel}
        >
          Отмена
        </Button>
        <Button
          type="button"
          size="sm"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={onApply}
          disabled={points.length < 3}
        >
          <Icon name="Check" size={14} className="mr-1" />
          Применить ({points.length} точек)
        </Button>
      </div>

      {points.length > 0 && points.length < 3 && (
        <p className="text-xs text-amber-500 flex items-center gap-1 px-3 pb-2">
          <Icon name="AlertTriangle" size={12} />
          Добавьте ещё {3 - points.length} точ{3 - points.length === 1 ? 'ку' : 'ки'}
        </p>
      )}
    </div>
  );
};

export default BoundaryDrawMap;
