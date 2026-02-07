import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';

interface PropertyVisibilityCondition {
  attributePath: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'exists' | 'notExists';
  value: string;
}

interface PropertyConditionsSectionProps {
  conditions: PropertyVisibilityCondition[];
  availableAttributes: Array<{path: string; label: string; values: Set<string>}>;
  onAdd: () => void;
  onUpdate: (index: number, field: keyof PropertyVisibilityCondition, value: string) => void;
  onRemove: (index: number) => void;
}

const PropertyConditionsSection = ({
  conditions,
  availableAttributes,
  onAdd,
  onUpdate,
  onRemove
}: PropertyConditionsSectionProps) => {
  const operatorLabels = {
    equals: 'Равно',
    notEquals: 'Не равно',
    contains: 'Содержит',
    notContains: 'Не содержит',
    exists: 'Существует',
    notExists: 'Не существует'
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Условия видимости объектов</CardTitle>
          <Button onClick={onAdd} size="sm" variant="outline">
            <Icon name="Plus" size={16} className="mr-2" />
            Добавить условие
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Объекты будут видны роли только если выполнены ВСЕ условия (AND). Если условий нет — видны все объекты.
        </p>
        
        {conditions.length === 0 ? (
          <div className="text-sm text-muted-foreground italic">
            Нет условий. Все объекты видны для этой роли.
          </div>
        ) : (
          <div className="space-y-3">
            {conditions.map((condition, index) => {
              const attr = availableAttributes.find(a => a.path === condition.attributePath);
              const needsValue = !['exists', 'notExists'].includes(condition.operator);
              
              return (
                <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Select
                      value={condition.attributePath}
                      onValueChange={(value) => onUpdate(index, 'attributePath', value)}
                    >
                      <SelectTrigger>
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
                      onValueChange={(value) => onUpdate(index, 'operator', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(operatorLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {needsValue && (
                      attr && attr.values.size > 0 ? (
                        <Select
                          value={condition.value}
                          onValueChange={(value) => onUpdate(index, 'value', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите значение" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from(attr.values).sort().map(val => (
                              <SelectItem key={val} value={val}>
                                {val}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={condition.value}
                          onChange={(e) => onUpdate(index, 'value', e.target.value)}
                          placeholder="Введите значение"
                        />
                      )
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Icon name="Trash2" size={16} />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyConditionsSection;
