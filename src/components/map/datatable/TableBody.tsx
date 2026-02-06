import { Button } from '@/components/ui/button';
import { Property } from '@/services/propertyService';
import Icon from '@/components/ui/icon';

type SortDirection = 'asc' | 'desc' | null;

interface TableHeader {
  key: string;
  label: string;
}

interface TableBodyProps {
  headers: TableHeader[];
  sortedProperties: Property[];
  sortColumn: string | null;
  sortDirection: SortDirection;
  onSort: (headerKey: string) => void;
  getCellValue: (property: Property, headerKey: string) => string;
  onShowOnMap?: (property: Property) => void;
}

const TableBody = ({
  headers,
  sortedProperties,
  sortColumn,
  sortDirection,
  onSort,
  getCellValue,
  onShowOnMap
}: TableBodyProps) => {
  const getSortIcon = (headerKey: string) => {
    if (sortColumn !== headerKey) {
      return <Icon name="ArrowUpDown" size={14} className="opacity-30" />;
    }
    if (sortDirection === 'asc') {
      return <Icon name="ArrowUp" size={14} />;
    }
    return <Icon name="ArrowDown" size={14} />;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-auto max-h-[calc(90vh-280px)]">
        <table className="w-auto">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              {onShowOnMap && (
                <th className="text-left px-2 py-1.5 font-semibold text-sm border-b w-10 sticky left-0 bg-muted/50 z-20 whitespace-nowrap">
                </th>
              )}
              {headers.map((header, index) => (
                <th 
                  key={header.key}
                  className={`text-left px-3 py-1.5 font-semibold text-sm border-b cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap ${
                    index === 0 && header.key === 'title' ? 'sticky left-10 bg-muted/50 z-20' : ''
                  }`}
                  onClick={() => onSort(header.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{header.label}</span>
                    {getSortIcon(header.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedProperties.map((property, idx) => (
              <tr 
                key={property.id || idx}
                className="border-b hover:bg-muted/30 transition-colors"
              >
                {onShowOnMap && (
                  <td className="px-2 py-1.5 sticky left-0 bg-background z-10 w-10">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onShowOnMap(property)}
                      className="h-7 w-7 p-0"
                    >
                      <Icon name="MapPin" size={14} />
                    </Button>
                  </td>
                )}
                {headers.map((header, index) => (
                  <td 
                    key={header.key} 
                    className={`px-3 py-1.5 text-sm whitespace-nowrap ${
                      index === 0 && header.key === 'title' ? 'sticky left-10 bg-background z-10' : ''
                    }`}
                  >
                    {getCellValue(property, header.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {sortedProperties.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="Search" size={48} className="mx-auto mb-4 opacity-30" />
            <p>Объекты не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableBody;