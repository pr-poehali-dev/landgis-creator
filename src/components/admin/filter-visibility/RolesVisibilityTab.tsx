import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { USER_ROLES, UserRole } from '@/types/userRoles';
import { FilterVisibilityRule } from '@/services/filterVisibilityService';

interface FilterColumnInfo {
  id: string;
  label: string;
  enabled: boolean;
}

interface RolesVisibilityTabProps {
  filterColumns: FilterColumnInfo[];
  nonAdminRoles: UserRole[];
  getOrCreateRule: (filterId: string) => FilterVisibilityRule;
  getHiddenCountForRole: (role: UserRole) => number;
  toggleFilterForAllRoles: (role: UserRole, hide: boolean) => void;
  toggleAllRolesForFilter: (filterId: string, hide: boolean) => void;
  toggleRoleForFilter: (filterId: string, role: UserRole) => void;
}

const RolesVisibilityTab = ({
  filterColumns,
  nonAdminRoles,
  getOrCreateRule,
  getHiddenCountForRole,
  toggleFilterForAllRoles,
  toggleAllRolesForFilter,
  toggleRoleForFilter
}: RolesVisibilityTabProps) => {
  return (
    <>
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
                            <div className="flex justify-center">
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
    </>
  );
};

export default RolesVisibilityTab;