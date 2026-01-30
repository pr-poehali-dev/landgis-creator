import func2url from '../../backend/func2url.json';

const API_URL = func2url['display-config'];

export interface DisplayConfig {
  id: number;
  configType: 'attribute' | 'image' | 'document' | 'contact_button' | 'custom_element';
  configKey: string;
  displayName: string;
  displayOrder: number;
  visibleRoles: string[];
  enabled: boolean;
  settings: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export const displayConfigService = {
  async getConfigs(type?: string): Promise<DisplayConfig[]> {
    const url = type ? `${API_URL}?type=${type}` : API_URL;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch configs');
    }
    return response.json();
  },

  async createConfig(config: Omit<DisplayConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<DisplayConfig> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      throw new Error('Failed to create config');
    }
    return response.json();
  },

  async updateConfig(id: number, config: Partial<DisplayConfig>): Promise<DisplayConfig> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      throw new Error('Failed to update config');
    }
    return response.json();
  },

  async deleteConfig(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete config');
    }
  },

  async batchUpdateOrder(updates: { id: number; displayOrder: number }[]): Promise<void> {
    const response = await fetch(`${API_URL}/batch-order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    if (!response.ok) {
      throw new Error('Failed to update order');
    }
  },

  isVisibleForRole(config: DisplayConfig, userRole: string): boolean {
    return config.visibleRoles.includes(userRole);
  },
};
