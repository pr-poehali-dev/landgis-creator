import { useRef, useState, useCallback, useEffect } from 'react';
import { propertyService } from '@/services/propertyService';
import { toast } from 'sonner';

interface BoundaryEditState {
  isActive: boolean;
  propertyId: number | null;
  originalBoundary: Array<[number, number]> | null;
  editedBoundary: Array<[number, number]>;
  isSaving: boolean;
}

interface UseBoundaryMapEditProps {
  mapInstanceRef: React.MutableRefObject<any>;
  polygonsRef: React.MutableRefObject<any[]>;
  isMapReady: boolean;
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

export const useBoundaryMapEdit = ({
  mapInstanceRef,
  polygonsRef,
  isMapReady
}: UseBoundaryMapEditProps) => {
  const [editState, setEditState] = useState<BoundaryEditState>({
    isActive: false,
    propertyId: null,
    originalBoundary: null,
    editedBoundary: [],
    isSaving: false
  });

  const editPolygonRef = useRef<any>(null);
  const vertexMarkersRef = useRef<any[]>([]);
  const midpointMarkersRef = useRef<any[]>([]);
  const editStateRef = useRef(editState);
  editStateRef.current = editState;
  const onCompleteCallbackRef = useRef<((boundary: Array<[number, number]>, coordinates: [number, number]) => void) | null>(null);

  const calculateCenter = (points: Array<[number, number]>): [number, number] => {
    const lat = points.reduce((sum, c) => sum + c[0], 0) / points.length;
    const lon = points.reduce((sum, c) => sum + c[1], 0) / points.length;
    return [lat, lon];
  };

  const clearEditObjects = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (editPolygonRef.current) {
      map.geoObjects.remove(editPolygonRef.current);
      editPolygonRef.current = null;
    }

    vertexMarkersRef.current.forEach(m => map.geoObjects.remove(m));
    vertexMarkersRef.current = [];

    midpointMarkersRef.current.forEach(m => map.geoObjects.remove(m));
    midpointMarkersRef.current = [];
  }, [mapInstanceRef]);

  const rebuildEditOverlay = useCallback((points: Array<[number, number]>) => {
    const map = mapInstanceRef.current;
    if (!map || !window.ymaps) return;

    clearEditObjects();

    if (points.length < 2) {
      points.forEach((coord, i) => {
        const marker = new window.ymaps.Placemark(
          coord,
          {},
          {
            iconLayout: 'default#image',
            iconImageHref: createVertexSvg(VERTEX_COLOR, 18),
            iconImageSize: [18, 18],
            iconImageOffset: [-9, -9],
            draggable: true,
            zIndex: 2000
          }
        );

        marker.events.add('dragend', () => {
          const newCoords = marker.geometry.getCoordinates();
          setEditState(prev => {
            const updated = [...prev.editedBoundary];
            updated[i] = [newCoords[0], newCoords[1]];
            setTimeout(() => rebuildEditOverlay(updated), 0);
            return { ...prev, editedBoundary: updated };
          });
        });

        map.geoObjects.add(marker);
        vertexMarkersRef.current.push(marker);
      });
      return;
    }

    const polygon = new window.ymaps.Polygon(
      [points],
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
    map.geoObjects.add(polygon);
    editPolygonRef.current = polygon;

    polygon.events.add('click', (e: any) => {
      const coords = e.get('coords');
      if (!coords) return;

      const currentPoints = editStateRef.current.editedBoundary;
      if (currentPoints.length < 2) {
        const newPoints = [...currentPoints, [coords[0], coords[1]] as [number, number]];
        setEditState(prev => ({ ...prev, editedBoundary: newPoints }));
        rebuildEditOverlay(newPoints);
        return;
      }

      let bestIndex = 0;
      let bestDist = Infinity;
      for (let i = 0; i < currentPoints.length; i++) {
        const j = (i + 1) % currentPoints.length;
        const dist = distToSegment(coords, currentPoints[i], currentPoints[j]);
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = j;
        }
      }
      const newPoints = [...currentPoints];
      newPoints.splice(bestIndex, 0, [coords[0], coords[1]]);
      setEditState(prev => ({ ...prev, editedBoundary: newPoints }));
      rebuildEditOverlay(newPoints);
    });

    points.forEach((coord, i) => {
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

      marker.events.add('drag', () => {
        const newCoords = marker.geometry.getCoordinates();
        const currentPoints = [...editStateRef.current.editedBoundary];
        currentPoints[i] = [newCoords[0], newCoords[1]];

        if (editPolygonRef.current) {
          editPolygonRef.current.geometry.setCoordinates([currentPoints]);
        }

        midpointMarkersRef.current.forEach(m => map.geoObjects.remove(m));
        midpointMarkersRef.current = [];
      });

      marker.events.add('dragend', () => {
        const newCoords = marker.geometry.getCoordinates();
        setEditState(prev => {
          const updated = [...prev.editedBoundary];
          updated[i] = [newCoords[0], newCoords[1]];
          setTimeout(() => rebuildEditOverlay(updated), 0);
          return { ...prev, editedBoundary: updated };
        });
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

      marker.events.add('contextmenu', (e: any) => {
        e.get('domEvent').originalEvent.preventDefault();
        const currentPoints = editStateRef.current.editedBoundary;
        if (currentPoints.length <= 3) {
          toast.error('Минимум 3 точки');
          return;
        }
        const newPoints = currentPoints.filter((_, idx) => idx !== i);
        setEditState(prev => ({ ...prev, editedBoundary: newPoints }));
        rebuildEditOverlay(newPoints);
      });

      marker.events.add('dblclick', (e: any) => {
        e.get('domEvent').originalEvent.preventDefault();
        const currentPoints = editStateRef.current.editedBoundary;
        if (currentPoints.length <= 3) {
          toast.error('Минимум 3 точки');
          return;
        }
        const newPoints = currentPoints.filter((_, idx) => idx !== i);
        setEditState(prev => ({ ...prev, editedBoundary: newPoints }));
        rebuildEditOverlay(newPoints);
      });

      map.geoObjects.add(marker);
      vertexMarkersRef.current.push(marker);
    });

    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const midLat = (points[i][0] + points[j][0]) / 2;
      const midLon = (points[i][1] + points[j][1]) / 2;

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
        const currentPoints = [...editStateRef.current.editedBoundary];
        currentPoints.splice(insertIdx, 0, [midLat, midLon]);
        setEditState(prev => ({ ...prev, editedBoundary: currentPoints }));
        rebuildEditOverlay(currentPoints);
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
  }, [mapInstanceRef, clearEditObjects]);

  const hideSourcePolygon = useCallback((propertyId: number) => {
    polygonsRef.current.forEach((polygon: any) => {
      if ((polygon as any).__propertyId === propertyId) {
        polygon.options.set('visible', false);
      }
    });
  }, [polygonsRef]);

  const showSourcePolygon = useCallback((propertyId: number) => {
    polygonsRef.current.forEach((polygon: any) => {
      if ((polygon as any).__propertyId === propertyId) {
        polygon.options.set('visible', true);
      }
    });
  }, [polygonsRef]);

  const startEdit = useCallback((
    propertyId: number,
    boundary: Array<[number, number]>,
    onComplete: (boundary: Array<[number, number]>, coordinates: [number, number]) => void
  ) => {
    if (!mapInstanceRef.current || !isMapReady) return;

    const points = boundary.length > 0 ? [...boundary] : [];

    onCompleteCallbackRef.current = onComplete;

    setEditState({
      isActive: true,
      propertyId,
      originalBoundary: [...boundary],
      editedBoundary: points,
      isSaving: false
    });

    hideSourcePolygon(propertyId);
    
    mapInstanceRef.current.behaviors.disable('dblClickZoom');

    rebuildEditOverlay(points);
  }, [mapInstanceRef, isMapReady, hideSourcePolygon, rebuildEditOverlay]);

  const cancelEdit = useCallback(() => {
    const { propertyId } = editStateRef.current;

    clearEditObjects();

    if (propertyId) {
      showSourcePolygon(propertyId);
    }

    mapInstanceRef.current?.behaviors.enable('dblClickZoom');

    setEditState({
      isActive: false,
      propertyId: null,
      originalBoundary: null,
      editedBoundary: [],
      isSaving: false
    });

    onCompleteCallbackRef.current = null;
  }, [clearEditObjects, showSourcePolygon, mapInstanceRef]);

  const saveEdit = useCallback(async () => {
    const { propertyId, editedBoundary } = editStateRef.current;
    if (!propertyId) return;

    if (editedBoundary.length < 3) {
      toast.error('Нужно минимум 3 точки для границы');
      return;
    }

    setEditState(prev => ({ ...prev, isSaving: true }));

    try {
      const newCenter = calculateCenter(editedBoundary);

      await propertyService.updateProperty(propertyId, {
        boundary: editedBoundary,
        coordinates: newCenter
      });

      clearEditObjects();
      
      if (propertyId) {
        showSourcePolygon(propertyId);
      }

      mapInstanceRef.current?.behaviors.enable('dblClickZoom');

      if (onCompleteCallbackRef.current) {
        onCompleteCallbackRef.current(editedBoundary, newCenter);
      }

      toast.success('Границы сохранены');

      setEditState({
        isActive: false,
        propertyId: null,
        originalBoundary: null,
        editedBoundary: [],
        isSaving: false
      });

      onCompleteCallbackRef.current = null;
    } catch (error) {
      console.error('Error saving boundary:', error);
      toast.error('Не удалось сохранить границы');
      setEditState(prev => ({ ...prev, isSaving: false }));
    }
  }, [clearEditObjects, showSourcePolygon, mapInstanceRef]);

  const undoLastPoint = useCallback(() => {
    const { editedBoundary } = editStateRef.current;
    if (editedBoundary.length <= 3) {
      toast.error('Минимум 3 точки');
      return;
    }
    const newPoints = editedBoundary.slice(0, -1);
    setEditState(prev => ({ ...prev, editedBoundary: newPoints }));
    rebuildEditOverlay(newPoints);
  }, [rebuildEditOverlay]);

  useEffect(() => {
    return () => {
      clearEditObjects();
    };
  }, [clearEditObjects]);

  return {
    editState,
    startEdit,
    cancelEdit,
    saveEdit,
    undoLastPoint
  };
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

export default useBoundaryMapEdit;
