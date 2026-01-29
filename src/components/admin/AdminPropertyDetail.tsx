import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Property } from '@/services/propertyService';

interface AdminPropertyDetailProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

const AdminPropertyDetail = ({ property, isOpen, onClose }: AdminPropertyDetailProps) => {
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

  if (!property) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="FileText" className="text-primary" size={20} />
            Детали объекта #{property.id}
          </DialogTitle>
          <DialogDescription>Полная информация об объекте недвижимости</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">{property.title}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Icon name="MapPin" size={14} />
              {property.location}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Тип</p>
              <Badge variant="secondary">{getTypeLabel(property.type)}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Сегмент</p>
              <Badge className={getSegmentColor(property.segment)} variant="outline">
                {property.segment === 'premium' ? 'Премиум' :
                 property.segment === 'standard' ? 'Стандарт' : 'Эконом'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Площадь</p>
              <p className="text-lg font-semibold">{property.area} м²</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Цена</p>
              <p className="text-lg font-bold text-primary">{formatPrice(property.price)}</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Статус</p>
            <Badge className={getStatusColor(property.status)} variant="outline">
              {property.status === 'available' ? 'Доступен' :
               property.status === 'reserved' ? 'Резерв' : 'Продан'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Широта</p>
              <p className="text-sm font-mono">{property.coordinates?.[0]}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Долгота</p>
              <p className="text-sm font-mono">{property.coordinates?.[1]}</p>
            </div>
          </div>

          {property.boundary && property.boundary.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Границы участка</p>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-sm flex items-center gap-2">
                  <Icon name="MapPin" size={14} className="text-green-400" />
                  Загружено {property.boundary.length} точек границы
                </p>
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    Показать координаты
                  </summary>
                  <div className="mt-2 max-h-40 overflow-y-auto text-xs font-mono bg-background rounded p-2">
                    {property.boundary.map((coord, i) => (
                      <div key={i}>
                        {i + 1}. [{coord[0].toFixed(6)}, {coord[1].toFixed(6)}]
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          )}

          {property.attributes && Object.keys(property.attributes).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Атрибуты из GeoJSON</p>
              <div className="bg-muted/30 rounded-lg p-3 max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {Object.entries(property.attributes).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start gap-4 text-xs">
                      <span className="font-medium text-muted-foreground min-w-[100px]">{key}:</span>
                      <span className="text-foreground text-right break-all">
                        {value !== null && value !== undefined ? String(value) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">Дата создания</p>
            <p className="text-sm">{formatDate(property.created_at)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminPropertyDetail;
