interface AttributeConfig {
  id: number;
  attributeKey: string;
  displayName: string;
  displayOrder: number;
  visibleInTable: boolean;
  visibleRoles: string[];
  createdAt?: string;
  updatedAt?: string;
}

const API_URL = 'https://functions.poehali.dev/a3036691-51a9-417e-bbf2-0b462f69207b';

class AttributeConfigService {
  private cache: AttributeConfig[] | null = null;

  async getConfigs(): Promise<AttributeConfig[]> {
    if (this.cache) {
      return [...this.cache];
    }

    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to load attribute configs');
    
    const configs: AttributeConfig[] = await response.json();
    this.cache = configs;
    return [...configs];
  }

  async createOrUpdateConfig(data: Partial<AttributeConfig>): Promise<AttributeConfig> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to save attribute config');
    
    const config: AttributeConfig = await response.json();
    this.cache = null;
    return config;
  }

  async updateConfig(data: Partial<AttributeConfig>): Promise<AttributeConfig> {
    const response = await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to update attribute config');
    
    const config: AttributeConfig = await response.json();
    this.cache = null;
    return config;
  }

  async deleteConfig(attributeKey: string): Promise<void> {
    const response = await fetch(`${API_URL}?key=${attributeKey}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete attribute config');
    this.cache = null;
  }

  async batchUpdateOrder(configs: Array<{attributeKey: string, displayOrder: number}>): Promise<void> {
    for (const config of configs) {
      await this.updateConfig(config);
    }
    this.cache = null;
  }

  async renameAttributeKey(oldKey: string, newKey: string): Promise<void> {
    const response = await fetch(`${API_URL}/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldKey, newKey })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to rename attribute key: ${error}`);
    }
    
    this.cache = null;
  }

  invalidateCache() {
    this.cache = null;
  }

  getDisplayName(attributeKey: string, configs: AttributeConfig[]): string {
    const config = configs.find(c => c.attributeKey === attributeKey);
    return config?.displayName || attributeKey;
  }

  isVisibleInTable(attributeKey: string, configs: AttributeConfig[]): boolean {
    const config = configs.find(c => c.attributeKey === attributeKey);
    return config?.visibleInTable || false;
  }

  isVisibleForRole(attributeKey: string, role: string, configs: AttributeConfig[]): boolean {
    const config = configs.find(c => c.attributeKey === attributeKey);
    return config?.visibleRoles?.includes(role) || false;
  }
}

export const attributeConfigService = new AttributeConfigService();
export type { AttributeConfig };