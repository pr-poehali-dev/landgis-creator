import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { UserRole } from '@/types/userRoles';

interface AttributeVisibilityRule {
  attributePath: string;
  label: string;
  visibleForRoles: UserRole[];
}

interface AttributeVisibilityCardProps {
  availableAttributes: Array<{path: string; label: string; values: Set<string>}>;
  attributeRules: AttributeVisibilityRule[];
  selectedRole: UserRole;
  onToggleAttribute: (attributePath: string) => void;
}

const AttributeVisibilityCard = ({
  availableAttributes,
  attributeRules,
  selectedRole,
  onToggleAttribute
}: AttributeVisibilityCardProps) => {
  const isAttributeVisible = (attributePath: string): boolean => {
    const rule = attributeRules.find(ar => ar.attributePath === attributePath);
    return rule ? rule.visibleForRoles.includes(selectedRole) : false;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Eye" className="text-primary" size={24} />
          Видимость атрибутов
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground mb-4">
          Выберите, какие атрибуты будет видеть эта роль в карточке участка
        </p>

        {availableAttributes.map(attr => (
          <div
            key={attr.path}
            className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/5 cursor-pointer transition-colors"
            onClick={() => onToggleAttribute(attr.path)}
          >
            <Checkbox
              id={`attr-${attr.path}`}
              checked={isAttributeVisible(attr.path)}
              onCheckedChange={() => onToggleAttribute(attr.path)}
              className="cursor-pointer"
            />
            <Label
              htmlFor={`attr-${attr.path}`}
              className="flex-1 cursor-pointer"
            >
              <div className="font-medium text-sm">{attr.label}</div>
              <div className="text-xs text-muted-foreground">
                {attr.path}
              </div>
            </Label>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AttributeVisibilityCard;
