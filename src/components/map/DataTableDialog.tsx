import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Property } from '@/services/propertyService';
import Icon from '@/components/ui/icon';
import * as XLSX from 'xlsx';

interface DataTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Property[];
}

const DataTableDialog = ({ open, onOpenChange, properties }: DataTableDialogProps) => {
  
  const handleExportToExcel = () => {
    if (properties.length === 0) return;

    // Получаем все уникальные атрибуты из всех объектов
    const allAttributeKeys = new Set<string>();
    properties.forEach(property => {
      if (property.attributes) {
        Object.keys(property.attributes).forEach(key => allAttributeKeys.add(key));
      }
    });

    // Формируем данные для экспорта
    const exportData = properties.map(property => {
      const row: Record<string, any> = {
        'Название': property.title,
        'Тип': property.type === 'land' ? 'Земля' : property.type === 'commercial' ? 'Коммерция' : 'Жильё',
        'Цена': property.price,
        'Площадь': property.area,
        'Местоположение': property.location,
        'Статус': property.status === 'available' ? 'Доступно' : property.status === 'reserved' ? 'Забронировано' : 'Продано',
      };

      // Добавляем все атрибуты
      allAttributeKeys.forEach(key => {
        const value = property.attributes?.[key];
        if (Array.isArray(value)) {
          row[key] = value.join(', ');
        } else if (value !== undefined && value !== null) {
          row[key] = value;
        } else {
          row[key] = '';
        }
      });

      return row;
    });

    // Создаем книгу Excel
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Объекты');

    // Автоматическая ширина колонок
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    ws['!cols'] = colWidths;

    // Скачиваем файл
    XLSX.writeFile(wb, `Объекты_${new Date().toLocaleDateString('ru-RU')}.xlsx`);
  };

  // Получаем заголовки таблицы в правильном порядке
  const getTableHeaders = () => {
    const baseHeaders = ['Название', 'Тип', 'Цена', 'Площадь', 'Местоположение', 'Статус'];
    
    if (properties.length === 0) return baseHeaders;

    // Собираем все уникальные атрибуты
    const attributeKeys = new Set<string>();
    properties.forEach(property => {
      if (property.attributes) {
        Object.keys(property.attributes).forEach(key => attributeKeys.add(key));
      }
    });

    return [...baseHeaders, ...Array.from(attributeKeys)];
  };

  const headers = getTableHeaders();

  const getCellValue = (property: Property, header: string) => {
    switch (header) {
      case 'Название':
        return property.title;
      case 'Тип':
        return property.type === 'land' ? 'Земля' : property.type === 'commercial' ? 'Коммерция' : 'Жильё';
      case 'Цена':
        return `${property.price.toLocaleString('ru-RU')} ₽`;
      case 'Площадь':
        return `${property.area} м²`;
      case 'Местоположение':
        return property.location;
      case 'Статус':
        return property.status === 'available' ? 'Доступно' : property.status === 'reserved' ? 'Забронировано' : 'Продано';
      default:
        const value = property.attributes?.[header];
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value !== undefined && value !== null ? String(value) : '';
    }
  };

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
            <thead className="bg-card sticky top-0 z-10 shadow-sm">
              <tr>
                {headers.map((header, idx) => (
                  <th key={idx} className="px-3 py-2 text-left font-medium border-r border-border whitespace-nowrap bg-card">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {properties.map((property, rowIdx) => (
                <tr key={property.id} className={rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  {headers.map((header, colIdx) => (
                    <td key={colIdx} className="px-3 py-2 border-r border-border whitespace-nowrap">
                      {getCellValue(property, header)}
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