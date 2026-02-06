import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Property } from '@/services/propertyService';
import Icon from '@/components/ui/icon';
import { useAttributeConfigs } from '@/components/attributes/useAttributeConfigs';
import TableHeader from '@/components/map/datatable/TableHeader';
import TableBody from '@/components/map/datatable/TableBody';
import { useTableLogic } from '@/components/map/datatable/useTableLogic';

interface DataTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Property[];
  allProperties?: Property[];
  onShowOnMap?: (property: Property) => void;
}

const DataTableDialog = ({ open, onOpenChange, properties, allProperties, onShowOnMap }: DataTableDialogProps) => {
  const displayPropertiesForConfig = properties.length > 0 ? properties : (allProperties || []);
  const sampleAttributes = displayPropertiesForConfig.length > 0 ? displayPropertiesForConfig[0].attributes : undefined;
  const { configs } = useAttributeConfigs(sampleAttributes);

  const getTableHeaders = () => {
    const titleHeader = {
      key: 'title',
      label: 'Название'
    };

    const allHeaders = configs
      .filter(config => config.enabled)
      .map(config => ({
        key: config.originalKey || config.configKey,
        label: config.displayName
      }));

    return [titleHeader, ...allHeaders];
  };

  const allHeaders = getTableHeaders();

  const {
    sortColumn,
    sortDirection,
    showFiltered,
    searchQuery,
    hiddenColumns,
    displayProperties,
    sortedProperties,
    setShowFiltered,
    setSearchQuery,
    toggleColumn,
    getCellValue,
    handleSort,
    handleExportToExcel
  } = useTableLogic(properties, allProperties, allHeaders);

  const headers = allHeaders.filter(h => !hiddenColumns.has(h.key));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <TableHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showFiltered={showFiltered}
            onToggleFiltered={setShowFiltered}
            allProperties={allProperties}
            properties={properties}
            sortedProperties={sortedProperties}
            displayProperties={displayProperties}
            allHeaders={allHeaders}
            hiddenColumns={hiddenColumns}
            onToggleColumn={toggleColumn}
            onExport={handleExportToExcel}
          />
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по всем полям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus={false}
            />
          </div>
        </div>

        <TableBody
          headers={headers}
          sortedProperties={sortedProperties}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          getCellValue={getCellValue}
          onShowOnMap={onShowOnMap}
        />
      </DialogContent>
    </Dialog>
  );
};

export default DataTableDialog;