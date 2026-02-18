interface Property {
  id: number;
  title: string;
  type: 'land' | 'commercial' | 'residential';
  price: number;
  area: number;
  location: string;
  coordinates: [number, number];
  segment: 'premium' | 'standard' | 'economy';
  status: 'available' | 'reserved' | 'sold';
  boundary?: Array<[number, number]>;
  attributes?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://functions.poehali.dev/ac71b9f6-6521-4747-af29-18fd8700222c';
const CACHE_KEY = 'landgis_properties_cache_v2';
const CACHE_DURATION = 5 * 60 * 1000;

interface CacheData {
  properties: Property[];
  timestamp: number;
}

class PropertyService {
  private subscribers: Set<(properties: Property[]) => void> = new Set();
  private cache: Property[] | null = null;
  private lastFetch: number = 0;

  private loadFromLocalStorage(): CacheData | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      const data: CacheData = JSON.parse(cached);
      if (Date.now() - data.timestamp > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  private saveToLocalStorage(properties: Property[]) {
    try {
      const data: CacheData = {
        properties,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private notifySubscribers() {
    if (this.cache) {
      this.subscribers.forEach(callback => callback([...this.cache!]));
    }
  }

  subscribe(callback: (properties: Property[]) => void) {
    this.subscribers.add(callback);
    if (this.cache) {
      callback([...this.cache]);
    }
    return () => this.subscribers.delete(callback);
  }

  async getProperties(forceRefresh = false): Promise<Property[]> {
    if (!forceRefresh && this.cache && Date.now() - this.lastFetch < CACHE_DURATION) {
      return [...this.cache];
    }

    const cachedData = this.loadFromLocalStorage();
    if (!forceRefresh && cachedData) {
      this.cache = cachedData.properties;
      this.lastFetch = cachedData.timestamp;
      return [...this.cache];
    }

    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to load properties');
      
      const properties: Property[] = await response.json();
      // Очищаем пробелы в названиях на всякий случай
      properties.forEach(p => {
        if (p.title) p.title = p.title.trim();
      });
      this.cache = properties;
      this.lastFetch = Date.now();
      this.saveToLocalStorage(properties);
      this.notifySubscribers();
      
      return [...properties];
    } catch (error) {
      console.error('Error loading properties:', error);
      if (this.cache) return [...this.cache];
      throw error;
    }
  }

  async createProperty(data: Omit<Property, 'id' | 'created_at' | 'updated_at'>): Promise<Property> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to create property');
    
    const newProperty: Property = await response.json();
    
    if (this.cache) {
      this.cache = [newProperty, ...this.cache];
      this.saveToLocalStorage(this.cache);
      this.notifySubscribers();
    }
    
    return newProperty;
  }

  async updateProperty(id: number, data: Partial<Omit<Property, 'id' | 'created_at' | 'updated_at'>>): Promise<Property> {
    const response = await fetch(`${API_URL}?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to update property');
    
    const updatedProperty: Property = await response.json();
    
    if (this.cache) {
      this.cache = this.cache.map(p => p.id === id ? updatedProperty : p);
      this.saveToLocalStorage(this.cache);
      this.notifySubscribers();
    }
    
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<void> {
    const response = await fetch(`${API_URL}?id=${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete property');
    
    if (this.cache) {
      this.cache = this.cache.filter(p => p.id !== id);
      this.saveToLocalStorage(this.cache);
      this.notifySubscribers();
    }
  }

  invalidateCache() {
    this.cache = null;
    this.lastFetch = 0;
    localStorage.removeItem(CACHE_KEY);
  }
}

export const propertyService = new PropertyService();
export type { Property };