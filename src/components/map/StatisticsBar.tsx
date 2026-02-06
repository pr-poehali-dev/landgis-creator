import Icon from '@/components/ui/icon';
import { Property } from '@/services/propertyService';

interface StatisticsBarProps {
  properties: Property[];
}

const StatisticsBar = ({ properties }: StatisticsBarProps) => {
  const availableCount = properties.filter(p => p.attributes?.status_publ === 'Доступно').length;
  const reservedCount = properties.filter(p => p.attributes?.status_publ === 'Резерв').length;
  const soldCount = properties.filter(p => p.attributes?.status_publ === 'Продано').length;

  return (
    <div className="hidden sm:flex h-14 border-t border-border bg-card/30 backdrop-blur px-3 lg:px-4 items-center justify-between">
      <div className="flex gap-2 lg:gap-4 text-[11px]">
        <span className="text-muted-foreground">
          <span className="hidden md:inline">Доступно: </span>
          <span className="font-semibold text-foreground">{availableCount}</span>
        </span>
        <span className="text-muted-foreground">
          <span className="hidden md:inline">Резерв: </span>
          <span className="font-semibold text-foreground">{reservedCount}</span>
        </span>
        <span className="text-muted-foreground">
          <span className="hidden md:inline">Продано: </span>
          <span className="font-semibold text-foreground">{soldCount}</span>
        </span>
      </div>

      <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon name="Sparkles" size={12} className="text-secondary" />
        <span>AI-кластеризация активна</span>
      </div>
    </div>
  );
};

export default StatisticsBar;