import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import { propertyService, Property } from '@/services/propertyService';
import GeoJsonUploader from '@/components/GeoJsonUploader';

const Admin = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  useEffect(() => {
    loadProperties();
    const unsubscribe = propertyService.subscribe((updatedProperties) => {
      setProperties(updatedProperties);
    });
    return unsubscribe;
  }, []);

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      const data = await propertyService.getProperties();
      setProperties(data);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast.error('Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот объект?')) {
      return;
    }

    try {
      await propertyService.deleteProperty(id);
      toast.success('Объект удалён');
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Не удалось удалить объект');
    }
  };

  const filteredProperties = properties.filter(property => 
    property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.id.toString().includes(searchQuery)
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      land: 'Земля',
      commercial: 'Коммерция',
      residential: 'Жильё'
    };
    return labels[type as keyof typeof labels];
  };

  const getStatusColor = (status: string) => {
    const colors = {
      available: 'bg-green-500/20 text-green-400 border-green-500/30',
      reserved: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      sold: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[status as keyof typeof colors];
  };

  const getSegmentColor = (segment: string) => {
    const colors = {
      premium: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      standard: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      economy: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    return colors[segment as keyof typeof colors];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const showDetails = (property: Property) => {
    setSelectedProperty(property);
    setIsDetailDialogOpen(true);
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
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/30 backdrop-blur">
        <div className="container mx-auto px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
              >
                <Icon name="ArrowLeft" size={20} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Icon name="Database" className="text-primary" size={28} />
                  Администрирование
                </h1>
                <p className="text-sm text-muted-foreground">Управление базой данных объектов</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  console.log('Открытие диалога загрузки GeoJSON');
                  setIsUploadDialogOpen(true);
                }} 
                variant="default" 
                size="sm"
              >
                <Icon name="Upload" size={16} className="mr-2" />
                Загрузить GeoJSON
              </Button>
              <Button onClick={loadProperties} variant="outline" size="sm">
                <Icon name="RefreshCw" size={16} className="mr-2" />
                Обновить
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-6 py-6">
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

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <CardTitle>База данных объектов</CardTitle>
                <CardDescription>Полный список объектов недвижимости</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Поиск по ID, названию, адресу..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Icon name="Loader2" className="animate-spin text-primary" size={32} />
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Database" className="mx-auto mb-4 opacity-20" size={48} />
                <p>Объекты не найдены</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">ID</TableHead>
                      <TableHead>Название</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Адрес</TableHead>
                      <TableHead className="text-right">Площадь</TableHead>
                      <TableHead className="text-right">Цена</TableHead>
                      <TableHead>Сегмент</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Границы</TableHead>
                      <TableHead>Создан</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.map((property) => (
                      <TableRow key={property.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-xs">{property.id}</TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {property.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {getTypeLabel(property.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                          {property.location}
                        </TableCell>
                        <TableCell className="text-right">{property.area} м²</TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatPrice(property.price)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${getSegmentColor(property.segment)}`} variant="outline">
                            {property.segment === 'premium' ? 'Премиум' :
                             property.segment === 'standard' ? 'Стандарт' : 'Эконом'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${getStatusColor(property.status)}`} variant="outline">
                            {property.status === 'available' ? 'Доступен' :
                             property.status === 'reserved' ? 'Резерв' : 'Продан'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {property.boundary && property.boundary.length > 0 ? (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
                              <Icon name="Check" size={12} className="mr-1" />
                              {property.boundary.length} точек
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(property.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => showDetails(property)}
                            >
                              <Icon name="Eye" size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(property.id)}
                            >
                              <Icon name="Trash2" size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="FileText" className="text-primary" size={20} />
              Детали объекта #{selectedProperty?.id}
            </DialogTitle>
            <DialogDescription>Полная информация об объекте недвижимости</DialogDescription>
          </DialogHeader>
          
          {selectedProperty && (
            <div className="space-y-6 py-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{selectedProperty.title}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Icon name="MapPin" size={14} />
                  {selectedProperty.location}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Тип</p>
                  <Badge variant="secondary">{getTypeLabel(selectedProperty.type)}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Сегмент</p>
                  <Badge className={getSegmentColor(selectedProperty.segment)} variant="outline">
                    {selectedProperty.segment === 'premium' ? 'Премиум' :
                     selectedProperty.segment === 'standard' ? 'Стандарт' : 'Эконом'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Площадь</p>
                  <p className="text-lg font-semibold">{selectedProperty.area} м²</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Цена</p>
                  <p className="text-lg font-bold text-primary">{formatPrice(selectedProperty.price)}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Статус</p>
                <Badge className={getStatusColor(selectedProperty.status)} variant="outline">
                  {selectedProperty.status === 'available' ? 'Доступен' :
                   selectedProperty.status === 'reserved' ? 'Резерв' : 'Продан'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Широта</p>
                  <p className="text-sm font-mono">{selectedProperty.coordinates?.[0]}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Долгота</p>
                  <p className="text-sm font-mono">{selectedProperty.coordinates?.[1]}</p>
                </div>
              </div>

              {selectedProperty.boundary && selectedProperty.boundary.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Границы участка</p>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-sm flex items-center gap-2">
                      <Icon name="MapPin" size={14} className="text-green-400" />
                      Загружено {selectedProperty.boundary.length} точек границы
                    </p>
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        Показать координаты
                      </summary>
                      <div className="mt-2 max-h-40 overflow-y-auto text-xs font-mono bg-background rounded p-2">
                        {selectedProperty.boundary.map((coord, i) => (
                          <div key={i}>
                            {i + 1}. [{coord[0].toFixed(6)}, {coord[1].toFixed(6)}]
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                </div>
              )}

              <div className="space-y-1 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">Дата создания</p>
                <p className="text-sm">{formatDate(selectedProperty.created_at)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto" aria-describedby="upload-dialog-description">
          <DialogHeader className="mb-4">
            <DialogTitle>Импорт объектов из GeoJSON</DialogTitle>
            <DialogDescription id="upload-dialog-description">
              Загрузите GeoJSON файл с объектами недвижимости. Система автоматически извлечет границы и атрибуты.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-red-500 text-white">
            ТЕСТ: Этот блок должен быть виден
          </div>
          <GeoJsonUploader />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;