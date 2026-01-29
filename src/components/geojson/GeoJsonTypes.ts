export interface GeoJsonFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][] | number[] | number[][][][];
  };
  properties: Record<string, any>;
}

export interface GeoJsonData {
  type: string;
  features: GeoJsonFeature[];
}

export interface FieldMapping {
  title?: string;
  type?: string;
  price?: string;
  area?: string;
  location?: string;
  segment?: string;
  status?: string;
}
