import Icon from '@/components/ui/icon';
import { Property } from '@/services/propertyService';

interface StatisticsBarProps {
  properties: Property[];
}

const StatisticsBar = ({ properties }: StatisticsBarProps) => {
  return (
    <div className="hidden sm:flex h-14 border-t border-border bg-card/30 backdrop-blur px-3 lg:px-4 items-center justify-between">
      <div className="flex gap-2 lg:gap-4 text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
          <span className="text-muted-foreground"><span className="hidden md:inline">Доступно: </span><span className="font-semibold text-foreground">{properties.filter(p => p.status === 'available').length}</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
          <span className="text-muted-foreground"><span className="hidden md:inline">Резерв: </span><span className="font-semibold text-foreground">{properties.filter(p => p.status === 'reserved').length}</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-500"></div>
          <span className="text-muted-foreground"><span className="hidden md:inline">Продано: </span><span className="font-semibold text-foreground">{properties.filter(p => p.status === 'sold').length}</span></span>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon name="Sparkles" size={12} className="text-secondary" />
        <span>AI-кластеризация активна</span>
      </div>
    </div>
  );
};

export default StatisticsBar;
