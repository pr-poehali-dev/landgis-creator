import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface FilterControlsProps {
  isOpen: boolean;
  activeCount: number;
  onToggle: () => void;
  onLayersClick?: () => void;
}

const FilterControls = ({ isOpen, activeCount, onToggle, onLayersClick }: FilterControlsProps) => {
  return (
    <div className="absolute top-3 right-3 z-40 flex gap-2">
      <Button
        onClick={onToggle}
        variant={isOpen || activeCount > 0 ? 'default' : 'outline'}
        className={cn(
          "shadow-lg gap-2 h-9 text-sm font-semibold hover:opacity-90",
          "px-2 md:px-4 md:w-[110px]",
          (isOpen || activeCount > 0) ? "bg-accent text-accent-foreground" : ""
        )}
      >
        <Icon name="Filter" size={20} className="flex-shrink-0" />
        <span className="hidden md:inline">Фильтры</span>
        {activeCount > 0 && (
          <Badge variant="secondary" className="ml-1 bg-white text-foreground">
            {activeCount}
          </Badge>
        )}
      </Button>
      
      {onLayersClick && (
        <Button
          onClick={onLayersClick}
          variant="outline"
          className="shadow-lg gap-2 h-9 text-sm font-semibold hover:opacity-90 px-2 md:px-4 md:w-[110px]"
        >
          <Icon name="Layers" size={16} className="flex-shrink-0" />
          <span className="hidden md:inline">Слои</span>
        </Button>
      )}
    </div>
  );
};

export default FilterControls;