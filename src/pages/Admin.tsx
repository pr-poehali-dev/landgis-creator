import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import AdminStats from '@/components/admin/AdminStats';
import AdminTableHeader from '@/components/admin/AdminTableHeader';
import AdminPropertyTable from '@/components/admin/AdminPropertyTable';
import AdminPropertyDetail from '@/components/admin/AdminPropertyDetail';

const Admin = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

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

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProperties.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProperties.map(p => p.id)));
    }
  };

  const toggleSelectOne = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error('Выберите объекты для удаления');
      return;
    }

    if (!confirm(`Вы уверены, что хотите удалить ${selectedIds.size} объектов?`)) {
      return;
    }

    setIsDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const id of selectedIds) {
        try {
          await propertyService.deleteProperty(id);
          successCount++;
        } catch (error) {
          console.error(`Error deleting property ${id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Удалено объектов: ${successCount}${errorCount > 0 ? `, ошибок: ${errorCount}` : ''}`);
      }
      if (errorCount > 0 && successCount === 0) {
        toast.error(`Не удалось удалить объекты`);
      }

      setSelectedIds(new Set());
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProperties = properties.filter(property => 
    property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.id.toString().includes(searchQuery)
  );

  const showDetails = (property: Property) => {
    setSelectedProperty(property);
    setIsDetailDialogOpen(true);
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
                onClick={() => navigate('/admin/attributes')} 
                variant="outline" 
                size="sm"
              >
                <Icon name="Settings" size={16} className="mr-2" />
                Настройки атрибутов
              </Button>
              <Button 
                onClick={() => setIsUploadDialogOpen(true)} 
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate('/admin/map-settings')}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-2">
                <Icon name="Map" size={32} className="text-primary" />
                <h3 className="font-semibold">Карта</h3>
                <p className="text-xs text-muted-foreground">Настройки отображения</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate('/admin/companies')}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-2">
                <Icon name="Building2" size={32} className="text-primary" />
                <h3 className="font-semibold">Компании</h3>
                <p className="text-xs text-muted-foreground">Организации-собственники</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate('/admin/users')}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-2">
                <Icon name="Users" size={32} className="text-primary" />
                <h3 className="font-semibold">Пользователи</h3>
                <p className="text-xs text-muted-foreground">Управление доступом</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate('/admin/filter-settings')}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-2">
                <Icon name="Filter" size={32} className="text-primary" />
                <h3 className="font-semibold">Фильтры</h3>
                <p className="text-xs text-muted-foreground">Настройка фильтрации</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <AdminStats properties={properties} />

        <Card>
          <div className="p-6">
            <AdminTableHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedIds={selectedIds}
              onDeleteSelected={handleDeleteSelected}
              onClearSelection={() => setSelectedIds(new Set())}
              isDeleting={isDeleting}
            />
          </div>
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
              <AdminPropertyTable
                properties={filteredProperties}
                selectedIds={selectedIds}
                onToggleSelectAll={toggleSelectAll}
                onToggleSelectOne={toggleSelectOne}
                onShowDetails={showDetails}
                onDelete={handleDelete}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <AdminPropertyDetail
        property={selectedProperty}
        isOpen={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
      />

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto" aria-describedby="upload-dialog-description">
          <DialogHeader className="mb-4">
            <DialogTitle>Импорт объектов из GeoJSON</DialogTitle>
            <DialogDescription id="upload-dialog-description">
              Загрузите GeoJSON файл с объектами недвижимости. Система автоматически извлечет границы и атрибуты.
            </DialogDescription>
          </DialogHeader>
          <GeoJsonUploader />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;