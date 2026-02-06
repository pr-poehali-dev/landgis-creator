import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface FilterColumn {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
  options: string[];
  defaultValues: string[];
  attributePath: string;
}

interface FilterPreviewTableProps {
  columns: FilterColumn[];
  getOptionLabel: (columnId: string, value: string) => string;
}

const FilterPreviewTable = ({ columns, getOptionLabel }: FilterPreviewTableProps) => {
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon name="Eye" size={20} />
          Предпросмотр
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {sortedColumns
                  .filter(col => col.enabled)
                  .map(column => (
                    <th
                      key={column.id}
                      className="text-left text-xs font-semibold text-muted-foreground px-3 py-2 border-b border-border bg-muted/30"
                    >
                      {column.label}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ 
                length: Math.max(...sortedColumns.filter(c => c.enabled).map(c => Math.min(c.options?.length || 0, 5)), 0)
              }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border/50">
                  {sortedColumns
                    .filter(col => col.enabled)
                    .map(column => {
                      const option = column.options?.[rowIndex];
                      const isDefault = column.defaultValues?.includes(option) || false;
                      
                      return (
                        <td key={column.id} className="px-3 py-1.5">
                          {option ? (
                            <div
                              className={cn(
                                "w-full text-left px-2 py-1.5 rounded text-xs transition-all",
                                isDefault && "bg-primary/10 text-primary font-medium"
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate">{getOptionLabel(column.id, option)}</span>
                                {isDefault && (
                                  <Icon name="Check" size={12} className="shrink-0" />
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="h-8" />
                          )}
                        </td>
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Предпросмотр показывает первые 5 строк каждого столбца
        </p>
      </CardContent>
    </Card>
  );
};

export default FilterPreviewTable;