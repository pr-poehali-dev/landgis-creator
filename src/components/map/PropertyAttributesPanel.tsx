import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import AttributesDisplay from '@/components/AttributesDisplay';

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

interface PropertyAttributesPanelProps {
  property: Property;
  userRole: string;
  onClose: () => void;
  onAttributesUpdate: (updatedAttrs: Record<string, any>) => void;
}

const PropertyAttributesPanel = ({ property, userRole, onClose, onAttributesUpdate }: PropertyAttributesPanelProps) => {
  if (!property.attributes) return null;

  return (
    <Card className="absolute top-0 right-0 h-full w-full sm:w-[450px] shadow-2xl animate-fade-in overflow-hidden flex flex-col">
      <CardHeader className="pb-3 border-b border-border flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base mb-2">Атрибуты объекта</CardTitle>
            <CardDescription className="text-xs">
              {property.title}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -mt-1"
            onClick={onClose}
          >
            <Icon name="X" size={20} />
          </Button>
        </div>
        <Badge variant="secondary" className="mt-2 w-fit">
          Всего: {Object.keys(property.attributes).filter(k => k !== 'geometry_name').length} атрибутов
        </Badge>
      </CardHeader>
      <CardContent className="p-4 space-y-3 overflow-y-auto flex-1">
        <AttributesDisplay 
          attributes={property.attributes}
          userRole={userRole}
          featureId={property.id}
          onAttributesUpdate={onAttributesUpdate}
        />
      </CardContent>
    </Card>
  );
};

export default PropertyAttributesPanel;
