import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { Property } from '@/services/propertyService';

interface AdminPropertyTableProps {
  properties: Property[];
  selectedIds: Set<number>;
  onToggleSelectAll: () => void;
  onToggleSelectOne: (id: number) => void;
  onShowDetails: (property: Property) => void;
  onDelete: (id: number) => void;
}

const AdminPropertyTable = ({
  properties,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectOne,
  onShowDetails,
  onDelete
}: AdminPropertyTableProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      land: 'Земля',
      commercial: 'Коммерция',
      residential: 'Жильё'
    };
    return labels[type as keyof typeof labels];
  };

  const getStatusColor = (status: string) => {
    const colors = {
      available: 'bg-green-500/20 text-green-400 border-green-500/30',
      reserved: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      sold: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[status as keyof typeof colors];
  };

  const getSegmentColor = (segment: string) => {
    const colors = {
      premium: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      standard: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      economy: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    return colors[segment as keyof typeof colors];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <input
                type="checkbox"
                checked={selectedIds.size === properties.length && properties.length > 0}
                onChange={onToggleSelectAll}
                className="w-4 h-4 cursor-pointer"
              />
            </TableHead>
            <TableHead className="w-[60px]">ID</TableHead>
            <TableHead>Название</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead>Адрес</TableHead>
            <TableHead className="text-right">Площадь</TableHead>
            <TableHead className="text-right">Цена</TableHead>
            <TableHead>Сегмент</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Границы</TableHead>
            <TableHead>Создан</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((property) => (
            <TableRow key={property.id} className="hover:bg-muted/50">
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedIds.has(property.id)}
                  onChange={() => onToggleSelectOne(property.id)}
                  className="w-4 h-4 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              </TableCell>
              <TableCell className="font-mono text-xs">{property.id}</TableCell>
              <TableCell className="font-medium max-w-[200px] truncate">
                {property.title}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {getTypeLabel(property.type)}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                {property.location}
              </TableCell>
              <TableCell className="text-right">{property.area} м²</TableCell>
              <TableCell className="text-right font-semibold text-primary">
                {formatPrice(property.price)}
              </TableCell>
              <TableCell>
                <Badge className={`text-xs ${getSegmentColor(property.segment)}`} variant="outline">
                  {property.segment === 'premium' ? 'Премиум' :
                   property.segment === 'standard' ? 'Стандарт' : 'Эконом'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={`text-xs ${getStatusColor(property.status)}`} variant="outline">
                  {property.status === 'available' ? 'Доступен' :
                   property.status === 'reserved' ? 'Резерв' : 'Продан'}
                </Badge>
              </TableCell>
              <TableCell>
                {property.boundary && property.boundary.length > 0 ? (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
                    <Icon name="Check" size={12} className="mr-1" />
                    {property.boundary.length} точек
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDate(property.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onShowDetails(property)}
                  >
                    <Icon name="Eye" size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(property.id)}
                  >
                    <Icon name="Trash2" size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminPropertyTable;
