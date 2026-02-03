import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import RoleSwitcher from '@/components/admin/RoleSwitcher';
import { UserRole } from '@/types/userRoles';

interface TopNavigationProps {
  mapType: 'scheme' | 'hybrid';
  onMapTypeChange: (type: 'scheme' | 'hybrid') => void;
  currentUserRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onNavigateAdmin: () => void;
  isFilterPanelOpen: boolean;
  onFilterPanelToggle: () => void;
  filterCount: number;
  onAddProperty: () => void;
}

const TopNavigation = ({
  mapType,
  onMapTypeChange,
  currentUserRole,
  onRoleChange,
  onNavigateAdmin,
  isFilterPanelOpen,
  onFilterPanelToggle,
  filterCount,
  onAddProperty
}: TopNavigationProps) => {
  return (
    <div className="h-12 border-b border-border flex items-center justify-between px-3 lg:px-4 bg-card/30 backdrop-blur">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="Map" className="text-primary" size={18} />
          </div>
          <h1 className="text-lg font-bold">LandGis</h1>
        </div>
      </div>

      <div className="flex gap-1.5">
        <RoleSwitcher currentRole={currentUserRole} onRoleChange={onRoleChange} />
        <Button variant="outline" size="sm" className="hidden lg:flex h-8 text-xs px-2.5 gap-1.5" onClick={onNavigateAdmin}>
          <Icon name="Database" size={14} />
          Админка
        </Button>
        <Button 
          variant={isFilterPanelOpen ? "default" : "outline"} 
          size="sm" 
          className="hidden lg:flex h-8 text-xs px-2.5 gap-1.5"
          onClick={onFilterPanelToggle}
        >
          <Icon name="Filter" size={14} />
          Фильтры
          {filterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-background text-[10px] font-semibold">
              {filterCount}
            </span>
          )}
        </Button>
        <Button variant="outline" size="sm" className="hidden lg:flex h-8 text-xs px-2.5 gap-1.5">
          <Icon name="Layers" size={14} />
          Слои
        </Button>
        <Button size="sm" className="bg-primary hover:bg-primary/90 h-8 text-xs px-2.5 gap-1.5" onClick={onAddProperty}>
          <Icon name="Plus" size={14} />
          <span className="hidden md:inline">Добавить объект</span>
        </Button>
      </div>
    </div>
  );
};

export default TopNavigation;