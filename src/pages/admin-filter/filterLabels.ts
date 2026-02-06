export const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    available: 'Доступно',
    reserved: 'Резерв',
    sold: 'Продано'
  };
  return labels[status] || status;
};

export const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    land: 'Земля',
    commercial: 'Коммерция',
    residential: 'Жильё'
  };
  return labels[type] || type;
};

export const getOptionLabel = (columnId: string, value: string) => {
  if (columnId === 'status') return getStatusLabel(value);
  if (columnId === 'type') return getTypeLabel(value);
  return value;
};
