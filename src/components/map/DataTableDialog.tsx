import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
    const allHeaders = configs
      .filter(config => config.enabled)
      .map(config => ({
        key: config.originalKey || config.configKey,
        label: config.displayName
      }));

    // Ищем столбец с названием/наименованием
    const nameIndex = allHeaders.findIndex(h => 
      h.label.toLowerCase().includes('название') || 
      h.label.toLowerCase().includes('наименование')
    );

    if (nameIndex > 0) {
      const nameHeader = allHeaders[nameIndex];
      allHeaders.splice(nameIndex, 1);
      allHeaders.unshift(nameHeader);
    }

    return allHeaders;
  };

  const headers = getTableHeaders();

  const getCellValue = (property: Property, headerKey: string) => {
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

  const sortedProperties = useMemo(() => {
    if (!sortColumn || !sortDirection) return displayProperties;

    return [...displayProperties].sort((a, b) => {
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
  }, [displayProperties, sortColumn, sortDirection]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle>Таблица данных</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Показано объектов: {displayProperties.length}
              </p>
            </div>
            <Button onClick={handleExportToExcel} size="sm" className="gap-2">
              <Icon name="FileDown" size={16} />
              Экспорт в Excel
            </Button>
          </div>
        </DialogHeader>

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

        <div className="flex-1 overflow-auto border rounded-lg relative">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="sticky left-0 z-20 px-2 py-3 bg-accent/30 border-r border-border">
                  <Icon name="Map" size={16} className="text-muted-foreground" />
                </th>
                {headers.map((header, idx) => (
                  <th 
                    key={idx} 
                    onClick={() => handleSort(header.key)}
                    className={`px-3 py-3 text-left font-semibold border-r border-border whitespace-nowrap bg-accent/30 hover:bg-accent/50 cursor-pointer transition-colors select-none ${
                      idx === 0 ? 'sticky left-10 z-20' : ''
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
              {sortedProperties.map((property, rowIdx) => (
                <tr key={property.id} className={rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td className="sticky left-0 z-10 px-2 py-2 bg-inherit border-r border-border">
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
                        colIdx === 0 ? 'sticky left-10 z-10 bg-inherit font-medium' : ''
                      }`}
                    >
                      {getCellValue(property, header.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataTableDialog;