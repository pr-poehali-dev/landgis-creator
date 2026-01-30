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
import { useNavigate, useLocation } from 'react-router-dom';
import { propertyService, Property } from '@/services/propertyService';
import GeoJsonUploader from '@/components/GeoJsonUploader';
import AdminStats from '@/components/admin/AdminStats';
import AdminTableHeader from '@/components/admin/AdminTableHeader';
import AdminPropertyTable from '@/components/admin/AdminPropertyTable';
import AdminPropertyDetail from '@/components/admin/AdminPropertyDetail';
import AdminNavigation from '@/components/admin/AdminNavigation';

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
      <AdminNavigation />

      <div className="container mx-auto px-4 lg:px-6 py-6">
        <AdminStats properties={properties} />

        <div className="flex gap-2 mb-4">
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