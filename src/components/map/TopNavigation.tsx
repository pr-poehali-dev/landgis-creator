import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import RoleSwitcher from '@/components/admin/RoleSwitcher';
import CompanySwitcher from '@/components/admin/CompanySwitcher';
import { UserRole } from '@/types/userRoles';
import { authService } from '@/services/authService';
import { useNavigate } from 'react-router-dom';

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
  onOpenPropertiesList?: () => void;
  appSettings?: { logo?: string; title?: string; subtitle?: string };
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
  onAddProperty,
  onOpenPropertiesList,
  appSettings
}: TopNavigationProps) => {
  const navigate = useNavigate();
  const user = authService.getUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const rawSettings = localStorage.getItem('app_design_settings');
  const logoExists = !!(appSettings?.logo && appSettings.logo.trim() !== '');
  
  const debugInfo = `LS:${rawSettings ? 'Y' : 'N'} | AS:${appSettings ? 'Y' : 'N'} | L:${appSettings?.logo?.length || 0}`;
  
  return (
    <div className="h-12 border-b border-border flex items-center px-3 lg:px-4 bg-card/30 backdrop-blur w-full relative">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 lg:hidden">
          {logoExists ? (
            <img 
              src={appSettings.logo} 
              alt="Logo" 
              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon name="Map" className="text-primary" size={18} />
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-lg font-bold truncate leading-tight">{appSettings?.title || 'LandGis'}</h1>
            <span className="text-[9px] text-red-500 font-mono leading-none">{debugInfo}</span>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-2 ml-4">
          <CompanySwitcher />
        </div>
        {user?.role === 'admin' && (
          <RoleSwitcher currentRole={currentUserRole} onRoleChange={onRoleChange} />
        )}
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {user?.role === 'admin' && (
          <Button variant="outline" size="sm" className="hidden lg:flex h-8 text-xs px-2.5 gap-1.5" onClick={onNavigateAdmin}>
            <Icon name="Database" size={14} />
            Админка
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {onOpenPropertiesList && (
          <Button 
            variant="outline" 
            size="sm" 
            className="lg:hidden h-8 text-xs px-2.5 gap-1.5"
            onClick={onOpenPropertiesList}
          >
            <Icon name="List" size={14} />
          </Button>
        )}
        <Button size="sm" className="bg-primary hover:bg-primary/90 h-8 text-xs px-2.5 gap-1.5" onClick={onAddProperty}>
          <Icon name="Plus" size={14} />
          <span className="hidden md:inline">Добавить объект</span>
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs px-2.5 gap-1.5" onClick={handleLogout}>
          <Icon name="LogOut" size={14} />
          <span className="hidden lg:inline">Выйти</span>
        </Button>
      </div>
    </div>
  );
};

export default TopNavigation;