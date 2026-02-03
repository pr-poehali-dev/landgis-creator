import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Property } from '@/services/propertyService';
import { AppSettings } from '@/hooks/useAppSettings';

interface MobileSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  appSettings: AppSettings;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  filterSegment: string;
  onFilterSegmentChange: (value: string) => void;
  filteredProperties: Property[];
  selectedProperty: Property | null;
  onPropertySelect: (property: Property, closePanel: boolean) => void;
  onPropertyHover: (id: number | null) => void;
  properties: Property[];
  formatPrice: (price: number) => string;
}

const MobileSidebar = ({
  isOpen,
  onOpenChange,
  appSettings,
  searchQuery,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterSegment,
  onFilterSegmentChange,
  filteredProperties,
  selectedProperty,
  onPropertySelect,
  onPropertyHover,
  properties,
  formatPrice
}: MobileSidebarProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden h-8 w-8">
          <Icon name="Menu" size={16} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] sm:w-96 p-0">
        <div className="flex flex-col h-full bg-card/50 backdrop-blur">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3 mb-6">
              {appSettings.logo ? (
                <img src={appSettings.logo} alt="Logo" className="w-20 h-20 rounded-lg object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon name="Map" className="text-primary" size={48} />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{appSettings.title}</h1>
                <p className="text-xs text-muted-foreground">{appSettings.subtitle}</p>
              </div>
            </div>

            <div className="relative mb-4">
              <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Поиск объектов..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Select value={filterType} onValueChange={onFilterTypeChange}>
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

              <Select value={filterSegment} onValueChange={onFilterSegmentChange}>
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

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredProperties.map(property => (
              <div
                key={property.id}
                className={`cursor-pointer transition-all hover:bg-accent p-3 rounded-lg ${
                  selectedProperty?.id === property.id ? 'bg-accent' : ''
                }`}
                onClick={() => onPropertySelect(property, true)}
                onMouseEnter={() => onPropertyHover(property.id)}
                onMouseLeave={() => onPropertyHover(null)}
              >
                <div className="text-sm font-medium mb-1">{property.title}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon name="MapPin" size={12} />
                  {property.attributes?.region && !property.attributes.region.startsWith('lyr_')
                    ? property.attributes.region
                    : 'Регион не указан'}
                </div>
              </div>
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
  );
};

export default MobileSidebar;