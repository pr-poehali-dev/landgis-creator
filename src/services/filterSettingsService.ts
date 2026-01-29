import urls from '../../backend/func2url.json';

export interface FilterSetting {
  id: number;
  filter_key: string;
  filter_label: string;
  filter_type: string;
  options?: Record<string, unknown>;
  is_enabled: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

class FilterSettingsService {
  private apiUrl = urls['filter-settings'];
  private cache: FilterSetting[] | null = null;

  async getFilters(): Promise<FilterSetting[]> {
    if (this.cache) {
      return this.cache;
    }

    const response = await fetch(this.apiUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch filter settings');
    }
    
    const filters = await response.json();
    this.cache = filters;
    return filters;
  }

  async upsertFilter(data: {
    filterKey: string;
    filterLabel: string;
    filterType: string;
    options?: Record<string, unknown>;
    isEnabled?: boolean;
    displayOrder?: number;
  }): Promise<FilterSetting> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to upsert filter setting');
    }

    this.cache = null;
    return response.json();
  }

  clearCache(): void {
    this.cache = null;
  }
}

export const filterSettingsService = new FilterSettingsService();
