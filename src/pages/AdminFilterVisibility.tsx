import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { USER_ROLES, UserRole } from '@/types/userRoles';
import { FilterVisibilityRule, filterVisibilityService } from '@/services/filterVisibilityService';
import { companyService, Company } from '@/services/companyService';
import FilterVisibilityHeader from '@/components/admin/filter-visibility/FilterVisibilityHeader';
import RolesVisibilityTab from '@/components/admin/filter-visibility/RolesVisibilityTab';
import CompaniesVisibilityTab from '@/components/admin/filter-visibility/CompaniesVisibilityTab';

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
        <FilterVisibilityHeader
          isSaving={isSaving}
          onReset={handleReset}
          onSave={handleSave}
        />

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
            <RolesVisibilityTab
              filterColumns={filterColumns}
              nonAdminRoles={nonAdminRoles}
              getOrCreateRule={getOrCreateRule}
              getHiddenCountForRole={getHiddenCountForRole}
              toggleFilterForAllRoles={toggleFilterForAllRoles}
              toggleAllRolesForFilter={toggleAllRolesForFilter}
              toggleRoleForFilter={toggleRoleForFilter}
            />
          </TabsContent>

          <TabsContent value="companies" className="space-y-4 mt-4">
            <CompaniesVisibilityTab
              filterColumns={filterColumns}
              companies={companies}
              getOrCreateRule={getOrCreateRule}
              getHiddenCountForCompany={getHiddenCountForCompany}
              toggleFilterForAllCompanies={toggleFilterForAllCompanies}
              toggleAllCompaniesForFilter={toggleAllCompaniesForFilter}
              toggleCompanyForFilter={toggleCompanyForFilter}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminFilterVisibility;
