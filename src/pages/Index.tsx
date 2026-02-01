import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import YandexMap from '@/components/YandexMap';
import AddPropertyDialog, { PropertyFormData } from '@/components/AddPropertyDialog';
import { propertyService, Property } from '@/services/propertyService';
import RoleSwitcher from '@/components/admin/RoleSwitcher';
import { UserRole } from '@/types/userRoles';

const Index = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [mapType, setMapType] = useState<'scheme' | 'hybrid'>('scheme');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSegment, setFilterSegment] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('admin');

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
      toast.error('Не удалось загрузить объекты');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProperty = async (formData: PropertyFormData) => {
    try {
      await propertyService.createProperty(formData);
      toast.success('Объект успешно добавлен!');
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error('Не удалось добавить объект');
      throw error;
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || property.type === filterType;
    
    let matchesSegment = filterSegment === 'all';
    if (!matchesSegment) {
      const segmentValue = property.attributes?.segment;
      if (Array.isArray(segmentValue)) {
        matchesSegment = segmentValue.includes(filterSegment);
      } else if (typeof segmentValue === 'string') {
        matchesSegment = segmentValue === filterSegment || 
                        segmentValue.split(',').map(s => s.trim()).includes(filterSegment);
      } else {
        matchesSegment = property.segment === filterSegment;
      }
    }
    
    return matchesSearch && matchesType && matchesSegment;
  });

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

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="hidden lg:flex w-80 border-r border-border flex-col bg-card/50 backdrop-blur">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="Map" className="text-primary" size={18} />
            </div>
            <div>
              <h1 className="text-xl font-bold">LandGis</h1>
              <p className="text-[10px] text-muted-foreground">Картографическая CRM</p>
            </div>
          </div>

          <div className="relative mb-3">
            <Icon name="Search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <Input
              placeholder="Поиск объектов..."
              className="pl-8 h-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="land">Земля</SelectItem>
                <SelectItem value="commercial">Коммерция</SelectItem>
                <SelectItem value="residential">Жильё</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSegment} onValueChange={setFilterSegment}>
              <SelectTrigger>
                <SelectValue placeholder="Сегмент" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все сегменты</SelectItem>
                <SelectItem value="МПТ">МПТ</SelectItem>
                <SelectItem value="Жилищное строительство">Жилищное строительство</SelectItem>
                <SelectItem value="Коммерческая недвижимость">Коммерческая недвижимость</SelectItem>
                <SelectItem value="Инфраструктура">Инфраструктура</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredProperties.map(property => (
            <Card
              key={property.id}
              className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
                selectedProperty?.id === property.id ? 'ring-2 ring-primary shadow-xl' : ''
              }`}
              onClick={() => setSelectedProperty(property)}
            >
              <CardHeader className="pb-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm">{property.title}</CardTitle>
                  <Badge className={`text-[10px] px-2 py-0 ${getStatusColor(property.status)}`} variant="outline">
                    {property.status === 'available' ? 'Доступен' : 
                     property.status === 'reserved' ? 'Резерв' : 'Продан'}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1 text-[11px]">
                  <Icon name="MapPin" size={11} />
                  {property.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Площадь</span>
                    <span className="text-sm font-medium">{property.area} м²</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Цена</span>
                    <span className="text-sm font-bold text-primary">{formatPrice(property.price)}</span>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <Badge variant="secondary" className="text-[10px] px-2 py-0">
                      {getTypeLabel(property.type)}
                    </Badge>
                    <Badge className={`text-[10px] px-2 py-0 ${getSegmentColor(property.segment)}`} variant="outline">
                      {property.segment === 'premium' ? 'Премиум' :
                       property.segment === 'standard' ? 'Стандарт' : 'Эконом'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="p-3 border-t border-border bg-card/80 backdrop-blur">
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div>
              <div className="font-bold text-base text-primary">{properties.length}</div>
              <div className="text-muted-foreground">Объектов</div>
            </div>
            <div>
              <div className="font-bold text-base text-green-400">
                {properties.filter(p => p.status === 'available').length}
              </div>
              <div className="text-muted-foreground">Доступно</div>
            </div>
            <div>
              <div className="font-bold text-base text-secondary">
                {formatPrice(properties.reduce((sum, p) => sum + p.price, 0) / properties.length).replace(/\s₽/, '')}
              </div>
              <div className="text-muted-foreground">Средняя цена</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-12 border-b border-border flex items-center justify-between px-3 lg:px-4 bg-card/30 backdrop-blur">
          <div className="flex items-center gap-2">
            <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden h-8 w-8">
                  <Icon name="Menu" size={16} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:w-96 p-0">
                <div className="flex flex-col h-full bg-card/50 backdrop-blur">
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon name="Map" className="text-primary" size={24} />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold">LandGis</h1>
                        <p className="text-xs text-muted-foreground">Картографическая CRM</p>
                      </div>
                    </div>

                    <div className="relative mb-4">
                      <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        placeholder="Поиск объектов..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Тип" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все типы</SelectItem>
                          <SelectItem value="land">Земля</SelectItem>
                          <SelectItem value="commercial">Коммерция</SelectItem>
                          <SelectItem value="residential">Жильё</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterSegment} onValueChange={setFilterSegment}>
                        <SelectTrigger>
                          <SelectValue placeholder="Сегмент" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все сегменты</SelectItem>
                          <SelectItem value="premium">Премиум</SelectItem>
                          <SelectItem value="standard">Стандарт</SelectItem>
                          <SelectItem value="economy">Эконом</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredProperties.map(property => (
                      <Card
                        key={property.id}
                        className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
                          selectedProperty?.id === property.id ? 'ring-2 ring-primary shadow-xl' : ''
                        }`}
                        onClick={() => {
                          setSelectedProperty(property);
                          setIsMobileSidebarOpen(false);
                        }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base">{property.title}</CardTitle>
                            <Badge className={getStatusColor(property.status)} variant="outline">
                              {property.status === 'available' ? 'Доступен' : 
                               property.status === 'reserved' ? 'Резерв' : 'Продан'}
                            </Badge>
                          </div>
                          <CardDescription className="flex items-center gap-1 text-xs">
                            <Icon name="MapPin" size={12} />
                            {property.location}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Площадь</span>
                              <span className="font-medium">{property.area} м²</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Цена</span>
                              <span className="font-bold text-primary">{formatPrice(property.price)}</span>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Badge variant="secondary" className="text-xs">
                                {getTypeLabel(property.type)}
                              </Badge>
                              <Badge className={`text-xs ${getSegmentColor(property.segment)}`} variant="outline">
                                {property.segment === 'premium' ? 'Премиум' :
                                 property.segment === 'standard' ? 'Стандарт' : 'Эконом'}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="p-4 border-t border-border bg-card/80 backdrop-blur">
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <div className="font-bold text-lg text-primary">{properties.length}</div>
                        <div className="text-muted-foreground">Объектов</div>
                      </div>
                      <div>
                        <div className="font-bold text-lg text-green-400">
                          {properties.filter(p => p.status === 'available').length}
                        </div>
                        <div className="text-muted-foreground">Доступно</div>
                      </div>
                      <div>
                        <div className="font-bold text-lg text-secondary">
                          {formatPrice(properties.reduce((sum, p) => sum + p.price, 0) / properties.length).replace(/\s₽/, '')}
                        </div>
                        <div className="text-muted-foreground">Средняя</div>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name="Map" className="text-primary" size={18} />
              </div>
              <h1 className="text-lg font-bold">LandGis</h1>
            </div>
          </div>

          <Tabs value={mapType} onValueChange={(v) => setMapType(v as 'scheme' | 'hybrid')} className="hidden sm:block">
            <TabsList className="h-8">
              <TabsTrigger value="scheme" className="gap-1.5 text-xs px-3">
                <Icon name="Map" size={14} />
                <span className="hidden md:inline">Схема</span>
              </TabsTrigger>
              <TabsTrigger value="hybrid" className="gap-1.5 text-xs px-3">
                <Icon name="Satellite" size={14} />
                <span className="hidden md:inline">Гибрид</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-1.5">
            <RoleSwitcher currentRole={currentUserRole} onRoleChange={setCurrentUserRole} />
            <Button variant="outline" size="sm" className="hidden lg:flex h-8 text-xs px-2.5 gap-1.5" onClick={() => navigate('/admin')}>
              <Icon name="Database" size={14} />
              Админка
            </Button>
            <Button variant="outline" size="sm" className="hidden lg:flex h-8 text-xs px-2.5 gap-1.5">
              <Icon name="Filter" size={14} />
              Фильтры
            </Button>
            <Button variant="outline" size="sm" className="hidden lg:flex h-8 text-xs px-2.5 gap-1.5">
              <Icon name="Layers" size={14} />
              Слои
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 h-8 text-xs px-2.5 gap-1.5" onClick={() => setIsAddDialogOpen(true)}>
              <Icon name="Plus" size={14} />
              <span className="hidden md:inline">Добавить объект</span>
            </Button>
          </div>
        </div>

        <div className="flex-1 relative bg-muted/20">
          <YandexMap
            properties={filteredProperties}
            selectedProperty={selectedProperty}
            onSelectProperty={setSelectedProperty}
            mapType={mapType}
            userRole={currentUserRole}
          />
        </div>

        <div className="hidden sm:flex h-14 border-t border-border bg-card/30 backdrop-blur px-3 lg:px-4 items-center justify-between">
          <div className="flex gap-2 lg:gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              <span className="text-muted-foreground"><span className="hidden md:inline">Доступно: </span><span className="font-semibold text-foreground">{properties.filter(p => p.status === 'available').length}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <span className="text-muted-foreground"><span className="hidden md:inline">Резерв: </span><span className="font-semibold text-foreground">{properties.filter(p => p.status === 'reserved').length}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-500"></div>
              <span className="text-muted-foreground"><span className="hidden md:inline">Продано: </span><span className="font-semibold text-foreground">{properties.filter(p => p.status === 'sold').length}</span></span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Icon name="Sparkles" size={12} className="text-secondary" />
            <span>AI-кластеризация активна</span>
          </div>
        </div>
      </div>

      <AddPropertyDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddProperty}
      />
    </div>
  );
};

export default Index;