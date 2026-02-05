import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { propertyService, Property } from '@/services/propertyService';

interface VisibilityRule {
  role: string;
  visibleStatuses: string[];
  visibleSegments: string[];
  visiblePropertyIds: number[];
}

const AdminVisibilitySettings = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [rules, setRules] = useState<VisibilityRule[]>([
    {
      role: 'admin',
      visibleStatuses: ['available', 'reserved', 'sold'],
      visibleSegments: ['premium', 'standard', 'economy'],
      visiblePropertyIds: []
    },
    {
      role: 'user1',
      visibleStatuses: ['available'],
      visibleSegments: ['premium', 'standard'],
      visiblePropertyIds: []
    },
    {
      role: 'user2',
      visibleStatuses: ['available', 'reserved'],
      visibleSegments: ['standard', 'economy'],
      visiblePropertyIds: []
    }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const props = await propertyService.getProperties();
      setProperties(props);
      
      // Загружаем сохраненные правила из localStorage
      const savedRules = localStorage.getItem('visibilityRules');
      if (savedRules) {
        setRules(JSON.parse(savedRules));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('visibilityRules', JSON.stringify(rules));
      toast.success('Настройки сохранены');
    } catch (error) {
      console.error('Error saving rules:', error);
      toast.error('Не удалось сохранить настройки');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = (roleIndex: number, status: string) => {
    const newRules = [...rules];
    const statusIndex = newRules[roleIndex].visibleStatuses.indexOf(status);
    
    if (statusIndex > -1) {
      newRules[roleIndex].visibleStatuses.splice(statusIndex, 1);
    } else {
      newRules[roleIndex].visibleStatuses.push(status);
    }
    
    setRules(newRules);
  };

  const toggleSegment = (roleIndex: number, segment: string) => {
    const newRules = [...rules];
    const segmentIndex = newRules[roleIndex].visibleSegments.indexOf(segment);
    
    if (segmentIndex > -1) {
      newRules[roleIndex].visibleSegments.splice(segmentIndex, 1);
    } else {
      newRules[roleIndex].visibleSegments.push(segment);
    }
    
    setRules(newRules);
  };

  const statuses = [
    { value: 'available', label: 'Доступен', color: 'text-green-600' },
    { value: 'reserved', label: 'Зарезервирован', color: 'text-yellow-600' },
    { value: 'sold', label: 'Продан', color: 'text-red-600' }
  ];

  const segments = [
    { value: 'premium', label: 'Премиум', color: 'text-purple-600' },
    { value: 'standard', label: 'Стандарт', color: 'text-blue-600' },
    { value: 'economy', label: 'Эконом', color: 'text-gray-600' }
  ];

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'admin': 'Администратор',
      'user1': 'Пользователь 1',
      'user2': 'Пользователь 2'
    };
    return labels[role] || role;
  };

  const getVisiblePropertiesCount = (rule: VisibilityRule) => {
    return properties.filter(p => 
      rule.visibleStatuses.includes(p.status) &&
      rule.visibleSegments.includes(p.segment)
    ).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <div className="flex items-center justify-center py-12">
          <Icon name="Loader2" className="animate-spin text-primary" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />

      <div className="container mx-auto px-4 lg:px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Настройки видимости участков</h2>
          <p className="text-muted-foreground">
            Управляйте доступом к участкам для разных ролей пользователей
          </p>
        </div>

        <div className="grid gap-6 mb-6">
          {rules.map((rule, roleIndex) => (
            <Card key={rule.role}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="UserCog" className="text-primary" size={24} />
                    {getRoleLabel(rule.role)}
                  </div>
                  <div className="text-sm font-normal text-muted-foreground">
                    Видимых участков: {getVisiblePropertiesCount(rule)} из {properties.length}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Статусы */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Icon name="Tag" size={16} />
                      Доступные статусы
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {statuses.map((status) => (
                        <Button
                          key={status.value}
                          variant={rule.visibleStatuses.includes(status.value) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleStatus(roleIndex, status.value)}
                          className="gap-2"
                        >
                          <Icon 
                            name={rule.visibleStatuses.includes(status.value) ? 'CheckCircle2' : 'Circle'} 
                            size={14} 
                          />
                          <span className={rule.visibleStatuses.includes(status.value) ? '' : status.color}>
                            {status.label}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Сегменты */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Icon name="Layers" size={16} />
                      Доступные сегменты
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {segments.map((segment) => (
                        <Button
                          key={segment.value}
                          variant={rule.visibleSegments.includes(segment.value) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleSegment(roleIndex, segment.value)}
                          className="gap-2"
                        >
                          <Icon 
                            name={rule.visibleSegments.includes(segment.value) ? 'CheckCircle2' : 'Circle'} 
                            size={14} 
                          />
                          <span className={rule.visibleSegments.includes(segment.value) ? '' : segment.color}>
                            {segment.label}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Статистика */}
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">Доступно</div>
                        <div className="text-lg font-semibold text-green-600">
                          {properties.filter(p => 
                            rule.visibleStatuses.includes(p.status) &&
                            rule.visibleSegments.includes(p.segment) &&
                            p.status === 'available'
                          ).length}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Зарезервировано</div>
                        <div className="text-lg font-semibold text-yellow-600">
                          {properties.filter(p => 
                            rule.visibleStatuses.includes(p.status) &&
                            rule.visibleSegments.includes(p.segment) &&
                            p.status === 'reserved'
                          ).length}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Продано</div>
                        <div className="text-lg font-semibold text-red-600">
                          {properties.filter(p => 
                            rule.visibleStatuses.includes(p.status) &&
                            rule.visibleSegments.includes(p.segment) &&
                            p.status === 'sold'
                          ).length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Save" className="mr-2" size={16} />
                Сохранить настройки
              </>
            )}
          </Button>
          <Button variant="outline" onClick={loadData}>
            <Icon name="RotateCcw" className="mr-2" size={16} />
            Сбросить изменения
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminVisibilitySettings;
