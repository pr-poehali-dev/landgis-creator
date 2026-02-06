import { useState, useMemo } from 'react';
import { Property } from '@/services/propertyService';
import * as XLSX from 'xlsx';

type SortDirection = 'asc' | 'desc' | null;

interface TableHeader {
  key: string;
  label: string;
}

export const useTableLogic = (
  properties: Property[],
  allProperties: Property[] | undefined,
  headers: TableHeader[]
) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [showFiltered, setShowFiltered] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  const displayProperties = showFiltered ? properties : (allProperties || properties);

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
      if (property.title?.toLowerCase().includes(query)) return true;
      
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

  const handleExportToExcel = () => {
    if (properties.length === 0) return;

    const exportData = displayProperties.map(property => {
      const row: Record<string, any> = {};
      
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

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Объекты');

    const colWidths = headers.map(header => ({
      wch: Math.max(header.label.length, 15)
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `Объекты_${new Date().toLocaleDateString('ru-RU')}.xlsx`);
  };

  return {
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
  };
};
