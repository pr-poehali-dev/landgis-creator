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
}

type SortDirection = 'asc' | 'desc' | null;

const DataTableDialog = ({ open, onOpenChange, properties }: DataTableDialogProps) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Получаем настроенную конфигурацию атрибутов
  const sampleAttributes = properties.length > 0 ? properties[0].attributes : undefined;
  const { configs } = useAttributeConfigs(sampleAttributes);
  
  const handleExportToExcel = () => {
    if (properties.length === 0) return;

    // Формируем данные для экспорта используя конфигурацию
    const exportData = properties.map(property => {
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
    // Используем displayName из конфигурации для отображения
    return configs
      .filter(config => config.enabled)
      .map(config => ({
        key: config.originalKey || config.configKey,
        label: config.displayName
      }));
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
    if (!sortColumn || !sortDirection) return properties;

    return [...properties].sort((a, b) => {
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
  }, [properties, sortColumn, sortDirection]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle>Таблица данных</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Показано объектов: {properties.length}
              </p>
            </div>
            <Button onClick={handleExportToExcel} size="sm" className="gap-2">
              <Icon name="FileDown" size={16} />
              Экспорт в Excel
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-lg relative">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr>
                {headers.map((header, idx) => (
                  <th 
                    key={idx} 
                    onClick={() => handleSort(header.key)}
                    className="px-3 py-3 text-left font-semibold border-r border-border whitespace-nowrap bg-accent/30 hover:bg-accent/50 cursor-pointer transition-colors select-none"
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
                  {headers.map((header, colIdx) => (
                    <td key={colIdx} className="px-3 py-2 border-r border-border whitespace-nowrap">
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