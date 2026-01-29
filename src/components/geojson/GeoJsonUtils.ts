import { GeoJsonFeature } from './GeoJsonTypes';

export const isWebMercator = (coords: number[]): boolean => {
  return Math.abs(coords[0]) > 180 || Math.abs(coords[1]) > 90;
};

export const webMercatorToWGS84 = (x: number, y: number): [number, number] => {
  const R = 6378137;
  const lon = (x / R) * (180 / Math.PI);
  const lat = (Math.PI / 2 - 2 * Math.atan(Math.exp(-y / R))) * (180 / Math.PI);
  return [lat, lon];
};

export const normalizeCoordinates = (coords: number[]): [number, number] => {
  const x = coords[0];
  const y = coords[1];
  
  if (isWebMercator([x, y])) {
    return webMercatorToWGS84(x, y);
  }
  
  return [coords[1], coords[0]];
};

export const extractCoordinates = (feature: GeoJsonFeature): [number, number] => {
  const { geometry } = feature;
  
  if (!geometry || !geometry.coordinates) {
    console.warn('Геометрия отсутствует, используются координаты по умолчанию');
    return [55.751244, 37.618423];
  }
  
  if (geometry.type === 'Point') {
    const coords = geometry.coordinates as number[];
    return normalizeCoordinates(coords);
  }
  
  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
    const coords = geometry.type === 'Polygon' 
      ? (geometry.coordinates as number[][][])[0]
      : (geometry.coordinates as number[][][][])[0][0];
    
    if (!coords || coords.length === 0) {
      console.warn('Пустые координаты полигона');
      return [55.751244, 37.618423];
    }
    
    const sumX = coords.reduce((sum, c) => sum + c[0], 0);
    const sumY = coords.reduce((sum, c) => sum + c[1], 0);
    const centerX = sumX / coords.length;
    const centerY = sumY / coords.length;
    
    return normalizeCoordinates([centerX, centerY]);
  }
  
  console.warn('Неизвестный тип геометрии:', geometry.type);
  return [55.751244, 37.618423];
};

export const extractBoundary = (feature: GeoJsonFeature): Array<[number, number]> | undefined => {
  const { geometry } = feature;
  
  if (geometry.type === 'Polygon') {
    const coords = (geometry.coordinates as number[][][])[0];
    return coords.map(c => normalizeCoordinates(c));
  }
  
  if (geometry.type === 'MultiPolygon') {
    const coords = (geometry.coordinates as number[][][][])[0][0];
    return coords.map(c => normalizeCoordinates(c));
  }
  
  return undefined;
};

export const getPropertyValue = (properties: Record<string, any>, fieldName?: string, defaultValue: any = '') => {
  if (!fieldName) return defaultValue;
  return properties[fieldName] ?? defaultValue;
};

export const normalizePropertyType = (value: any): 'land' | 'commercial' | 'residential' => {
  const str = String(value || 'land').toLowerCase();
  if (str === 'commercial' || str === 'коммерция') return 'commercial';
  if (str === 'residential' || str === 'жилье' || str === 'жильё') return 'residential';
  return 'land';
};

export const normalizeSegment = (value: any): 'premium' | 'standard' | 'economy' => {
  const str = String(value || 'standard').toLowerCase();
  if (str === 'premium' || str === 'премиум') return 'premium';
  if (str === 'economy' || str === 'эконом') return 'economy';
  return 'standard';
};

export const normalizeStatus = (value: any): 'available' | 'reserved' | 'sold' => {
  const str = String(value || 'available').toLowerCase();
  if (str === 'reserved' || str === 'резерв') return 'reserved';
  if (str === 'sold' || str === 'продан' || str === 'продано') return 'sold';
  return 'available';
};

export const autoDetectMapping = (fields: string[]) => {
  const autoMapping: Record<string, string> = {};
  fields.forEach(field => {
    const lower = field.toLowerCase();
    if (lower.includes('name') || lower.includes('title') || lower.includes('название')) {
      autoMapping.title = field;
    } else if (lower.includes('price') || lower.includes('цена') || lower.includes('стоимость')) {
      autoMapping.price = field;
    } else if (lower.includes('area') || lower.includes('площадь')) {
      autoMapping.area = field;
    } else if (lower.includes('location') || lower.includes('address') || lower.includes('адрес')) {
      autoMapping.location = field;
    }
  });
  return autoMapping;
};
