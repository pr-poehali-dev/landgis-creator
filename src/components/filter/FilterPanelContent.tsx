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

export type DateFilterValue = 'today' | 'week' | 'month' | null;

interface FilterPanelContentProps {
  isOpen: boolean;
  activeFilters: Array<{ column: string; value: string; label: string }>;
  activeCount: number;
  columns: FilterColumn[];
  localFilters: Record<string, string[]>;
  onToggle: () => void;
  clearFilters: () => void;
  toggleFilter: (columnId: string, value: string) => void;
  dateFilter?: DateFilterValue;
  onDateFilterChange?: (value: DateFilterValue) => void;
  hasDateAttributes?: boolean;
}

const DATE_FILTER_OPTIONS = [
  { value: 'today' as const, label: 'Сегодня', icon: 'CalendarCheck' },
  { value: 'week' as const, label: 'За неделю', icon: 'CalendarDays' },
  { value: 'month' as const, label: 'За месяц', icon: 'CalendarRange' },
];

const FilterPanelContent = ({
  isOpen,
  activeFilters,
  activeCount,
  columns,
  localFilters,
  onToggle,
  clearFilters,
  toggleFilter,
  dateFilter,
  onDateFilterChange,
  hasDateAttributes = false
}: FilterPanelContentProps) => {
  if (!isOpen) return null;

  return (
    <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
      <div className="min-h-[44px] flex flex-wrap gap-2 pb-4 mb-2 border-b border-border items-center relative pr-[200px]">
        <div className="absolute right-0 top-0 flex gap-2">
          <button
            className={cn(
              "h-8 px-3 text-xs rounded-md border transition-all",
              (activeCount > 0 || dateFilter)
                ? "border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent" 
                : "border-transparent bg-transparent text-muted-foreground opacity-50 cursor-not-allowed"
            )}
            onClick={(e) => {
              if (activeCount > 0 || dateFilter) {
                clearFilters();
                if (onDateFilterChange) onDateFilterChange(null);
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
        {(activeFilters.length > 0 || dateFilter) ? (
          <>
            {dateFilter && onDateFilterChange && (
              <Badge
                variant="secondary"
                className="h-7 px-3 gap-2 cursor-pointer hover:bg-destructive/20"
                onClick={() => onDateFilterChange(null)}
              >
                <span className="text-xs text-muted-foreground">Дата:</span>
                <span className="text-xs font-medium">
                  {DATE_FILTER_OPTIONS.find(o => o.value === dateFilter)?.label}
                </span>
                <Icon name="X" size={12} />
              </Badge>
            )}
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
        {hasDateAttributes && onDateFilterChange && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-orange-500 uppercase tracking-wide">
              Дата актуальности
            </h3>
            <div className="space-y-1.5">
              {DATE_FILTER_OPTIONS.map((option) => {
                const isSelected = dateFilter === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => onDateFilterChange(isSelected ? null : option.value)}
                    className={cn(
                      "w-full px-3 py-2.5 text-left rounded-lg transition-all border",
                      "hover:border-accent/50 group",
                      isSelected
                        ? "bg-accent/10 border-accent text-foreground font-medium shadow-sm"
                        : "bg-card/50 border-border text-muted-foreground hover:bg-card/80"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon name={option.icon as "CalendarCheck" | "CalendarDays" | "CalendarRange"} size={16} />
                      <span className="text-sm">{option.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {columns.filter(col => col.options.length > 0).map((column) => (
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