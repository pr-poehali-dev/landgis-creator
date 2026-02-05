import { Property } from './propertyService';
import { UserRole } from '@/types/userRoles';

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

class VisibilityService {
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
    
    // Если нет правил или нет условий - показываем все
    if (!rule || rule.propertyConditions.length === 0) {
      return properties;
    }

    // Применяем условия фильтрации
    return properties.filter(property => {
      return rule.propertyConditions.every(condition => 
        this.checkCondition(property, condition)
      );
    });
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
