import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Property } from '@/services/propertyService';
import Icon from '@/components/ui/icon';
import * as XLSX from 'xlsx';
import { useAttributeConfigs } from '@/components/attributes/useAttributeConfigs';
import { useState, useMemo } from 'react';

interface DataTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Property[];
  allProperties?: Property[];
  onShowOnMap?: (property: Property) => void;
}

type SortDirection = 'asc' | 'desc' | null;

const DataTableDialog = ({ open, onOpenChange, properties, allProperties, onShowOnMap }: DataTableDialogProps) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [showFiltered, setShowFiltered] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  // Получаем настроенную конфигурацию атрибутов
  const displayProperties = showFiltered ? properties : (allProperties || properties);
  const sampleAttributes = displayProperties.length > 0 ? displayProperties[0].attributes : undefined;
  const { configs } = useAttributeConfigs(sampleAttributes);
  
  const handleExportToExcel = () => {
    if (properties.length === 0) return;

    // Формируем данные для экспорта используя конфигурацию
    const exportData = displayProperties.map(property => {
      const row: Record<string, any> = {};
      
      // Используем настроенный порядок и названия из конфигурации
      headers.forEach(header => {
        const value = property.attributes?.[header.key];
        if (Array.isArray(value)) {
          row[header.label] = value.join(', ');
        } else if (typeof value === 'boolean') {
          row[header.label] = value ? 'Да' : 'Нет';
        } else if (value !== undefined && value !== null) {
          row[header.label] = value;
        } else {
          row[header.label] = '';
        }
      });

      return row;
    });

    // Создаем книгу Excel
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Объекты');

    // Автоматическая ширина колонок
    const colWidths = headers.map(header => ({
      wch: Math.max(header.label.length, 15)
    }));
    ws['!cols'] = colWidths;

    // Скачиваем файл
    XLSX.writeFile(wb, `Объекты_${new Date().toLocaleDateString('ru-RU')}.xlsx`);
  };

  // Получаем заголовки таблицы в правильном порядке из конфигурации
  const getTableHeaders = () => {
    // Добавляем title как первый столбец
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
  const headers = allHeaders.filter(h => !hiddenColumns.has(h.key));

  const toggleColumn = (key: string) => {
    setHiddenColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getCellValue = (property: Property, headerKey: string) => {
    // Если это title, берём напрямую из property
    if (headerKey === 'title') {
      return property.title || '';
    }
    
    const value = property.attributes?.[headerKey];
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'boolean') {
      return value ? 'Да' : 'Нет';
    }
    return value !== undefined && value !== null ? String(value) : '';
  };

  const handleSort = (headerKey: string) => {
    if (sortColumn === headerKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(headerKey);
      setSortDirection('asc');
    }
  };

  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return displayProperties;

    const query = searchQuery.toLowerCase();
    return displayProperties.filter(property => {
      // Поиск по названию
      if (property.title?.toLowerCase().includes(query)) return true;
      
      // Поиск по всем атрибутам
      if (property.attributes) {
        return Object.values(property.attributes).some(value => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query);
          }
          if (Array.isArray(value)) {
            return value.some(v => String(v).toLowerCase().includes(query));
          }
          return String(value).toLowerCase().includes(query);
        });
      }
      return false;
    });
  }, [displayProperties, searchQuery]);

  const sortedProperties = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredBySearch;

    return [...filteredBySearch].sort((a, b) => {
      const aValue = getCellValue(a, sortColumn);
      const bValue = getCellValue(b, sortColumn);

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr, 'ru', { numeric: true });
      } else {
        return bStr.localeCompare(aStr, 'ru', { numeric: true });
      }
    });
  }, [filteredBySearch, sortColumn, sortDirection]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle>Таблица данных</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? `Найдено: ${sortedProperties.length} из ${displayProperties.length}` : `Показано объектов: ${displayProperties.length}`}
              </p>
            </div>
            <div className="flex gap-2">
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
                          onCheckedChange={() => toggleColumn(header.key)}
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
              <Button onClick={handleExportToExcel} size="sm" className="gap-2">
                <Icon name="FileDown" size={16} />
                Экспорт в Excel
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2">
          <div className="px-1">
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по таблице..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {allProperties && allProperties.length !== properties.length && (
          <div className="flex justify-center pb-2">
            <div className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5">
              <Button
                onClick={() => setShowFiltered(true)}
                variant="ghost"
                size="sm"
                className={showFiltered ? "bg-accent text-accent-foreground shadow-sm" : ""}
              >
                С учётом фильтрации
              </Button>
              <Button
                onClick={() => setShowFiltered(false)}
                variant="ghost"
                size="sm"
                className={!showFiltered ? "bg-accent text-accent-foreground shadow-sm" : ""}
              >
                Все участки
              </Button>
            </div>
          </div>
          )}
        </div>

        <div className="flex-1 overflow-auto border rounded-lg relative">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="sticky left-0 z-30 px-2 py-3 bg-background border-r border-border shadow-[2px_0_4px_rgba(0,0,0,0.1)]">
                  <Icon name="Map" size={16} className="text-muted-foreground" />
                </th>
                {headers.map((header, idx) => (
                  <th 
                    key={idx} 
                    onClick={() => handleSort(header.key)}
                    className={`px-3 py-3 text-left font-semibold border-r border-border whitespace-nowrap bg-background hover:bg-accent/50 cursor-pointer transition-colors select-none ${
                      idx === 0 ? 'sticky left-10 z-30 shadow-[2px_0_4px_rgba(0,0,0,0.1)]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{header.label}</span>
                      {sortColumn === header.key && (
                        <Icon 
                          name={sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
                          size={16}
                          className="text-accent-foreground"
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedProperties.map((property, rowIdx) => {
                const rowBg = rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/20';
                return (
                  <tr key={property.id} className={rowBg}>
                    <td className={`sticky left-0 z-20 px-2 py-2 border-r border-border shadow-[2px_0_4px_rgba(0,0,0,0.05)] ${rowBg}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => onShowOnMap?.(property)}
                        title="Показать на карте"
                      >
                        <Icon name="MapPin" size={14} />
                      </Button>
                    </td>
                    {headers.map((header, colIdx) => (
                      <td 
                        key={colIdx} 
                        className={`px-3 py-2 border-r border-border whitespace-nowrap ${
                          colIdx === 0 ? `sticky left-10 z-20 font-medium shadow-[2px_0_4px_rgba(0,0,0,0.05)] ${rowBg}` : ''
                        }`}
                      >
                        {getCellValue(property, header.key)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataTableDialog;