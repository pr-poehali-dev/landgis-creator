import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Property } from '@/services/propertyService';

interface AdminStatsProps {
  properties: Property[];
}

const AdminStats = ({ properties }: AdminStatsProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(price);
  };

  const stats = {
    total: properties.length,
    available: properties.filter(p => p.status === 'available').length,
    reserved: properties.filter(p => p.status === 'reserved').length,
    sold: properties.filter(p => p.status === 'sold').length,
    totalValue: properties.reduce((sum, p) => sum + p.price, 0),
    withBoundary: properties.filter(p => p.boundary && p.boundary.length > 0).length
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">Всего объектов</CardDescription>
          <CardTitle className="text-2xl text-primary">{stats.total}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">Доступно</CardDescription>
          <CardTitle className="text-2xl text-green-400">{stats.available}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">Резерв</CardDescription>
          <CardTitle className="text-2xl text-yellow-400">{stats.reserved}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">Продано</CardDescription>
          <CardTitle className="text-2xl text-gray-400">{stats.sold}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">С границами</CardDescription>
          <CardTitle className="text-2xl text-secondary">{stats.withBoundary}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">Общая стоимость</CardDescription>
          <CardTitle className="text-lg text-accent">
            {formatPrice(stats.totalValue).replace(/\s₽/, '')}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
};

export default AdminStats;
