import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { UserRole } from '@/types/userRoles';

interface AttributeVisibilityRule {
  attributePath: string;
  label: string;
  visibleForRoles: UserRole[];
}

interface AttributeVisibilitySectionProps {
  availableAttributes: Array<{path: string; label: string; values: Set<string>}>;
  attributeRules: AttributeVisibilityRule[];
  selectedRole: UserRole;
  onToggleAttribute: (attributePath: string) => void;
}

const AttributeVisibilitySection = ({
  availableAttributes,
  attributeRules,
  selectedRole,
  onToggleAttribute
}: AttributeVisibilitySectionProps) => {
  const isAttributeVisible = (attributePath: string): boolean => {
    const rule = attributeRules.find(ar => ar.attributePath === attributePath);
    return rule ? rule.visibleForRoles.includes(selectedRole) : false;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Видимость атрибутов</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Выберите, какие атрибуты объектов будут видны для выбранной роли
        </p>
        
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {availableAttributes.map(attr => (
            <div key={attr.path} className="flex items-center space-x-2">
              <Checkbox
                id={`attr-${attr.path}`}
                checked={isAttributeVisible(attr.path)}
                onCheckedChange={() => onToggleAttribute(attr.path)}
              />
              <Label htmlFor={`attr-${attr.path}`} className="cursor-pointer text-sm">
                {attr.label}
                <span className="text-xs text-muted-foreground ml-2">
                  ({attr.values.size} значений)
                </span>
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AttributeVisibilitySection;
