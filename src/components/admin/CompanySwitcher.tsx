import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { authService, User } from '@/services/authService';

interface CompanySwitcherProps {
  onCompanyChange?: () => void;
}

const ROLE_LABELS: Record<string, { name: string; color: string }> = {
  admin: { name: 'Администратор', color: 'bg-red-500' },
  vip: { name: 'VIP', color: 'bg-purple-500' },
  max: { name: 'Макс', color: 'bg-blue-500' },
  lite: { name: 'Лайт', color: 'bg-green-500' },
  free: { name: 'Бесплатный', color: 'bg-gray-500' }
};

const CompanySwitcher = ({ onCompanyChange }: CompanySwitcherProps) => {
  const [companies, setCompanies] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getUser());

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await authService.getAvailableCompanies();
      setCompanies(data);
    } catch (err) {
      console.error('Ошибка загрузки компаний:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = async (companyId: string) => {
    try {
      await authService.switchCompany(Number(companyId));
      setCurrentUser(authService.getUser());
      if (onCompanyChange) {
        onCompanyChange();
      }
      window.location.reload();
    } catch (err) {
      console.error('Ошибка переключения компании:', err);
    }
  };

  if (loading || !currentUser || companies.length === 0) {
    return null;
  }

  if (companies.length === 1) {
    const roleInfo = ROLE_LABELS[currentUser.role] || ROLE_LABELS.free;
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-card/50 rounded-md border">
        <Icon name="Building2" size={14} className="text-muted-foreground" />
        <span className="text-xs font-medium">{currentUser.name}</span>
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${roleInfo.color} text-white border-none`}>
          {roleInfo.name}
        </Badge>
      </div>
    );
  }

  const roleInfo = ROLE_LABELS[currentUser.role] || ROLE_LABELS.free;

  return (
    <div className="flex items-center gap-2">
      <Icon name="Building2" size={16} className="text-muted-foreground" />
      <Select value={String(currentUser.id)} onValueChange={handleCompanyChange}>
        <SelectTrigger className="w-48 h-8 text-xs">
          <SelectValue>
            <div className="flex items-center gap-1.5">
              <span>{currentUser.name}</span>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${roleInfo.color} text-white border-none`}>
                {roleInfo.name}
              </Badge>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {companies.map((company) => {
            const companyRole = ROLE_LABELS[company.role] || ROLE_LABELS.free;
            return (
              <SelectItem key={company.id} value={String(company.id)}>
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className="text-sm">{company.name}</span>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0 ${companyRole.color} text-white border-none`}>
                    {companyRole.name}
                  </Badge>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CompanySwitcher;
