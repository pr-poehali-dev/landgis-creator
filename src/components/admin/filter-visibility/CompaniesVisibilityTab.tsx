import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { FilterVisibilityRule } from '@/services/filterVisibilityService';
import { Company } from '@/services/companyService';

interface FilterColumnInfo {
  id: string;
  label: string;
  enabled: boolean;
}

interface CompaniesVisibilityTabProps {
  filterColumns: FilterColumnInfo[];
  companies: Company[];
  getOrCreateRule: (filterId: string) => FilterVisibilityRule;
  getHiddenCountForCompany: (companyId: number) => number;
  toggleFilterForAllCompanies: (companyId: number, hide: boolean) => void;
  toggleAllCompaniesForFilter: (filterId: string, hide: boolean) => void;
  toggleCompanyForFilter: (filterId: string, companyId: number) => void;
}

const CompaniesVisibilityTab = ({
  filterColumns,
  companies,
  getOrCreateRule,
  getHiddenCountForCompany,
  toggleFilterForAllCompanies,
  toggleAllCompaniesForFilter,
  toggleCompanyForFilter
}: CompaniesVisibilityTabProps) => {
  if (companies.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Icon name="Building2" size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Компании не найдены</p>
          <p className="text-sm text-muted-foreground mt-1">
            Создайте компании в разделе «Компании», чтобы настроить видимость фильтров для них
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
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
  );
};

export default CompaniesVisibilityTab;
