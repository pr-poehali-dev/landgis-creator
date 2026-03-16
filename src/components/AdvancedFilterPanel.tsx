import { cn } from '@/lib/utils';
import MapTypeSwitcher from '@/components/filter/MapTypeSwitcher';
import FilterControls from '@/components/filter/FilterControls';
import FilterPanelContent from '@/components/filter/FilterPanelContent';
import { useFilterSettings } from '@/components/filter/useFilterSettings';
import { useFilterColumns } from '@/components/filter/useFilterColumns';
import { useFilterActions } from '@/components/filter/useFilterActions';
import { UserRole } from '@/types/userRoles';

interface AdvancedFilterPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  filters: Record<string, string[]>;
  onFiltersChange: (filters: Record<string, string[]>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: any[];
  mapType?: 'scheme' | 'hybrid';
  onMapTypeChange?: (type: 'scheme' | 'hybrid') => void;
  onLayersClick?: () => void;
  userRole?: UserRole;
  companyId?: number;
}

const AdvancedFilterPanel = ({
  isOpen,
  onToggle,
  filters,
  onFiltersChange,
  properties,
  mapType = 'scheme',
  onMapTypeChange,
  onLayersClick,
  userRole = 'admin',
  companyId
}: AdvancedFilterPanelProps) => {
  const { filterSettings, visibilityConfig } = useFilterSettings(isOpen, filters, onFiltersChange);
  const { columns, visibleColumns } = useFilterColumns(properties, filterSettings, userRole, companyId, visibilityConfig);
  const {
    localFilters,
    columnsWithDynamicCounts,
    toggleFilter,
    clearFilters,
    activeFilters,
    activeCount
  } = useFilterActions(filters, onFiltersChange, properties, columns, visibleColumns, filterSettings);

  return (
    <>
      {onMapTypeChange && (
        <MapTypeSwitcher 
          mapType={mapType} 
          onMapTypeChange={onMapTypeChange} 
        />
      )}

      <FilterControls
        isOpen={isOpen}
        activeCount={activeCount}
        onToggle={onToggle}
        onLayersClick={onLayersClick}
      />

      <div className={cn(
        "absolute top-20 left-4 right-4 z-30 bg-card border border-border rounded-2xl shadow-xl transition-all duration-300 overflow-hidden",
        isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      )}>
        <FilterPanelContent
          isOpen={isOpen}
          activeFilters={activeFilters}
          activeCount={activeCount}
          columns={columnsWithDynamicCounts}
          localFilters={localFilters}
          onToggle={onToggle}
          clearFilters={clearFilters}
          toggleFilter={toggleFilter}
        />
      </div>
    </>
  );
};

export default AdvancedFilterPanel;