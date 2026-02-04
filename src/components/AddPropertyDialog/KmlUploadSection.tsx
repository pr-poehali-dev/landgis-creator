import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface KmlUploadSectionProps {
  kmlFile: File | null;
  isParsingKml: boolean;
  onKmlUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const KmlUploadSection = ({ kmlFile, isParsingKml, onKmlUpload }: KmlUploadSectionProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="kml-upload" className="text-sm font-medium">
        KML файл границ участка
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
      <p className="text-xs text-muted-foreground">
        Загрузите KML файл для автоматического определения границ участка
      </p>
    </div>
  );
};
