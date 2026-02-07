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
    <div className="fixed top-4 right-4 z-40 flex gap-2" style={{ position: 'fixed' }}>
      <Button
        onClick={onToggle}
        variant={isOpen || activeCount > 0 ? 'default' : 'outline'}
        className={cn(
          "shadow-lg gap-2 h-12 text-base font-semibold hover:opacity-90",
          "px-3 md:px-6 md:w-[140px]",
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
          className="shadow-lg gap-2 h-12 text-base font-semibold hover:opacity-90 px-3 md:px-6 md:w-[140px]"
        >
          <Icon name="Layers" size={20} className="flex-shrink-0" />
          <span className="hidden md:inline">Слои</span>
        </Button>
      )}
    </div>
  );
};

export default FilterControls;