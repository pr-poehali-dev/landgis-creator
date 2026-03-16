import { UserRole } from '@/types/userRoles';
import func2url from '../../backend/func2url.json';

export interface FilterVisibilityRule {
  filterId: string;
  hiddenForRoles: UserRole[];
  hiddenForCompanies: number[];
}

export interface FilterVisibilityConfig {
  rules: FilterVisibilityRule[];
  updatedAt: string;
}

const STORAGE_KEY = 'filterVisibilityConfig';

class FilterVisibilityService {
  private config: FilterVisibilityConfig | null = null;

  async loadConfig(): Promise<FilterVisibilityConfig> {
    try {
      const apiUrl = (func2url as Record<string, string>)['filter-config'];
      if (apiUrl) {
        const response = await fetch(`${apiUrl}?type=filter_visibility`);
        if (response.ok) {
          const data = await response.json();
          if (data.rules) {
            this.config = data;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return data;
          }
        }
      }
    } catch (e) {
      console.error('Error loading filter visibility from API:', e);
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.config = JSON.parse(saved);
        return this.config!;
      }
    } catch (e) {
      console.error('Error loading filter visibility from localStorage:', e);
    }

    return { rules: [], updatedAt: '' };
  }

  async saveConfig(config: FilterVisibilityConfig): Promise<void> {
    this.config = config;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

    try {
      const apiUrl = (func2url as Record<string, string>)['filter-config'];
      if (apiUrl) {
        await fetch(`${apiUrl}?type=filter_visibility`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
      }
    } catch (e) {
      console.error('Error saving filter visibility to API:', e);
    }
  }

  isFilterVisible(filterId: string, userRole: UserRole, companyId?: number): boolean {
    if (userRole === 'admin') return true;

    const config = this.getConfigSync();
    if (!config || config.rules.length === 0) return true;

    const rule = config.rules.find(r => r.filterId === filterId);
    if (!rule) return true;

    if (rule.hiddenForRoles.includes(userRole)) return false;

    if (companyId && rule.hiddenForCompanies.includes(companyId)) return false;

    return true;
  }

  getVisibleFilters(
    filterIds: string[],
    userRole: UserRole,
    companyId?: number
  ): string[] {
    if (userRole === 'admin') return filterIds;
    return filterIds.filter(id => this.isFilterVisible(id, userRole, companyId));
  }

  private getConfigSync(): FilterVisibilityConfig | null {
    if (this.config) return this.config;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.config = JSON.parse(saved);
        return this.config;
      }
    } catch (e) {
      console.error('Error reading config sync:', e);
    }

    return null;
  }

  clearCache(): void {
    this.config = null;
  }
}

export const filterVisibilityService = new FilterVisibilityService();