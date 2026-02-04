interface PolygonStyle {
  attribute_key: string;
  attribute_value: string;
  fill_color: string;
  fill_opacity: number;
  stroke_color: string;
  stroke_width: number;
}

interface StyleSettings {
  active_attribute: string;
  styles: Map<string, PolygonStyle>;
}

class PolygonStyleService {
  private settings: StyleSettings | null = null;
  private listeners: Set<() => void> = new Set();

  async loadSettings(): Promise<StyleSettings> {
    try {
      const settingsResponse = await fetch('https://functions.poehali.dev/b947d498-cdee-47dc-a023-88238f54cc5d');
      const settingsData = await settingsResponse.json();
      const activeAttribute = settingsData.active_attribute || 'segment';

      const stylesResponse = await fetch(`https://functions.poehali.dev/de96a125-7f5a-4aa7-b466-17e6e98c55c7?attribute_key=${activeAttribute}`);
      const stylesData = await stylesResponse.json();

      const stylesMap = new Map<string, PolygonStyle>();
      stylesData.forEach((style: PolygonStyle) => {
        stylesMap.set(style.attribute_value, style);
      });

      this.settings = {
        active_attribute: activeAttribute,
        styles: stylesMap
      };

      return this.settings;
    } catch (error) {
      console.error('Error loading polygon styles:', error);
      return {
        active_attribute: 'segment',
        styles: new Map()
      };
    }
  }

  getSettings(): StyleSettings | null {
    return this.settings;
  }

  getStyleForProperty(property: any): { fillColor: string; fillOpacity: number; strokeColor: string; strokeWidth: number } {
    if (!this.settings) {
      return {
        fillColor: '#ff6b35',
        fillOpacity: 0.25,
        strokeColor: '#ff6b35',
        strokeWidth: 2
      };
    }

    const { active_attribute, styles } = this.settings;
    let value = null;

    if (active_attribute === 'segment') {
      value = property.attributes?.segment || property.segment;
    } else if (active_attribute === 'status') {
      value = property.status;
    } else if (active_attribute === 'type') {
      value = property.type;
    } else {
      value = property.attributes?.[active_attribute];
    }

    if (value && typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          value = parsed[0];
        }
      } catch {
        if (value.includes(',')) {
          value = value.split(',')[0].trim();
        }
      }
    } else if (value && Array.isArray(value)) {
      value = value[0];
    }

    const style = value ? styles.get(String(value)) : null;

    if (style) {
      return {
        fillColor: style.fill_color,
        fillOpacity: Number(style.fill_opacity),
        strokeColor: style.stroke_color,
        strokeWidth: style.stroke_width
      };
    }

    return {
      fillColor: '#ff6b35',
      fillOpacity: 0.25,
      strokeColor: '#ff6b35',
      strokeWidth: 2
    };
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  async reload() {
    await this.loadSettings();
    this.notifyListeners();
  }
}

export const polygonStyleService = new PolygonStyleService();

window.addEventListener('polygon-styles-updated', () => {
  polygonStyleService.reload();
});