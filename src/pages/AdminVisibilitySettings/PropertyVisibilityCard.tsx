import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface PropertyVisibilityCondition {
  attributePath: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'exists' | 'notExists';
  value: string;
}

interface PropertyVisibilityCardProps {
  conditions: PropertyVisibilityCondition[];
  availableAttributes: Array<{path: string; label: string; values: Set<string>}>;
  onAddCondition: () => void;
  onUpdateCondition: (index: number, field: keyof PropertyVisibilityCondition, value: string) => void;
  onRemoveCondition: (index: number) => void;
}

const PropertyVisibilityCard = ({
  conditions,
  availableAttributes,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition
}: PropertyVisibilityCardProps) => {
  const getAvailableValues = (attributePath: string): string[] => {
    const attr = availableAttributes.find(a => a.path === attributePath);
    return attr ? Array.from(attr.values) : [];
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Filter" className="text-primary" size={24} />
          Фильтры видимости участков
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground mb-4">
          Пользователь увидит только участки, соответствующие этим условиям. Если условий нет — показываются все участки.
        </p>

        {conditions.map((condition, index) => (
          <div key={index} className="flex gap-2 items-start p-3 bg-accent/5 rounded-lg">
            <div className="flex-1 space-y-2">
              <Select
                value={condition.attributePath}
                onValueChange={(value) => onUpdateCondition(index, 'attributePath', value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableAttributes.map(attr => (
                    <SelectItem key={attr.path} value={attr.path}>
                      {attr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={condition.operator}
                onValueChange={(value) => onUpdateCondition(index, 'operator', value as any)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">равно</SelectItem>
                  <SelectItem value="notEquals">не равно</SelectItem>
                  <SelectItem value="contains">содержит</SelectItem>
                  <SelectItem value="notContains">не содержит</SelectItem>
                  <SelectItem value="exists">существует</SelectItem>
                  <SelectItem value="notExists">не существует</SelectItem>
                </SelectContent>
              </Select>

              {!['exists', 'notExists'].includes(condition.operator) && (
                getAvailableValues(condition.attributePath).length > 0 ? (
                  <Select
                    value={condition.value}
                    onValueChange={(value) => onUpdateCondition(index, 'value', value)}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Выберите значение" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableValues(condition.attributePath).map(val => (
                        <SelectItem key={val} value={val}>
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="text"
                    value={condition.value}
                    onChange={(e) => onUpdateCondition(index, 'value', e.target.value)}
                    placeholder="Введите значение"
                    className="text-sm"
                  />
                )
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveCondition(index)}
              className="mt-1"
            >
              <Icon name="Trash2" size={16} />
            </Button>
          </div>
        ))}

        <Button
          onClick={onAddCondition}
          variant="outline"
          className="w-full"
        >
          <Icon name="Plus" size={16} className="mr-2" />
          Добавить условие
        </Button>
      </CardContent>
    </Card>
  );
};

export default PropertyVisibilityCard;
