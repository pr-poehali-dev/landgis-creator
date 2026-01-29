import urls from '../../backend/func2url.json';

export interface MapSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string;
  created_at: string;
  updated_at: string;
}

class MapSettingsService {
  private apiUrl = urls['map-settings'];
  private cache: MapSetting[] | null = null;

  async getSettings(): Promise<MapSetting[]> {
    if (this.cache) {
      return this.cache;
    }

    const response = await fetch(this.apiUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch map settings');
    }
    
    const settings = await response.json();
    this.cache = settings;
    return settings;
  }

  async getSetting(key: string): Promise<string | null> {
    const settings = await this.getSettings();
    const setting = settings.find(s => s.setting_key === key);
    return setting ? setting.setting_value : null;
  }

  async upsertSetting(settingKey: string, settingValue: string, description?: string): Promise<MapSetting> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        settingKey,
        settingValue,
        description
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to upsert map setting');
    }

    this.cache = null;
    return response.json();
  }

  clearCache(): void {
    this.cache = null;
  }
}

export const mapSettingsService = new MapSettingsService();
