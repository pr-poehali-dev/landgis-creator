import { useState, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import BoundaryDrawMap from './BoundaryDrawMap';

interface KmlUploadSectionProps {
  kmlFile: File | null;
  isParsingKml: boolean;
  onKmlUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  boundary?: Array<[number, number]>;
  onBoundaryChange?: (boundary: Array<[number, number]> | undefined, center?: [number, number]) => void;
}

type EditMode = 'none' | 'manual' | 'map';

export const KmlUploadSection = ({ kmlFile, isParsingKml, onKmlUpload, boundary, onBoundaryChange }: KmlUploadSectionProps) => {
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [editedPoints, setEditedPoints] = useState<Array<[number, number]>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartManualEdit = () => {
    setEditedPoints(boundary || []);
    setEditMode('manual');
  };

  const handleStartMapDraw = () => {
    setEditedPoints(boundary || []);
    setEditMode('map');
  };

  const handlePointChange = (index: number, coord: 0 | 1, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setEditedPoints(prev => {
      const updated = [...prev];
      updated[index] = [...updated[index]] as [number, number];
      updated[index][coord] = num;
      return updated;
    });
  };

  const handleDeletePoint = (index: number) => {
    if (editedPoints.length <= 3) {
      toast.error('Минимум 3 точки для границы');
      return;
    }
    setEditedPoints(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddPoint = () => {
    if (editedPoints.length === 0) {
      setEditedPoints([[55.751244, 37.618423]]);
      return;
    }
    const last = editedPoints[editedPoints.length - 1];
    setEditedPoints(prev => [...prev, [last[0] + 0.0001, last[1] + 0.0001]]);
  };

  const calculateCenter = (pts: Array<[number, number]>): [number, number] => {
    const lat = pts.reduce((sum, c) => sum + c[0], 0) / pts.length;
    const lon = pts.reduce((sum, c) => sum + c[1], 0) / pts.length;
    return [lat, lon];
  };

  const handleApply = () => {
    if (editedPoints.length < 3) {
      toast.error('Нужно минимум 3 точки для границы');
      return;
    }
    onBoundaryChange?.(editedPoints, calculateCenter(editedPoints));
    setEditMode('none');
    toast.success(`Задано ${editedPoints.length} точек границы`);
  };

  const handleCancel = () => {
    setEditedPoints([]);
    setEditMode('none');
  };

  const handleClearBoundary = () => {
    onBoundaryChange?.(undefined);
    setEditedPoints([]);
    setEditMode('none');
  };

  const handleMapPointsChange = useCallback((pts: Array<[number, number]>) => {
    setEditedPoints(pts);
  }, []);

  const handleMapApply = useCallback(() => {
    if (editedPoints.length < 3) {
      toast.error('Нужно минимум 3 точки для границы');
      return;
    }
    onBoundaryChange?.(editedPoints, calculateCenter(editedPoints));
    setEditMode('none');
    toast.success(`Задано ${editedPoints.length} точек границы`);
  }, [editedPoints, onBoundaryChange]);

  const pointCount = boundary?.length || 0;

  if (editMode === 'map') {
    return (
      <BoundaryDrawMap
        points={editedPoints}
        onPointsChange={handleMapPointsChange}
        onApply={handleMapApply}
        onCancel={handleCancel}
      />
    );
  }

  if (editMode === 'manual') {
    return (
      <div className="space-y-3 border border-border rounded-md p-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Icon name="Pentagon" size={14} className="text-primary" />
            Ручной ввод точек
          </Label>
          <span className="text-xs text-muted-foreground">
            {editedPoints.length} точек
          </span>
        </div>

        <div className="max-h-[250px] overflow-y-auto space-y-1.5">
          {editedPoints.map((point, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-5 text-right text-xs text-muted-foreground/60 shrink-0">{i + 1}.</span>
              <Input
                type="number"
                step="0.000001"
                value={point[0]}
                onChange={(e) => handlePointChange(i, 0, e.target.value)}
                className="h-7 text-xs font-mono flex-1"
                placeholder="Широта"
              />
              <Input
                type="number"
                step="0.000001"
                value={point[1]}
                onChange={(e) => handlePointChange(i, 1, e.target.value)}
                className="h-7 text-xs font-mono flex-1"
                placeholder="Долгота"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => handleDeletePoint(i)}
              >
                <Icon name="X" size={12} />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          onClick={handleAddPoint}
        >
          <Icon name="Plus" size={14} />
          Добавить точку
        </Button>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleCancel}
          >
            Отмена
          </Button>
          <Button
            type="button"
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleApply}
            disabled={editedPoints.length < 3}
          >
            <Icon name="Check" size={14} className="mr-1" />
            Применить ({editedPoints.length} точек)
          </Button>
        </div>

        {editedPoints.length > 0 && editedPoints.length < 3 && (
          <p className="text-xs text-amber-500 flex items-center gap-1">
            <Icon name="AlertTriangle" size={12} />
            Добавьте минимум {3 - editedPoints.length} точ{editedPoints.length === 2 ? 'ку' : 'ки'}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pointCount > 0 && (
        <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-md">
          <Icon name="Check" size={16} className="text-green-500" />
          <span className="text-sm text-green-700 dark:text-green-400">
            Граница задана ({pointCount} точек)
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={handleClearBoundary}
          >
            <Icon name="X" size={12} />
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="kml-upload" className="text-sm font-medium mb-1.5 block">
            KML файл
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="kml-upload"
              type="file"
              accept=".kml"
              onChange={onKmlUpload}
              className="flex-1"
            />
            {isParsingKml && (
              <Icon name="Loader2" size={16} className="animate-spin text-primary" />
            )}
            {kmlFile && !isParsingKml && (
              <Icon name="Check" size={16} className="text-green-500" />
            )}
          </div>
        </div>
      </div>

      <div className="relative flex items-center gap-2">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-muted-foreground px-2">или</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={handleStartMapDraw}
        >
          <Icon name="MousePointer2" size={14} />
          Нарисовать на карте
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={handleStartManualEdit}
        >
          <Icon name="Pencil" size={14} />
          Ввести координаты
        </Button>
      </div>
    </div>
  );
};
