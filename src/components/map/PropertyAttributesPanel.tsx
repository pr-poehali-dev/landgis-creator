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
  onZoomToProperty?: () => void;
  onGeneratePDF?: () => void;
  onReturnToOverview?: () => void;
}

const PropertyAttributesPanel = ({ property, userRole, onClose, onAttributesUpdate, onZoomToProperty, onGeneratePDF, onReturnToOverview }: PropertyAttributesPanelProps) => {
  if (!property.attributes) return null;

  return (
    <Card className="absolute top-0 right-0 h-full w-full sm:w-[450px] shadow-2xl animate-fade-in overflow-hidden flex flex-col z-50">
      <CardHeader className="pb-3 border-b border-border flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold mb-3">
              {property.title}
            </CardTitle>
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
        <div className="flex flex-col gap-2">
          <div className="flex justify-between gap-2">
            <Button
              onClick={onReturnToOverview || onClose}
              variant="outline"
              size="sm"
              className="h-7 px-3 gap-1.5"
            >
              <Icon name="MapPin" size={14} />
              Вернуться к обзору
            </Button>
            {onGeneratePDF && (
              <Button
                onClick={onGeneratePDF}
                size="sm"
                className="h-7 px-3 gap-1.5 bg-primary hover:bg-primary/90"
              >
                <Icon name="FileText" size={14} />
                Скачать PDF
              </Button>
            )}
          </div>
        </div>
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