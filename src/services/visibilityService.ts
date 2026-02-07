import { Property } from './propertyService';
import { UserRole } from '@/types/userRoles';
import func2url from '../../backend/func2url.json';

export interface PropertyVisibilityCondition {
  attributePath: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'exists' | 'notExists';
  value: string;
}

export interface AttributeVisibilityRule {
  attributePath: string;
  label: string;
  visibleForRoles: UserRole[];
}

export interface RoleVisibilityRule {
  role: UserRole;
  propertyConditions: PropertyVisibilityCondition[];
  attributeRules: AttributeVisibilityRule[];
}

export interface EditPermissions {
  allowedRoles: UserRole[];
}

class VisibilityService {
  private cachedPermissions: EditPermissions | null = null;
  
  async loadEditPermissionsFromAPI(): Promise<EditPermissions> {
    const apiUrl = func2url['update-attributes'];
    if (!apiUrl) {
      console.warn('API URL not found, using default permissions');
      return { allowedRoles: ['admin'] };
    }

    try {
      const response = await fetch(`${apiUrl}?type=edit_permissions`);
      if (!response.ok) throw new Error('Failed to fetch permissions');
      
      const data = await response.json();
      this.cachedPermissions = data;
      
      // Кэшируем в localStorage для оффлайн доступа
      localStorage.setItem('editPermissions_cache', JSON.stringify(data));
      
      return data;
    } catch (error) {
      console.error('Error loading edit permissions from API:', error);
      
      // Пробуем загрузить из кэша
      try {
        const cached = localStorage.getItem('editPermissions_cache');
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (e) {
        console.error('Error loading from cache:', e);
      }
      
      return { allowedRoles: ['admin'] };
    }
  }

  private getEditPermissions(): EditPermissions {
    // Возвращаем кэшированное значение если есть
    if (this.cachedPermissions) {
      return this.cachedPermissions;
    }

    // Пробуем загрузить из localStorage (админка)
    try {
      const saved = localStorage.getItem('editPermissions');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading edit permissions:', error);
    }
    
    // Пробуем загрузить из кэша API
    try {
      const cached = localStorage.getItem('editPermissions_cache');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Error loading cached permissions:', error);
    }
    
    return { allowedRoles: ['admin'] };
  }

  async saveEditPermissions(permissions: EditPermissions): Promise<void> {
    const apiUrl = func2url['update-attributes'];
    if (!apiUrl) {
      throw new Error('API URL not found');
    }

    try {
      // Сохраняем в localStorage для админки
      localStorage.setItem('editPermissions', JSON.stringify(permissions));
      
      // Сохраняем в БД через API
      const response = await fetch(`${apiUrl}?type=edit_permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissions)
      });
      
      if (!response.ok) throw new Error('Failed to save permissions');
      
      const data = await response.json();
      this.cachedPermissions = data;
      
      // Обновляем кэш
      localStorage.setItem('editPermissions_cache', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving edit permissions:', error);
      throw error;
    }
  }

  canEditProperty(userRole: UserRole): boolean {
    const permissions = this.getEditPermissions();
    return permissions.allowedRoles.includes(userRole);
  }
  private getRules(): RoleVisibilityRule[] {
    try {
      const saved = localStorage.getItem('visibilityRulesV2');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading visibility rules:', error);
    }
    return [];
  }

  private getRuleForRole(role: UserRole): RoleVisibilityRule | null {
    const rules = this.getRules();
    return rules.find(r => r.role === role) || null;
  }

  private checkCondition(property: Property, condition: PropertyVisibilityCondition): boolean {
    let propValue: any;
    
    if (condition.attributePath.startsWith('attributes.')) {
      const key = condition.attributePath.replace('attributes.', '');
      propValue = property.attributes?.[key];
    } else {
      propValue = (property as any)[condition.attributePath];
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
  }

  filterPropertiesByRole(properties: Property[], userRole: UserRole): Property[] {
    // Админ видит все всегда
    if (userRole === 'admin') {
      return properties;
    }

    const rule = this.getRuleForRole(userRole);
    console.log(`📋 Правило для роли ${userRole}:`, rule);
    
    // Если нет правил или нет условий - показываем все
    if (!rule || rule.propertyConditions.length === 0) {
      console.log(`⚠️ Нет правил или условий для ${userRole}, показываем все`);
      return properties;
    }

    console.log(`🔍 Применяем ${rule.propertyConditions.length} условий для ${userRole}`);
    
    // Применяем условия фильтрации
    const filtered = properties.filter(property => {
      const passes = rule.propertyConditions.every(condition => 
        this.checkCondition(property, condition)
      );
      return passes;
    });
    
    console.log(`✅ Отфильтровано: ${filtered.length} из ${properties.length}`);
    return filtered;
  }

  isAttributeVisible(attributePath: string, userRole: UserRole): boolean {
    // Админ видит все всегда
    if (userRole === 'admin') return true;

    const rule = this.getRuleForRole(userRole);
    if (!rule) return true; // По умолчанию показываем, если нет правил

    const attrRule = rule.attributeRules.find(ar => ar.attributePath === attributePath);
    if (!attrRule) return true; // По умолчанию показываем, если нет правила для атрибута

    return attrRule.visibleForRoles.includes(userRole);
  }

  getVisibleAttributesForRole(userRole: UserRole): string[] {
    if (userRole === 'admin') {
      return []; // Пустой массив означает "все атрибуты"
    }

    const rule = this.getRuleForRole(userRole);
    if (!rule) return [];

    return rule.attributeRules
      .filter(ar => ar.visibleForRoles.includes(userRole))
      .map(ar => ar.attributePath);
  }

  getVisiblePropertiesCount(properties: Property[], userRole: UserRole): number {
    return this.filterPropertiesByRole(properties, userRole).length;
  }

  isPropertyVisible(property: Property, userRole: UserRole): boolean {
    if (userRole === 'admin') return true;

    const rule = this.getRuleForRole(userRole);
    if (!rule || rule.propertyConditions.length === 0) return true;

    return rule.propertyConditions.every(condition => 
      this.checkCondition(property, condition)
    );
  }
}

export const visibilityService = new VisibilityService();