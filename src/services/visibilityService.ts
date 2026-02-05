import { Property } from './propertyService';

export interface VisibilityRule {
  role: string;
  visibleStatuses: string[];
  visibleSegments: string[];
  visiblePropertyIds: number[];
}

const DEFAULT_RULES: VisibilityRule[] = [
  {
    role: 'admin',
    visibleStatuses: ['available', 'reserved', 'sold'],
    visibleSegments: ['premium', 'standard', 'economy'],
    visiblePropertyIds: []
  },
  {
    role: 'user1',
    visibleStatuses: ['available'],
    visibleSegments: ['premium', 'standard'],
    visiblePropertyIds: []
  },
  {
    role: 'user2',
    visibleStatuses: ['available', 'reserved'],
    visibleSegments: ['standard', 'economy'],
    visiblePropertyIds: []
  }
];

class VisibilityService {
  private getRules(): VisibilityRule[] {
    try {
      const saved = localStorage.getItem('visibilityRules');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading visibility rules:', error);
    }
    return DEFAULT_RULES;
  }

  private getRuleForRole(role: string): VisibilityRule | null {
    const rules = this.getRules();
    return rules.find(r => r.role === role) || null;
  }

  filterPropertiesByRole(properties: Property[], userRole: string): Property[] {
    // Админ видит все всегда
    if (userRole === 'admin') {
      return properties;
    }

    const rule = this.getRuleForRole(userRole);
    if (!rule) {
      console.warn(`No visibility rule found for role: ${userRole}`);
      return properties;
    }

    return properties.filter(property => {
      // Проверка статуса
      const statusMatch = rule.visibleStatuses.includes(property.status);
      if (!statusMatch) return false;

      // Проверка сегмента
      const segmentMatch = rule.visibleSegments.includes(property.segment);
      if (!segmentMatch) return false;

      // Проверка конкретных ID (если указаны)
      if (rule.visiblePropertyIds.length > 0) {
        return rule.visiblePropertyIds.includes(property.id);
      }

      return true;
    });
  }

  getVisiblePropertiesCount(properties: Property[], userRole: string): number {
    return this.filterPropertiesByRole(properties, userRole).length;
  }

  isPropertyVisible(property: Property, userRole: string): boolean {
    if (userRole === 'admin') return true;

    const rule = this.getRuleForRole(userRole);
    if (!rule) return false;

    const statusMatch = rule.visibleStatuses.includes(property.status);
    const segmentMatch = rule.visibleSegments.includes(property.segment);
    const idMatch = rule.visiblePropertyIds.length === 0 || 
                    rule.visiblePropertyIds.includes(property.id);

    return statusMatch && segmentMatch && idMatch;
  }
}

export const visibilityService = new VisibilityService();
