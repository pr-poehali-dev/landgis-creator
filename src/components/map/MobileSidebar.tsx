import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { Property } from '@/services/propertyService';
import { AppSettings } from '@/hooks/useAppSettings';

interface MobileSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  appSettings: AppSettings;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filteredProperties: Property[];
  selectedProperty: Property | null;
  onPropertySelect: (property: Property, closePanel: boolean) => void;
  onPropertyHover: (id: number | null) => void;
  properties: Property[];
  formatPrice: (price: number) => string;
  onOpenDataTable?: () => void;
}

const MobileSidebar = ({
  isOpen,
  onOpenChange,
  appSettings,
  searchQuery,
  onSearchChange,
  filteredProperties,
  selectedProperty,
  onPropertySelect,
  onPropertyHover,
  properties,
  formatPrice,
  onOpenDataTable
}: MobileSidebarProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[85vw] sm:w-96 p-0">
        <div className="flex flex-col h-full bg-card/50 backdrop-blur">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-center mb-6">
              {appSettings.logo ? (
                <img src={appSettings.logo} alt="Logo" className="h-12 max-w-[240px] object-contain" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon name="Map" className="text-primary" size={28} />
                </div>
              )}
            </div>

            <div className="relative">
              <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Поиск объектов..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus={false}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredProperties.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Icon name="SearchX" size={32} className="mx-auto mb-2 opacity-50" />
                Участки не найдены
              </div>
            ) : (
              filteredProperties.map(property => (
                <div
                  key={property.id}
                  className={`cursor-pointer transition-all hover:bg-accent p-2 rounded-lg border ${
                    selectedProperty?.id === property.id ? 'bg-accent border-primary' : 'border-transparent'
                  }`}
                  onClick={() => onPropertySelect(property, true)}
                  onMouseEnter={() => onPropertyHover(property.id)}
                  onMouseLeave={() => onPropertyHover(null)}
                >
                  <div className="text-sm font-medium mb-1">{property.title}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Icon name="MapPin" size={10} />
                    {property.attributes?.region && !property.attributes.region.startsWith('lyr_')
                      ? property.attributes.region
                      : 'Регион не указан'}
                  </div>
                </div>
              ))
            )}
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