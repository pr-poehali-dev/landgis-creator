import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterColumn {
  id: string;
  label: string;
  options: FilterOption[];
}

interface FilterPanelContentProps {
  isOpen: boolean;
  activeFilters: Array<{ column: string; value: string; label: string }>;
  activeCount: number;
  columns: FilterColumn[];
  localFilters: Record<string, string[]>;
  onToggle: () => void;
  clearFilters: () => void;
  toggleFilter: (columnId: string, value: string) => void;
}

const FilterPanelContent = ({
  isOpen,
  activeFilters,
  activeCount,
  columns,
  localFilters,
  onToggle,
  clearFilters,
  toggleFilter
}: FilterPanelContentProps) => {
  if (!isOpen) return null;

  return (
    <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
      <div className="min-h-[44px] flex flex-wrap gap-2 pb-4 mb-2 border-b border-border items-center relative pr-[200px]">
        <div className="absolute right-0 top-0 flex gap-2">
          <button
            className={cn(
              "h-8 px-3 text-xs rounded-md border transition-all",
              activeCount > 0 
                ? "border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent" 
                : "border-transparent bg-transparent text-muted-foreground opacity-50 cursor-not-allowed"
            )}
            onClick={(e) => {
              if (activeCount > 0) {
                clearFilters();
                (e.currentTarget as HTMLButtonElement).blur();
              }
            }}
          >
            Сбросить всё
          </button>
          <Button
            size="sm"
            className="h-8 text-xs"
            onClick={onToggle}
          >
            Закрыть
          </Button>
        </div>
        {activeFilters.length > 0 ? (
          <>
            {activeFilters.map((filter, idx) => (
              <Badge
                key={`${filter.column}-${filter.value}-${idx}`}
                variant="secondary"
                className="h-7 px-3 gap-2 cursor-pointer hover:bg-destructive/20"
                onClick={() => toggleFilter(
                  columns.find(c => c.label === filter.column)?.id || '',
                  filter.value
                )}
              >
                <span className="text-xs text-muted-foreground">{filter.column}:</span>
                <span className="text-xs font-medium">{filter.label}</span>
                <Icon name="X" size={12} />
              </Badge>
            ))}
          </>
        ) : (
          <span className="text-xs text-muted-foreground flex items-center">Фильтры не выбраны</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.id}>
            <h3 className="text-sm font-semibold mb-3 text-orange-500 uppercase tracking-wide">
              {column.label}
            </h3>
            <div className="space-y-1.5">
              {column.options.map((option) => {
                const isSelected = localFilters[column.id]?.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleFilter(column.id, option.value)}
                    className={cn(
                      "w-full px-3 py-2.5 text-left rounded-lg transition-all border",
                      "hover:border-accent/50 group",
                      isSelected
                        ? "bg-accent/10 border-accent text-foreground font-medium shadow-sm"
                        : "bg-card/50 border-border text-muted-foreground hover:bg-card/80"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">{option.label}</span>
                      <Badge 
                        variant={isSelected ? "default" : "secondary"}
                        className={cn(
                          "text-xs min-w-[28px] justify-center",
                          isSelected ? "bg-accent text-accent-foreground" : ""
                        )}
                      >
                        {option.count}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterPanelContent;