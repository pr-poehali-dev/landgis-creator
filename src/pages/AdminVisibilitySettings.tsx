import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { propertyService, Property } from '@/services/propertyService';
import { USER_ROLES, UserRole } from '@/types/userRoles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { visibilityService, EditPermissions } from '@/services/visibilityService';

interface AttributeVisibilityRule {
  attributePath: string;
  label: string;
  visibleForRoles: UserRole[];
}

interface PropertyVisibilityCondition {
  attributePath: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'exists' | 'notExists';
  value: string;
}

interface RoleVisibilityRule {
  role: UserRole;
  propertyConditions: PropertyVisibilityCondition[];
  attributeRules: AttributeVisibilityRule[];
}

const AdminVisibilitySettings = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole>('user1');
  const [rules, setRules] = useState<RoleVisibilityRule[]>([]);
  const [availableAttributes, setAvailableAttributes] = useState<Array<{path: string; label: string; values: Set<string>}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editPermissions, setEditPermissions] = useState<EditPermissions>({ allowedRoles: ['admin'] });

  useEffect(() => {
    loadData();
    loadEditPermissions();
  }, []);

  const loadEditPermissions = () => {
    try {
      const saved = localStorage.getItem('editPermissions');
      if (saved) {
        setEditPermissions(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading edit permissions:', error);
    }
  };

  const saveEditPermissions = () => {
    try {
      visibilityService.saveEditPermissions(editPermissions);
      toast.success('Права редактирования сохранены');
    } catch (error) {
      toast.error('Ошибка сохранения прав редактирования');
      console.error('Error saving edit permissions:', error);
    }
  };

  const toggleEditRole = (role: UserRole) => {
    setEditPermissions(prev => {
      const allowedRoles = prev.allowedRoles.includes(role)
        ? prev.allowedRoles.filter(r => r !== role)
        : [...prev.allowedRoles, role];
      return { allowedRoles };
    });
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const props = await propertyService.getProperties();
      setProperties(props);
      
      // Анализируем все доступные атрибуты
      const attrMap = new Map<string, Set<string>>();
      const attrLabels = new Map<string, string>();
      
      props.forEach(prop => {
        if (prop.attributes) {
          Object.entries(prop.attributes).forEach(([key, value]) => {
            const path = `attributes.${key}`;
            if (!attrMap.has(path)) {
              attrMap.set(path, new Set());
              // Генерируем читаемое название
              attrLabels.set(path, key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
            }
            
            if (value) {
              const strValue = String(value);
              if (strValue && !strValue.startsWith('lyr_')) {
                attrMap.get(path)?.add(strValue);
              }
            }
          });
        }
        
        // Добавляем стандартные поля
        ['status', 'segment', 'type'].forEach(field => {
          if (!attrMap.has(field)) {
            attrMap.set(field, new Set());
            attrLabels.set(field, field === 'status' ? 'Статус' : field === 'segment' ? 'Сегмент' : 'Тип');
          }
          const value = (prop as any)[field];
          if (value) {
            attrMap.get(field)?.add(String(value));
          }
        });
      });
      
      const attrs = Array.from(attrMap.entries()).map(([path, values]) => ({
        path,
        label: attrLabels.get(path) || path,
        values
      }));
      setAvailableAttributes(attrs);
      
      // Загружаем сохраненные правила
      const savedRules = localStorage.getItem('visibilityRulesV2');
      if (savedRules) {
        setRules(JSON.parse(savedRules));
      } else {
        // Инициализируем правила по умолчанию для всех ролей
        const defaultRules: RoleVisibilityRule[] = Object.keys(USER_ROLES)
          .filter(role => role !== 'admin')
          .map(role => ({
            role: role as UserRole,
            propertyConditions: [],
            attributeRules: attrs.map(attr => ({
              attributePath: attr.path,
              label: attr.label,
              visibleForRoles: [role as UserRole]
            }))
          }));
        setRules(defaultRules);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('visibilityRulesV2', JSON.stringify(rules));
      toast.success('Настройки видимости сохранены');
    } catch (error) {
      console.error('Error saving rules:', error);
      toast.error('Не удалось сохранить настройки');
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentRoleRule = (): RoleVisibilityRule | undefined => {
    return rules.find(r => r.role === selectedRole);
  };

  const addPropertyCondition = () => {
    const newRules = [...rules];
    const ruleIndex = newRules.findIndex(r => r.role === selectedRole);
    
    if (ruleIndex === -1) {
      newRules.push({
        role: selectedRole,
        propertyConditions: [{
          attributePath: availableAttributes[0]?.path || 'status',
          operator: 'equals',
          value: ''
        }],
        attributeRules: []
      });
    } else {
      newRules[ruleIndex].propertyConditions.push({
        attributePath: availableAttributes[0]?.path || 'status',
        operator: 'equals',
        value: ''
      });
    }
    
    setRules(newRules);
  };

  const updatePropertyCondition = (index: number, field: keyof PropertyVisibilityCondition, value: string) => {
    const newRules = [...rules];
    const ruleIndex = newRules.findIndex(r => r.role === selectedRole);
    
    if (ruleIndex !== -1) {
      (newRules[ruleIndex].propertyConditions[index] as any)[field] = value;
      setRules(newRules);
    }
  };

  const removePropertyCondition = (index: number) => {
    const newRules = [...rules];
    const ruleIndex = newRules.findIndex(r => r.role === selectedRole);
    
    if (ruleIndex !== -1) {
      newRules[ruleIndex].propertyConditions.splice(index, 1);
      setRules(newRules);
    }
  };

  const toggleAttributeVisibility = (attributePath: string) => {
    const newRules = [...rules];
    const ruleIndex = newRules.findIndex(r => r.role === selectedRole);
    
    if (ruleIndex === -1) {
      const attr = availableAttributes.find(a => a.path === attributePath);
      newRules.push({
        role: selectedRole,
        propertyConditions: [],
        attributeRules: [{
          attributePath,
          label: attr?.label || attributePath,
          visibleForRoles: [selectedRole]
        }]
      });
    } else {
      const attrIndex = newRules[ruleIndex].attributeRules.findIndex(ar => ar.attributePath === attributePath);
      
      if (attrIndex === -1) {
        const attr = availableAttributes.find(a => a.path === attributePath);
        newRules[ruleIndex].attributeRules.push({
          attributePath,
          label: attr?.label || attributePath,
          visibleForRoles: [selectedRole]
        });
      } else {
        const roles = newRules[ruleIndex].attributeRules[attrIndex].visibleForRoles;
        const roleIndex = roles.indexOf(selectedRole);
        
        if (roleIndex > -1) {
          roles.splice(roleIndex, 1);
        } else {
          roles.push(selectedRole);
        }
      }
    }
    
    setRules(newRules);
  };

  const isAttributeVisible = (attributePath: string): boolean => {
    const rule = getCurrentRoleRule();
    if (!rule) return false;
    
    const attrRule = rule.attributeRules.find(ar => ar.attributePath === attributePath);
    if (!attrRule) return false;
    
    return attrRule.visibleForRoles.includes(selectedRole);
  };

  const getVisiblePropertiesCount = (): number => {
    const rule = getCurrentRoleRule();
    if (!rule || rule.propertyConditions.length === 0) return properties.length;
    
    return properties.filter(prop => {
      return rule.propertyConditions.every(condition => {
        let propValue: any;
        
        if (condition.attributePath.startsWith('attributes.')) {
          const key = condition.attributePath.replace('attributes.', '');
          propValue = prop.attributes?.[key];
        } else {
          propValue = (prop as any)[condition.attributePath];
        }
        
        const strValue = String(propValue || '');
        
        switch (condition.operator) {
          case 'equals':
            return strValue === condition.value;
          case 'notEquals':
            return strValue !== condition.value;
          case 'contains':
            return strValue.includes(condition.value);
          case 'notContains':
            return !strValue.includes(condition.value);
          case 'exists':
            return !!propValue;
          case 'notExists':
            return !propValue;
          default:
            return true;
        }
      });
    }).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <div className="flex items-center justify-center py-12">
          <Icon name="Loader2" className="animate-spin text-primary" size={32} />
        </div>
      </div>
    );
  }

  const currentRule = getCurrentRoleRule();
  const operators = [
    { value: 'equals', label: 'Равно' },
    { value: 'notEquals', label: 'Не равно' },
    { value: 'contains', label: 'Содержит' },
    { value: 'notContains', label: 'Не содержит' },
    { value: 'exists', label: 'Существует' },
    { value: 'notExists', label: 'Не существует' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />

      <div className="container mx-auto px-4 lg:px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Настройки видимости для ролей</h2>
          <p className="text-muted-foreground">
            Управляйте доступом к участкам и их атрибутам для разных пользователей
          </p>
        </div>

        {/* Права на редактирование участков */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Pencil" className="text-primary" size={24} />
              Права на редактирование участков
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Выберите роли, которые могут редактировать информацию об участках
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(Object.keys(USER_ROLES) as UserRole[]).map(role => {
                const roleInfo = USER_ROLES[role];
                const isChecked = editPermissions.allowedRoles.includes(role);
                return (
                  <div 
                    key={role} 
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      isChecked ? 'bg-primary/5 border-primary' : 'hover:bg-accent'
                    }`}
                    onClick={() => toggleEditRole(role)}
                  >
                    <Checkbox 
                      checked={isChecked}
                      onCheckedChange={() => toggleEditRole(role)}
                    />
                    <div>
                      <div className="font-medium">{roleInfo.name}</div>
                      <div className="text-xs text-muted-foreground">{roleInfo.tier}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={saveEditPermissions} className="gap-2">
                <Icon name="Save" size={16} />
                Сохранить права редактирования
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Выбор роли */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Users" className="text-primary" size={24} />
              Выберите роль пользователя
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(Object.keys(USER_ROLES) as UserRole[])
                .filter(role => role !== 'admin')
                .map(role => {
                  const roleInfo = USER_ROLES[role];
                  return (
                    <Button
                      key={role}
                      variant={selectedRole === role ? 'default' : 'outline'}
                      onClick={() => setSelectedRole(role)}
                      className="h-auto py-4 flex-col items-start gap-2"
                    >
                      <div className="font-semibold">{roleInfo.name}</div>
                      <div className="text-xs opacity-70">{roleInfo.tier}</div>
                    </Button>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {/* Условия видимости участков */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="Filter" className="text-primary" size={24} />
                  Условия отображения участков
                </div>
                <div className="text-sm font-normal text-muted-foreground">
                  Видимых участков: {getVisiblePropertiesCount()} из {properties.length}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentRule?.propertyConditions.map((condition, index) => {
                  const attr = availableAttributes.find(a => a.path === condition.attributePath);
                  return (
                    <div key={index} className="flex gap-2 items-start p-4 border rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Select
                          value={condition.attributePath}
                          onValueChange={(value) => updatePropertyCondition(index, 'attributePath', value)}
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
                          onValueChange={(value) => updatePropertyCondition(index, 'operator', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {operators.map(op => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {condition.operator !== 'exists' && condition.operator !== 'notExists' && (
                          <Select
                            value={condition.value}
                            onValueChange={(value) => updatePropertyCondition(index, 'value', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите значение" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from(attr?.values || []).map(value => (
                                <SelectItem key={value} value={value}>
                                  {value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePropertyCondition(index)}
                      >
                        <Icon name="X" size={16} />
                      </Button>
                    </div>
                  );
                })}

                <Button onClick={addPropertyCondition} variant="outline" className="w-full">
                  <Icon name="Plus" className="mr-2" size={16} />
                  Добавить условие
                </Button>

                {(!currentRule?.propertyConditions || currentRule.propertyConditions.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon name="Filter" className="mx-auto mb-2 opacity-20" size={48} />
                    <p>Нет условий — все участки видимы</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Видимость атрибутов */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Eye" className="text-primary" size={24} />
                Видимость атрибутов участков
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableAttributes.map(attr => (
                  <div key={attr.path} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Checkbox
                      id={attr.path}
                      checked={isAttributeVisible(attr.path)}
                      onCheckedChange={() => toggleAttributeVisibility(attr.path)}
                    />
                    <Label htmlFor={attr.path} className="flex-1 cursor-pointer">
                      <div className="font-medium">{attr.label}</div>
                      <div className="text-xs text-muted-foreground">{attr.path}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 mt-6">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Save" className="mr-2" size={16} />
                Сохранить настройки
              </>
            )}
          </Button>
          <Button variant="outline" onClick={loadData}>
            <Icon name="RotateCcw" className="mr-2" size={16} />
            Сбросить изменения
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminVisibilitySettings;