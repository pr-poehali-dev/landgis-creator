import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = location.pathname;

  const tabs = [
    { path: '/admin', icon: 'Database', label: 'База данных' },
    { path: '/admin/map-settings', icon: 'Settings', label: 'Настройки' },
    { path: '/admin/polygon-styles', icon: 'Palette', label: 'Дизайн участков' },
    { path: '/admin/companies', icon: 'Building2', label: 'Компании' },
    { path: '/admin/users', icon: 'Users', label: 'Пользователи' },
    { path: '/admin/filter-settings', icon: 'Filter', label: 'Фильтры' },
  ];

  return (
    <div className="border-b border-border bg-card/30 backdrop-blur">
      <div className="container mx-auto px-4 lg:px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Icon name="Database" className="text-primary" size={42} />
              Администрирование
            </h1>
            <p className="text-sm text-muted-foreground">Управление базой данных объектов</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <Button
              key={tab.path}
              variant={currentTab === tab.path ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate(tab.path)}
              className="gap-2"
            >
              <Icon name={tab.icon as any} size={16} />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminNavigation;