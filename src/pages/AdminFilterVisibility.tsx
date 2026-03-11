import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { USER_ROLES, UserRole } from '@/types/userRoles';
import { FilterVisibilityRule, filterVisibilityService } from '@/services/filterVisibilityService';
import { companyService, Company } from '@/services/companyService';

interface FilterColumnInfo {
  id: string;
  label: string;
  enabled: boolean;
}

const AdminFilterVisibility = () => {
  const [filterColumns, setFilterColumns] = useState<FilterColumnInfo[]>([]);
  const [rules, setRules] = useState<FilterVisibilityRule[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('roles');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [config, companiesList] = await Promise.all([
        filterVisibilityService.loadConfig(),
        companyService.getCompanies().catch(() => [])
      ]);

      setCompanies(companiesList);

      const saved = localStorage.getItem('filterSettings');
      let columns: FilterColumnInfo[] = [];
      if (saved) {
        const settings = JSON.parse(saved);
        columns = settings.map((s: { id: string; label: string; enabled: boolean }) => ({
          id: s.id,
          label: s.label,
          enabled: s.enabled
        }));
      } else {
        columns = [
          { id: 'region', label: 'Регион', enabled: true },
          { id: 'segment', label: 'Сегмент', enabled: true },
          { id: 'status', label: 'Статус', enabled: true },
          { id: 'type', label: 'Тип', enabled: true }
        ];
      }

      setFilterColumns(columns.filter(c => c.enabled));

      if (config.rules.length > 0) {
        setRules(config.rules);
      } else {
        setRules(columns.filter(c => c.enabled).map(col => ({
          filterId: col.id,
          hiddenForRoles: [],
          hiddenForCompanies: []
        })));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
    }
  };

  const getOrCreateRule = (filterId: string): FilterVisibilityRule => {
    const existing = rules.find(r => r.filterId === filterId);
    if (existing) return existing;
    return { filterId, hiddenForRoles: [], hiddenForCompanies: [] };
  };

  const updateRule = (filterId: string, updater: (rule: FilterVisibilityRule) => FilterVisibilityRule) => {
    setRules(prev => {
      const idx = prev.findIndex(r => r.filterId === filterId);
      if (idx === -1) {
        const newRule = updater({ filterId, hiddenForRoles: [], hiddenForCompanies: [] });
        return [...prev, newRule];
      }
      const updated = [...prev];
      updated[idx] = updater({ ...updated[idx] });
      return updated;
    });
  };

  const toggleRoleForFilter = (filterId: string, role: UserRole) => {
    updateRule(filterId, rule => {
      const hidden = rule.hiddenForRoles.includes(role)
        ? rule.hiddenForRoles.filter(r => r !== role)
        : [...rule.hiddenForRoles, role];
      return { ...rule, hiddenForRoles: hidden };
    });
  };

  const toggleCompanyForFilter = (filterId: string, companyId: number) => {
    updateRule(filterId, rule => {
      const hidden = rule.hiddenForCompanies.includes(companyId)
        ? rule.hiddenForCompanies.filter(id => id !== companyId)
        : [...rule.hiddenForCompanies, companyId];
      return { ...rule, hiddenForCompanies: hidden };
    });
  };

  const toggleAllRolesForFilter = (filterId: string, hide: boolean) => {
    const nonAdminRoles = (Object.keys(USER_ROLES) as UserRole[]).filter(r => r !== 'admin');
    updateRule(filterId, rule => ({
      ...rule,
      hiddenForRoles: hide ? nonAdminRoles : []
    }));
  };

  const toggleAllCompaniesForFilter = (filterId: string, hide: boolean) => {
    updateRule(filterId, rule => ({
      ...rule,
      hiddenForCompanies: hide ? companies.map(c => c.id) : []
    }));
  };

  const toggleFilterForAllRoles = (role: UserRole, hide: boolean) => {
    setRules(prev => {
      return filterColumns.map(col => {
        const existing = prev.find(r => r.filterId === col.id) || {
          filterId: col.id,
          hiddenForRoles: [],
          hiddenForCompanies: []
        };
        const hidden = hide
          ? [...new Set([...existing.hiddenForRoles, role])]
          : existing.hiddenForRoles.filter(r => r !== role);
        return { ...existing, hiddenForRoles: hidden };
      });
    });
  };

  const toggleFilterForAllCompanies = (companyId: number, hide: boolean) => {
    setRules(prev => {
      return filterColumns.map(col => {
        const existing = prev.find(r => r.filterId === col.id) || {
          filterId: col.id,
          hiddenForRoles: [],
          hiddenForCompanies: []
        };
        const hidden = hide
          ? [...new Set([...existing.hiddenForCompanies, companyId])]
          : existing.hiddenForCompanies.filter(id => id !== companyId);
        return { ...existing, hiddenForCompanies: hidden };
      });
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await filterVisibilityService.saveConfig({
        rules,
        updatedAt: new Date().toISOString()
      });
      toast.success('Настройки видимости фильтров сохранены');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setRules(filterColumns.map(col => ({
      filterId: col.id,
      hiddenForRoles: [],
      hiddenForCompanies: []
    })));
    toast.success('Настройки сброшены');
  };

  const nonAdminRoles = (Object.keys(USER_ROLES) as UserRole[]).filter(r => r !== 'admin');

  const getHiddenCountForRole = (role: UserRole) => {
    return rules.filter(r => r.hiddenForRoles.includes(role)).length;
  };

  const getHiddenCountForCompany = (companyId: number) => {
    return rules.filter(r => r.hiddenForCompanies.includes(companyId)).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <Icon name="Loader2" className="animate-spin" size={32} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />

      <div className="container mx-auto px-4 lg:px-6 py-6 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Icon name="SlidersHorizontal" className="text-primary" size={32} />
              Видимость фильтров
            </h1>
            <p className="text-muted-foreground mt-1">
              Настройте, какие фильтры доступны для каждой роли и компании
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <Icon name="RotateCcw" size={16} className="mr-2" />
              Сбросить
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                  Сохранение...
                </>
              ) : (
                <>
                  <Icon name="Save" size={16} className="mr-2" />
                  Сохранить
                </>
              )}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Icon name="Info" size={20} className="text-blue-400 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-400 mb-1">Как это работает</p>
                <p className="text-muted-foreground">
                  Отмеченные галочкой фильтры <strong>видны</strong> для выбранной роли/компании.
                  Снятие галочки <strong>скроет</strong> фильтр. Администратор всегда видит все фильтры.
                  Настройки компании имеют приоритет над настройками роли.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="roles" className="gap-2">
              <Icon name="Shield" size={16} />
              По ролям
            </TabsTrigger>
            <TabsTrigger value="companies" className="gap-2">
              <Icon name="Building2" size={16} />
              По компаниям
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Матрица видимости по ролям</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground min-w-[180px]">
                          Фильтр
                        </th>
                        {nonAdminRoles.map(role => (
                          <th key={role} className="p-3 text-center min-w-[120px]">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-sm font-medium">{USER_ROLES[role].name}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {USER_ROLES[role].tier}
                              </Badge>
                              {getHiddenCountForRole(role) > 0 && (
                                <Badge variant="destructive" className="text-[10px]">
                                  скрыто: {getHiddenCountForRole(role)}
                                </Badge>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                      <tr className="border-b border-border bg-muted/30">
                        <td className="p-2 text-xs text-muted-foreground">
                          Быстрые действия
                        </td>
                        {nonAdminRoles.map(role => {
                          const allHidden = filterColumns.every(col =>
                            getOrCreateRule(col.id).hiddenForRoles.includes(role)
                          );
                          return (
                            <td key={role} className="p-2 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => toggleFilterForAllRoles(role, !allHidden)}
                              >
                                {allHidden ? 'Показать все' : 'Скрыть все'}
                              </Button>
                            </td>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {filterColumns.map(col => {
                        const rule = getOrCreateRule(col.id);
                        return (
                          <tr key={col.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Icon name="Filter" size={14} className="text-muted-foreground" />
                                <span className="font-medium text-sm">{col.label}</span>
                              </div>
                              <div className="flex gap-1 mt-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 text-[10px] px-1.5 text-muted-foreground"
                                  onClick={() => toggleAllRolesForFilter(col.id, false)}
                                >
                                  Все видят
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 text-[10px] px-1.5 text-muted-foreground"
                                  onClick={() => toggleAllRolesForFilter(col.id, true)}
                                >
                                  Скрыть у всех
                                </Button>
                              </div>
                            </td>
                            {nonAdminRoles.map(role => {
                              const isVisible = !rule.hiddenForRoles.includes(role);
                              return (
                                <td key={role} className="p-3 text-center">
                                  <div
                                    className="flex justify-center cursor-pointer"
                                    onClick={() => toggleRoleForFilter(col.id, role)}
                                  >
                                    <Checkbox
                                      checked={isVisible}
                                      onCheckedChange={() => toggleRoleForFilter(col.id, role)}
                                    />
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Icon name="Eye" size={20} />
                  Предпросмотр по ролям
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {nonAdminRoles.map(role => {
                    const visibleFilters = filterColumns.filter(col =>
                      !getOrCreateRule(col.id).hiddenForRoles.includes(role)
                    );
                    const hiddenFilters = filterColumns.filter(col =>
                      getOrCreateRule(col.id).hiddenForRoles.includes(role)
                    );
                    return (
                      <div key={role} className="p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={USER_ROLES[role].color}>{USER_ROLES[role].name}</Badge>
                        </div>
                        {visibleFilters.length > 0 ? (
                          <div className="space-y-1">
                            {visibleFilters.map(f => (
                              <div key={f.id} className="flex items-center gap-2 text-sm">
                                <Icon name="Check" size={12} className="text-green-500" />
                                {f.label}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Все фильтры скрыты</p>
                        )}
                        {hiddenFilters.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                            {hiddenFilters.map(f => (
                              <div key={f.id} className="flex items-center gap-2 text-sm text-muted-foreground line-through">
                                <Icon name="X" size={12} className="text-red-500" />
                                {f.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="companies" className="space-y-4 mt-4">
            {companies.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Icon name="Building2" size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Компании не найдены</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Создайте компании в разделе «Компании», чтобы настроить видимость фильтров для них
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Матрица видимости по компаниям</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground min-w-[180px]">
                              Фильтр
                            </th>
                            {companies.map(company => (
                              <th key={company.id} className="p-3 text-center min-w-[120px]">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-sm font-medium">{company.name}</span>
                                  {!company.is_active && (
                                    <Badge variant="outline" className="text-[10px] text-red-400">
                                      неактивна
                                    </Badge>
                                  )}
                                  {getHiddenCountForCompany(company.id) > 0 && (
                                    <Badge variant="destructive" className="text-[10px]">
                                      скрыто: {getHiddenCountForCompany(company.id)}
                                    </Badge>
                                  )}
                                </div>
                              </th>
                            ))}
                          </tr>
                          <tr className="border-b border-border bg-muted/30">
                            <td className="p-2 text-xs text-muted-foreground">
                              Быстрые действия
                            </td>
                            {companies.map(company => {
                              const allHidden = filterColumns.every(col =>
                                getOrCreateRule(col.id).hiddenForCompanies.includes(company.id)
                              );
                              return (
                                <td key={company.id} className="p-2 text-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => toggleFilterForAllCompanies(company.id, !allHidden)}
                                  >
                                    {allHidden ? 'Показать все' : 'Скрыть все'}
                                  </Button>
                                </td>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {filterColumns.map(col => {
                            const rule = getOrCreateRule(col.id);
                            return (
                              <tr key={col.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <Icon name="Filter" size={14} className="text-muted-foreground" />
                                    <span className="font-medium text-sm">{col.label}</span>
                                  </div>
                                  <div className="flex gap-1 mt-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 text-[10px] px-1.5 text-muted-foreground"
                                      onClick={() => toggleAllCompaniesForFilter(col.id, false)}
                                    >
                                      Все видят
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 text-[10px] px-1.5 text-muted-foreground"
                                      onClick={() => toggleAllCompaniesForFilter(col.id, true)}
                                    >
                                      Скрыть у всех
                                    </Button>
                                  </div>
                                </td>
                                {companies.map(company => {
                                  const isVisible = !rule.hiddenForCompanies.includes(company.id);
                                  return (
                                    <td key={company.id} className="p-3 text-center">
                                      <div
                                        className="flex justify-center cursor-pointer"
                                        onClick={() => toggleCompanyForFilter(col.id, company.id)}
                                      >
                                        <Checkbox
                                          checked={isVisible}
                                          onCheckedChange={() => toggleCompanyForFilter(col.id, company.id)}
                                        />
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Eye" size={20} />
                      Предпросмотр по компаниям
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {companies.map(company => {
                        const visibleFilters = filterColumns.filter(col =>
                          !getOrCreateRule(col.id).hiddenForCompanies.includes(company.id)
                        );
                        const hiddenFilters = filterColumns.filter(col =>
                          getOrCreateRule(col.id).hiddenForCompanies.includes(company.id)
                        );
                        return (
                          <div key={company.id} className="p-4 rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-3">
                              <Icon name="Building2" size={16} className="text-muted-foreground" />
                              <span className="font-medium">{company.name}</span>
                            </div>
                            {visibleFilters.length > 0 ? (
                              <div className="space-y-1">
                                {visibleFilters.map(f => (
                                  <div key={f.id} className="flex items-center gap-2 text-sm">
                                    <Icon name="Check" size={12} className="text-green-500" />
                                    {f.label}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">Все фильтры скрыты</p>
                            )}
                            {hiddenFilters.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                                {hiddenFilters.map(f => (
                                  <div key={f.id} className="flex items-center gap-2 text-sm text-muted-foreground line-through">
                                    <Icon name="X" size={12} className="text-red-500" />
                                    {f.label}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminFilterVisibility;
