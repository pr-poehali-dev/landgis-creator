import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';

interface TableHeader {
  key: string;
  label: string;
}

interface TableHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  showFiltered: boolean;
  onToggleFiltered: (value: boolean) => void;
  allProperties?: any[];
  properties: any[];
  sortedProperties: any[];
  displayProperties: any[];
  allHeaders: TableHeader[];
  hiddenColumns: Set<string>;
  onToggleColumn: (key: string) => void;
  onExport: () => void;
}

const TableHeader = ({
  searchQuery,
  onSearchChange,
  showFiltered,
  onToggleFiltered,
  allProperties,
  properties,
  sortedProperties,
  displayProperties,
  allHeaders,
  hiddenColumns,
  onToggleColumn,
  onExport
}: TableHeaderProps) => {
  return (
    <div className="flex items-center justify-between pr-8">
      <div>
        <h2 className="text-lg font-semibold">Таблица данных</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {searchQuery ? `Найдено: ${sortedProperties.length} из ${displayProperties.length}` : `Показано объектов: ${displayProperties.length}`}
        </p>
      </div>
      
      {allProperties && allProperties.length !== properties.length && (
        <div className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5">
          <Button
            onClick={() => onToggleFiltered(true)}
            variant="ghost"
            size="sm"
            className={showFiltered ? "bg-accent text-accent-foreground shadow-sm" : ""}
          >
            С учётом фильтрации
          </Button>
          <Button
            onClick={() => onToggleFiltered(false)}
            variant="ghost"
            size="sm"
            className={!showFiltered ? "bg-accent text-accent-foreground shadow-sm" : ""}
          >
            Все участки
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Icon name="Columns3" size={16} />
              Столбцы
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <div className="space-y-2">
              <div className="font-semibold text-sm mb-3">Показать столбцы</div>
              {allHeaders.map(header => (
                <div key={header.key} className="flex items-center gap-2">
                  <Checkbox
                    id={`col-${header.key}`}
                    checked={!hiddenColumns.has(header.key)}
                    onCheckedChange={() => onToggleColumn(header.key)}
                  />
                  <label
                    htmlFor={`col-${header.key}`}
                    className="text-sm cursor-pointer select-none flex-1"
                  >
                    {header.label}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button 
          onClick={onExport}
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <Icon name="Download" size={16} />
          Excel
        </Button>
      </div>
    </div>
  );
};

export default TableHeader;
