import func2url from '../../backend/func2url.json';

const API_URL = func2url['update-attributes'] ? `${func2url['update-attributes']}?type=config` : '';

export interface DisplayConfig {
  id: number;
  configType: 'attribute' | 'image' | 'document' | 'contact_button' | 'custom_element' | 'iframe' | 'button';
  configKey: string;
  displayName: string;
  displayOrder: number;
  visibleRoles: string[];
  enabled: boolean;
  settings: Record<string, any>;
  formatType?: 'text' | 'textarea' | 'number' | 'money' | 'boolean' | 'select' | 'date';
  formatOptions?: { options?: string[] } | null;
  createdAt?: string;
  updatedAt?: string;
}

type BackendConfig = {
  id: number;
  attributeKey: string;
  displayName: string;
  displayOrder: number;
  visibleInTable: boolean;
  visibleRoles: string[];
  createdAt?: string;
  updatedAt?: string;
};

function mapBackendToFrontend(backend: BackendConfig): DisplayConfig {
  return {
    id: backend.id,
    configType: 'attribute',
    configKey: backend.attributeKey,
    displayName: backend.displayName,
    displayOrder: backend.displayOrder,
    visibleRoles: backend.visibleRoles,
    enabled: backend.visibleInTable,
    settings: {},
    createdAt: backend.createdAt,
    updatedAt: backend.updatedAt
  };
}

function mapFrontendToBackend(frontend: Partial<DisplayConfig>) {
  const result: any = {};
  if (frontend.configKey !== undefined) result.attributeKey = frontend.configKey;
  if (frontend.displayName !== undefined) result.displayName = frontend.displayName;
  if (frontend.displayOrder !== undefined) result.displayOrder = frontend.displayOrder;
  if (frontend.enabled !== undefined) result.visibleInTable = frontend.enabled;
  if (frontend.visibleRoles !== undefined) result.visibleRoles = frontend.visibleRoles;
  return result;
}

export const displayConfigService = {
  async getConfigs(type?: string): Promise<DisplayConfig[]> {
    if (!API_URL) {
      console.error('update-attributes function not available');
      return [];
    }
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch configs');
    }
    const data: BackendConfig[] = await response.json();
    return data.map(mapBackendToFrontend);
  },

  async createConfig(config: Omit<DisplayConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<DisplayConfig> {
    const backendData = mapFrontendToBackend(config);
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendData),
    });
    if (!response.ok) {
      throw new Error('Failed to create config');
    }
    const data: BackendConfig = await response.json();
    return mapBackendToFrontend(data);
  },

  async updateConfig(id: number, config: Partial<DisplayConfig>): Promise<DisplayConfig> {
    const allConfigs = await this.getConfigs();
    const existingConfig = allConfigs.find(c => c.id === id);
    if (!existingConfig) {
      throw new Error('Config not found');
    }
    
    const backendData = mapFrontendToBackend(config);
    backendData.attributeKey = config.configKey || existingConfig.configKey;
    
    const response = await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendData),
    });
    if (!response.ok) {
      throw new Error('Failed to update config');
    }
    const data: BackendConfig = await response.json();
    return mapBackendToFrontend(data);
  },

  async deleteConfig(id: number): Promise<void> {
    const allConfigs = await this.getConfigs();
    const configToDelete = allConfigs.find(c => c.id === id);
    if (!configToDelete) {
      throw new Error('Config not found');
    }
    
    const response = await fetch(`${API_URL}?key=${encodeURIComponent(configToDelete.configKey)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete config');
    }
  },

  async batchUpdateOrder(updates: { id: number; displayOrder: number }[]): Promise<void> {
    if (!API_URL) {
      throw new Error('update-attributes function not available');
    }
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to batch update order');
    }
  },

  isVisibleForRole(config: DisplayConfig, userRole: string): boolean {
    return config.visibleRoles.includes(userRole);
  },

  // Получение конфига из localStorage
  getLocalConfigs(): DisplayConfig[] {
    const saved = localStorage.getItem('displayConfigs');
    return saved ? JSON.parse(saved) : [];
  },

  // Сохранение конфига в localStorage + синхронизация между доменами через BroadcastChannel
  saveLocalConfigs(configs: DisplayConfig[]): void {
    localStorage.setItem('displayConfigs', JSON.stringify(configs));
    
    // Отправляем событие для синхронизации между вкладками
    try {
      const channel = new BroadcastChannel('display_configs_sync');
      channel.postMessage({ type: 'update', configs });
      channel.close();
    } catch (e) {
      // BroadcastChannel не поддерживается
    }
  },

  // Подписка на изменения конфига
  subscribeToUpdates(callback: (configs: DisplayConfig[]) => void): () => void {
    try {
      const channel = new BroadcastChannel('display_configs_sync');
      const handler = (event: MessageEvent) => {
        if (event.data.type === 'update') {
          localStorage.setItem('displayConfigs', JSON.stringify(event.data.configs));
          callback(event.data.configs);
        }
      };
      channel.addEventListener('message', handler);
      return () => {
        channel.removeEventListener('message', handler);
        channel.close();
      };
    } catch (e) {
      return () => {};
    }
  },
};