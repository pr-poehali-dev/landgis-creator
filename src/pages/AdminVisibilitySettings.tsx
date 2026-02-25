import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { propertyService, Property } from '@/services/propertyService';
import { USER_ROLES, UserRole } from '@/types/userRoles';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { visibilityService, EditPermissions } from '@/services/visibilityService';
import EditPermissionsSection from '@/components/admin/visibility/EditPermissionsSection';
import PropertyConditionsSection from '@/components/admin/visibility/PropertyConditionsSection';
import AttributeVisibilitySection from '@/components/admin/visibility/AttributeVisibilitySection';

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

  const saveEditPermissions = async () => {
    try {
      await visibilityService.saveEditPermissions(editPermissions);
      toast.success('Права редактирования сохранены в БД');
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
      
      const attrMap = new Map<string, Set<string>>();
      const attrLabels = new Map<string, string>();
      
      props.forEach(prop => {
        if (prop.attributes) {
          Object.entries(prop.attributes).forEach(([key, value]) => {
            const path = `attributes.${key}`;
            if (!attrMap.has(path)) {
              attrMap.set(path, new Set());
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
      
      const savedRules = localStorage.getItem('visibilityRulesV2');
      if (savedRules) {
        setRules(JSON.parse(savedRules));
      } else {
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

  const currentRule = getCurrentRoleRule();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <Icon name="Loader2" className="animate-spin" size={32} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Настройка видимости</h1>
            <p className="text-muted-foreground mt-2">
              Управление правами доступа к объектам и атрибутам для различных ролей
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveEditPermissions} variant="outline">
              <Icon name="Save" size={16} className="mr-2" />
              Сохранить права редактирования
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                  Сохранение...
                </>
              ) : (
                <>
                  <Icon name="Save" size={16} className="mr-2" />
                  Сохранить все настройки
                </>
              )}
            </Button>
          </div>
        </div>

        <EditPermissionsSection
          editPermissions={editPermissions}
          onToggleRole={toggleEditRole}
        />

        <Card>
          <CardHeader>
            <CardTitle>Выбор роли</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(USER_ROLES)
                  .filter(([role]) => role !== 'admin')
                  .map(([role, info]) => (
                    <SelectItem key={role} value={role}>
                      {info.name} ({role})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              Выберите роль для настройки видимости объектов и атрибутов
            </p>
          </CardContent>
        </Card>

        <PropertyConditionsSection
          conditions={currentRule?.propertyConditions || []}
          availableAttributes={availableAttributes}
          onAdd={addPropertyCondition}
          onUpdate={updatePropertyCondition}
          onRemove={removePropertyCondition}
        />

        <AttributeVisibilitySection
          availableAttributes={availableAttributes}
          attributeRules={currentRule?.attributeRules || []}
          selectedRole={selectedRole}
          onToggleAttribute={toggleAttributeVisibility}
        />

        <Card>
          <CardHeader>
            <CardTitle>Статистика</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Всего объектов</p>
                <p className="text-2xl font-bold">{properties.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Всего атрибутов</p>
                <p className="text-2xl font-bold">{availableAttributes.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Условий видимости</p>
                <p className="text-2xl font-bold">{currentRule?.propertyConditions.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Видимых атрибутов</p>
                <p className="text-2xl font-bold">
                  {currentRule?.attributeRules.filter(ar => ar.visibleForRoles.includes(selectedRole)).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminVisibilitySettings;