import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Property } from '@/services/propertyService';
import { AppSettings } from '@/hooks/useAppSettings';

interface SidebarPanelProps {
  appSettings: AppSettings;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  filterSegment: string;
  onFilterSegmentChange: (value: string) => void;
  filteredProperties: Property[];
  selectedProperty: Property | null;
  onPropertySelect: (property: Property) => void;
  onPropertyHover: (id: number | null) => void;
  properties: Property[];
  formatPrice: (price: number) => string;
  onOpenDataTable?: () => void;
  totalFilteredCount?: number;
}

const SidebarPanel = ({
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
  formatPrice,
  onOpenDataTable,
  totalFilteredCount
}: SidebarPanelProps) => {
  return (
    <div className="hidden lg:flex w-80 border-r border-border flex-col bg-card/50 backdrop-blur">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          {appSettings.logo ? (
            <img src={appSettings.logo} alt="Logo" className="w-16 h-16 rounded-lg object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="Map" className="text-primary" size={36} />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{appSettings.title}</h1>
            <p className="text-[10px] text-muted-foreground">{appSettings.subtitle}</p>
          </div>
        </div>

        <div className="relative mb-3">
          <Icon name="Search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <Input
            placeholder="Поиск объектов..."
            className="pl-8 h-9 text-sm"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <Button 
          variant="outline" 
          className="w-full mb-3 h-9 text-sm gap-2"
          onClick={onOpenDataTable}
        >
          <Icon name="Table" size={16} />
          Таблица данных
        </Button>

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
              <SelectItem value="МПТ">МПТ</SelectItem>
              <SelectItem value="Жилищное строительство">Жилищное строительство</SelectItem>
              <SelectItem value="Коммерческая недвижимость">Коммерческая недвижимость</SelectItem>
              <SelectItem value="Инфраструктура">Инфраструктура</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {(totalFilteredCount !== undefined && totalFilteredCount > 0) && (
        <div className="px-4 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Icon name="Eye" size={14} />
              <span>Видимых на карте</span>
            </div>
            <div className="font-semibold">
              <span className="text-primary">{filteredProperties.length}</span>
              <span className="text-muted-foreground"> / {totalFilteredCount}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredProperties.map(property => (
          <div
            key={property.id}
            className={`cursor-pointer transition-all hover:bg-accent p-3 rounded-lg ${
              selectedProperty?.id === property.id ? 'bg-accent' : ''
            }`}
            onClick={() => onPropertySelect(property)}
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
  );
};

export default SidebarPanel;