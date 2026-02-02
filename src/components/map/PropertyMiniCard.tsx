import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { formatPrice, getTypeLabel, getStatusColor, getSegmentColor, calculatePolygonArea } from './MapHelpers';

interface Property {
  id: number;
  title: string;
  type: 'land' | 'commercial' | 'residential';
  price: number;
  area: number;
  location: string;
  coordinates: [number, number];
  segment: 'premium' | 'standard' | 'economy';
  status: 'available' | 'reserved' | 'sold';
  boundary?: Array<[number, number]>;
  attributes?: Record<string, any>;
}

interface PropertyMiniCardProps {
  property: Property;
  position: { top?: string; left?: string; right?: string; bottom?: string };
  onClose: () => void;
  onOpenAttributes: () => void;
  userRole?: string;
}

const PropertyMiniCard = ({ property, position, onClose, onOpenAttributes }: PropertyMiniCardProps) => {
  const calculatedArea = calculatePolygonArea(property.boundary);

  return (
    <Card 
      className="absolute w-96 max-w-md shadow-2xl animate-fade-in transition-all duration-300"
      style={Object.keys(position).length > 0 ? position : { bottom: '24px', left: '24px' }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base sm:text-lg mb-2">{property.title}</CardTitle>
            <CardDescription className="flex items-center gap-1 text-xs">
              <Icon name="MapPin" size={14} />
              {property.attributes?.region || 'Не указан'}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <Icon name="X" size={20} />
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap mt-2">
          <Badge variant="outline" className={getStatusColor(property.status)}>
            {property.status === 'available' ? 'Доступно' : property.status === 'reserved' ? 'Резерв' : 'Продано'}
          </Badge>
          <Badge variant="outline" className={getSegmentColor(property.segment)}>
            {property.segment === 'premium' ? 'Премиум' : property.segment === 'standard' ? 'Стандарт' : 'Эконом'}
          </Badge>
          <Badge variant="outline">{getTypeLabel(property.type)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Площадь</span>
          <span className="font-semibold">
            {property.boundary && calculatedArea > 0
              ? `${calculatedArea.toFixed(2)} га`
              : `${property.area} м²`}
          </span>
        </div>
        {property.attributes?.cnname && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Кадастровый №</span>
            <span className="font-mono text-xs">{property.attributes.cnname}</span>
          </div>
        )}
        {property.attributes?.util_code && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">ВРИ</span>
            <span className="text-xs">{property.attributes.util_code}</span>
          </div>
        )}
        <div className="pt-3 border-t">
          <div className="flex items-end justify-between mb-3">
            <span className="text-sm text-muted-foreground">Цена</span>
            <span className="text-xl font-bold text-primary">{formatPrice(property.price)}</span>
          </div>
          {property.attributes && typeof property.attributes === 'object' && Object.keys(property.attributes).length > 1 && (
            <Button 
              className="w-full"
              onClick={onOpenAttributes}
            >
              Подробнее
              <Icon name="ChevronRight" size={16} className="ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyMiniCard;