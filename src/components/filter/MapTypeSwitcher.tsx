import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface MapTypeSwitcherProps {
  mapType: 'scheme' | 'hybrid';
  onMapTypeChange: (type: 'scheme' | 'hybrid') => void;
}

const MapTypeSwitcher = ({ mapType, onMapTypeChange }: MapTypeSwitcherProps) => {
  return (
    <div className="absolute top-4 left-4 z-40">
      <div className="inline-flex rounded-lg border border-border bg-muted/50 shadow-lg backdrop-blur h-12 p-0.5">
        <Button
          onClick={() => onMapTypeChange('scheme')}
          variant="ghost"
          className={cn(
            "gap-2 px-4 h-full text-base font-semibold rounded-md transition-all",
            mapType === 'scheme' ? "bg-accent text-accent-foreground shadow-sm" : "hover:bg-muted"
          )}
        >
          <Icon name="Map" size={20} className="flex-shrink-0" />
          <span className="hidden md:inline">Схема</span>
        </Button>
        <Button
          onClick={() => onMapTypeChange('hybrid')}
          variant="ghost"
          className={cn(
            "gap-2 px-4 h-full text-base font-semibold rounded-md transition-all",
            mapType === 'hybrid' ? "bg-accent text-accent-foreground shadow-sm" : "hover:bg-muted"
          )}
        >
          <Icon name="Satellite" size={20} className="flex-shrink-0" />
          <span className="hidden md:inline">Гибрид</span>
        </Button>
      </div>
    </div>
  );
};

export default MapTypeSwitcher;
