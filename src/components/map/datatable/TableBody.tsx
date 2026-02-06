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
        <table className="w-full">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              {headers.map((header) => (
                <th 
                  key={header.key}
                  className="text-left p-3 font-semibold text-sm border-b cursor-pointer hover:bg-muted/80 transition-colors select-none"
                  onClick={() => onSort(header.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{header.label}</span>
                    {getSortIcon(header.key)}
                  </div>
                </th>
              ))}
              {onShowOnMap && (
                <th className="text-left p-3 font-semibold text-sm border-b w-32">
                  Действия
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedProperties.map((property, idx) => (
              <tr 
                key={property.id || idx}
                className="border-b hover:bg-muted/30 transition-colors"
              >
                {headers.map((header) => (
                  <td key={header.key} className="p-3 text-sm">
                    {getCellValue(property, header.key)}
                  </td>
                ))}
                {onShowOnMap && (
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onShowOnMap(property)}
                      className="gap-2"
                    >
                      <Icon name="MapPin" size={14} />
                      На карте
                    </Button>
                  </td>
                )}
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
