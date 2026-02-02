export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(price);
};

export const getTypeLabel = (type: string) => {
  const labels = {
    land: 'Земля',
    commercial: 'Коммерция',
    residential: 'Жильё'
  };
  return labels[type as keyof typeof labels];
};

export const getStatusColor = (status: string) => {
  const colors = {
    available: 'bg-green-500/20 text-green-400 border-green-500/30',
    reserved: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    sold: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };
  return colors[status as keyof typeof colors];
};

export const getSegmentColor = (segment: string) => {
  const colors = {
    premium: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    standard: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    economy: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  };
  return colors[segment as keyof typeof colors];
};

export const getMarkerColor = (segment: string) => {
  const colors = {
    premium: '#8B5CF6',
    standard: '#0EA5E9',
    economy: '#F97316'
  };
  return colors[segment as keyof typeof colors];
};

export const calculatePolygonArea = (boundary?: Array<[number, number]>) => {
  if (!boundary || boundary.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < boundary.length; i++) {
    const j = (i + 1) % boundary.length;
    area += boundary[i][0] * boundary[j][1];
    area -= boundary[j][0] * boundary[i][1];
  }
  area = Math.abs(area) / 2;
  
  const areaInSquareMeters = area * 111000 * 111000;
  const areaInHectares = areaInSquareMeters / 10000;
  
  return areaInHectares;
};
