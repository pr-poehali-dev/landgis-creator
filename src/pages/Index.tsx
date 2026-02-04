import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import YandexMap from '@/components/YandexMap';
import AddPropertyDialog, { PropertyFormData } from '@/components/AddPropertyDialog';
import { propertyService, Property } from '@/services/propertyService';
import { UserRole } from '@/types/userRoles';
import AdvancedFilterPanel from '@/components/AdvancedFilterPanel';
import { useAppSettings } from '@/hooks/useAppSettings';
import SidebarPanel from '@/components/map/SidebarPanel';
import MobileSidebar from '@/components/map/MobileSidebar';
import TopNavigation from '@/components/map/TopNavigation';
import StatisticsBar from '@/components/map/StatisticsBar';
import DataTableDialog from '@/components/map/DataTableDialog';

const Index = () => {
  const navigate = useNavigate();
  const { settings: appSettings, isLoading: isSettingsLoading } = useAppSettings();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [mapType, setMapType] = useState<'scheme' | 'hybrid'>('scheme');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSegment, setFilterSegment] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('admin');
  const [showAttributesPanel, setShowAttributesPanel] = useState(false);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<number | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string[]>>({});
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDataTableOpen, setIsDataTableOpen] = useState(false);
  const [visiblePropertyIds, setVisiblePropertyIds] = useState<number[]>([]);

  useEffect(() => {
    loadProperties();
    const unsubscribe = propertyService.subscribe((updatedProperties) => {
      setProperties(updatedProperties);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isSettingsLoading && appSettings.bgColor) {
      document.documentElement.style.setProperty('--custom-bg', appSettings.bgColor);
    }
    if (!isSettingsLoading && appSettings.buttonColor) {
      document.documentElement.style.setProperty('--custom-button', appSettings.buttonColor);
    }
  }, [appSettings, isSettingsLoading]);

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      const data = await propertyService.getProperties();
      setProperties(data);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast.error('Не удалось загрузить объекты');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProperty = async (formData: PropertyFormData) => {
    try {
      const newProperty = await propertyService.createProperty(formData);
      toast.success('Объект успешно добавлен!');
      
      // Зум к добавленному объекту
      setTimeout(() => {
        if (newProperty) {
          setSelectedProperty(newProperty);
          setShowAttributesPanel(true);
        }
      }, 500);
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error('Не удалось добавить объект');
      throw error;
    }
  };

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           property.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || property.type === filterType;
      
      let matchesSegment = filterSegment === 'all';
      if (!matchesSegment) {
        const segmentValue = property.attributes?.segment;
        if (Array.isArray(segmentValue)) {
          matchesSegment = segmentValue.includes(filterSegment);
        } else if (typeof segmentValue === 'string') {
          try {
            const parsed = JSON.parse(segmentValue);
            if (Array.isArray(parsed)) {
              matchesSegment = parsed.includes(filterSegment);
            } else {
              matchesSegment = segmentValue === filterSegment;
            }
          } catch {
            matchesSegment = segmentValue === filterSegment || 
                            segmentValue.split(',').map(s => s.trim()).includes(filterSegment);
          }
        } else {
          matchesSegment = property.segment === filterSegment;
        }
      }

      const matchesAdvanced = Object.entries(advancedFilters).every(([key, values]) => {
        if (!values || values.length === 0) return true;
        
        const saved = localStorage.getItem('filterSettings');
        let attributePath = '';
        
        if (saved) {
          try {
            const settings = JSON.parse(saved);
            const setting = settings.find((s: any) => s.id === key);
            if (setting) {
              attributePath = setting.attributePath;
            }
          } catch (error) {
            console.error('Error loading filter settings:', error);
          }
        }

        if (key === 'region' || attributePath === 'attributes.region') {
          const region = property.attributes?.region;
          if (!region || region.startsWith('lyr_')) return false;
          return values.includes(region);
        }
        if (key === 'segment' || attributePath === 'attributes.segment') {
          const seg = property.attributes?.segment;
          if (Array.isArray(seg)) return seg.some(s => values.includes(s));
          if (typeof seg === 'string') {
            try {
              const parsed = JSON.parse(seg);
              if (Array.isArray(parsed)) return parsed.some(s => values.includes(s));
            } catch {
              // fallback to comma-separated
            }
            return seg.split(',').some(s => values.includes(s.trim()));
          }
          return values.includes(property.segment);
        }
        if (key === 'status' || attributePath === 'status') {
          return values.includes(property.status);
        }
        if (key === 'type' || attributePath === 'type') {
          return values.includes(property.type);
        }

        if (attributePath) {
          const getValue = (obj: any, path: string): any => {
            return path.split('.').reduce((current, key) => current?.[key], obj);
          };
          const propValue = getValue(property, attributePath);
          if (propValue && typeof propValue === 'string') {
            return values.includes(propValue);
          }
        }

        return true;
      });
      
      // Фильтр по видимым участкам на карте (только если есть visiblePropertyIds)
      const matchesVisible = visiblePropertyIds.length === 0 || visiblePropertyIds.includes(property.id);
      
      return matchesSearch && matchesType && matchesSegment && matchesAdvanced && matchesVisible;
    }).sort((a, b) => a.title.localeCompare(b.title, 'ru', { numeric: true, sensitivity: 'base' }));
  }, [properties, searchQuery, filterType, filterSegment, advancedFilters, visiblePropertyIds]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    setShowAttributesPanel(true);
  };

  const handleMobilePropertySelect = (property: Property, closePanel: boolean) => {
    setSelectedProperty(property);
    setShowAttributesPanel(true);
    if (closePanel) {
      setIsMobileSidebarOpen(false);
    }
  };

  const handlePropertyHover = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (id: number | null) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setHoveredPropertyId(id), 50);
    };
  }, []);

  const filterCount = Object.values(advancedFilters).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SidebarPanel
        appSettings={appSettings}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        filterSegment={filterSegment}
        onFilterSegmentChange={setFilterSegment}
        filteredProperties={filteredProperties}
        selectedProperty={selectedProperty}
        onPropertySelect={handlePropertySelect}
        onPropertyHover={handlePropertyHover}
        properties={properties}
        formatPrice={formatPrice}
        onOpenDataTable={() => setIsDataTableOpen(true)}
      />

      <div className="flex-1 flex flex-col">
        <TopNavigation
          mapType={mapType}
          onMapTypeChange={setMapType}
          currentUserRole={currentUserRole}
          onRoleChange={setCurrentUserRole}
          onNavigateAdmin={() => navigate('/admin')}
          isFilterPanelOpen={isFilterPanelOpen}
          onFilterPanelToggle={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
          filterCount={filterCount}
          onAddProperty={() => setIsAddDialogOpen(true)}
        />

        <div className="flex-1 relative bg-muted/20">
          <AdvancedFilterPanel
            isOpen={isFilterPanelOpen}
            onToggle={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            properties={properties}
            mapType={mapType}
            onMapTypeChange={setMapType}
            onLayersClick={() => toast.info('Функция "Слои" в разработке')}
          />
          <YandexMap
            properties={filteredProperties}
            selectedProperty={selectedProperty}
            onSelectProperty={setSelectedProperty}
            mapType={mapType}
            userRole={currentUserRole}
            showAttributesPanel={showAttributesPanel}
            onAttributesPanelChange={setShowAttributesPanel}
            hoveredPropertyId={hoveredPropertyId}
            logoUrl={appSettings.logo}
            companyName={appSettings.title}
            onVisiblePropertiesChange={setVisiblePropertyIds}
          />
        </div>

        <StatisticsBar properties={properties} />
      </div>

      <AddPropertyDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddProperty}
      />

      <DataTableDialog
        open={isDataTableOpen}
        onOpenChange={setIsDataTableOpen}
        properties={filteredProperties}
      />
    </div>
  );
};

export default Index;