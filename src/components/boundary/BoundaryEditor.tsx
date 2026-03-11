import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';
import { propertyService } from '@/services/propertyService';

interface BoundaryEditorProps {
  propertyId: number;
  boundary?: Array<[number, number]>;
  coordinates: [number, number];
  onBoundaryUpdate: (boundary: Array<[number, number]>, coordinates: [number, number]) => void;
  onStartMapEdit?: () => void;
}

const BoundaryEditor = ({ propertyId, boundary, coordinates, onBoundaryUpdate, onStartMapEdit }: BoundaryEditorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPoints, setEditedPoints] = useState<Array<[number, number]>>(boundary || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isParsingKml, setIsParsingKml] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseKmlFile = async (file: File) => {
    setIsParsingKml(true);
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');

      const coordinatesEl = xmlDoc.getElementsByTagName('coordinates')[0]?.textContent?.trim();

      if (!coordinatesEl) {
        toast.error('Не удалось найти координаты в KML файле');
        return;
      }

      const coords = coordinatesEl
        .split(/\s+/)
        .map(coord => {
          const [lon, lat] = coord.split(',').map(Number);
          return [lat, lon] as [number, number];
        })
        .filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));

      if (coords.length < 3) {
        toast.error('KML должен содержать минимум 3 точки');
        return;
      }

      setEditedPoints(coords);
      setIsEditing(true);
      toast.success(`Загружено ${coords.length} точек из KML`);
    } catch (error) {
      console.error('KML parse error:', error);
      toast.error('Ошибка чтения KML файла');
    } finally {
      setIsParsingKml(false);
    }
  };

  const handleKmlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.kml')) {
      toast.error('Выберите файл формата .kml');
      return;
    }

    parseKmlFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      setEditedPoints([[coordinates[0], coordinates[1]]]);
      return;
    }
    const last = editedPoints[editedPoints.length - 1];
    setEditedPoints(prev => [...prev, [last[0] + 0.0001, last[1] + 0.0001]]);
  };

  const calculateCenter = (points: Array<[number, number]>): [number, number] => {
    const lat = points.reduce((sum, c) => sum + c[0], 0) / points.length;
    const lon = points.reduce((sum, c) => sum + c[1], 0) / points.length;
    return [lat, lon];
  };

  const handleSave = async () => {
    if (editedPoints.length < 3) {
      toast.error('Нужно минимум 3 точки для границы');
      return;
    }

    setIsSaving(true);
    try {
      const newCenter = calculateCenter(editedPoints);

      await propertyService.updateProperty(propertyId, {
        boundary: editedPoints,
        coordinates: newCenter
      });

      onBoundaryUpdate(editedPoints, newCenter);
      setIsEditing(false);
      toast.success('Границы обновлены');
    } catch (error) {
      console.error('Error saving boundary:', error);
      toast.error('Не удалось сохранить границы');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedPoints(boundary || []);
    setIsEditing(false);
  };

  const startManualEdit = () => {
    setEditedPoints(boundary || []);
    setIsEditing(true);
  };

  const pointCount = boundary?.length || 0;
  const displayPoints = isEditing ? editedPoints : (boundary || []);

  return (
    <Card className="border-dashed">
      <CardHeader
        className="pb-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Icon name="Pentagon" size={16} className="text-primary" />
            Границы участка
          </CardTitle>
          <div className="flex items-center gap-2">
            {pointCount > 0 ? (
              <Badge variant="secondary" className="text-xs">
                {pointCount} точек
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Не задано
              </Badge>
            )}
            <Icon
              name="ChevronDown"
              size={16}
              className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-3">
          {!isEditing ? (
            <>
              {onStartMapEdit && boundary && boundary.length >= 3 && (
                <Button
                  variant="default"
                  size="sm"
                  className="w-full gap-1.5 bg-blue-600 hover:bg-blue-700 text-white mb-2"
                  onClick={onStartMapEdit}
                >
                  <Icon name="MousePointer2" size={14} />
                  Редактировать на карте
                </Button>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={startManualEdit}
                >
                  <Icon name="Pencil" size={14} />
                  Точки вручную
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon name="Upload" size={14} />
                  Загрузить KML
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".kml"
                onChange={handleKmlUpload}
                className="hidden"
              />

              {isParsingKml && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon name="Loader2" size={14} className="animate-spin" />
                  Загрузка KML...
                </div>
              )}

              {displayPoints.length > 0 && (
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {displayPoints.map((point, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded">
                      <span className="w-5 text-right text-muted-foreground/50">{i + 1}.</span>
                      <span>{point[0].toFixed(6)}, {point[1].toFixed(6)}</span>
                    </div>
                  ))}
                </div>
              )}

              {displayPoints.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Границы не заданы. Загрузите KML файл или добавьте точки вручную.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  {editedPoints.length} точек
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Icon name="Upload" size={12} />
                    KML
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={handleAddPoint}
                  >
                    <Icon name="Plus" size={12} />
                    Точка
                  </Button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".kml"
                onChange={handleKmlUpload}
                className="hidden"
              />

              {isParsingKml && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon name="Loader2" size={14} className="animate-spin" />
                  Загрузка KML...
                </div>
              )}

              <div className="max-h-[300px] overflow-y-auto space-y-1.5">
                {editedPoints.map((point, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground w-4 text-right shrink-0">{i + 1}</span>
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
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-red-500 hover:text-red-600"
                      onClick={() => handleDeletePoint(i)}
                    >
                      <Icon name="X" size={12} />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleCancel}
                >
                  Отмена
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleSave}
                  disabled={isSaving || editedPoints.length < 3}
                >
                  {isSaving ? (
                    <>
                      <Icon name="Loader2" size={14} className="animate-spin mr-1" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Icon name="Check" size={14} className="mr-1" />
                      Сохранить границы
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default BoundaryEditor;