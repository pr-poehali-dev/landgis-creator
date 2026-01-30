interface DisplayConfig {
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

const API_URL = 'https://functions.poehali.dev/77dffaae-751b-452d-95c4-ace45213b3ad';

class DisplayConfigService {
  private cache: DisplayConfig[] | null = null;

  async getConfigs(type?: string): Promise<DisplayConfig[]> {
    const url = type ? `${API_URL}?type=${type}` : API_URL;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to load display configs');
    
    return await response.json();
  }

  async createConfig(data: Partial<DisplayConfig>): Promise<DisplayConfig> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to create display config');
    return await response.json();
  }

  async updateConfig(id: number, data: Partial<DisplayConfig>): Promise<DisplayConfig> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to update display config');
    return await response.json();
  }

  async deleteConfig(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete display config');
  }

  async batchUpdateOrder(configs: Array<{id: number, displayOrder: number}>): Promise<void> {
    const response = await fetch(`${API_URL}/batch-order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configs })
    });

    if (!response.ok) throw new Error('Failed to update order');
  }

  isVisibleForRole(config: DisplayConfig, role: string): boolean {
    return config.visibleRoles.includes(role);
  }
}

export const displayConfigService = new DisplayConfigService();
export type { DisplayConfig };