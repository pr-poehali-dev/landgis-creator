import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { UserRole, USER_ROLES } from '@/types/userRoles';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const RoleSwitcher = ({ currentRole, onRoleChange }: RoleSwitcherProps) => {
  const roleInfo = USER_ROLES[currentRole];
  const isViewMode = currentRole !== 'admin';

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
        isViewMode 
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' 
          : 'bg-muted/50 border-border'
      }`}>
        <Icon name="User" size={14} className={isViewMode ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'} />
        {isViewMode && (
          <span className="text-xs font-medium">Режим просмотра:</span>
        )}
        <Select value={currentRole} onValueChange={(value: UserRole) => onRoleChange(value)}>
          <SelectTrigger className={`border-0 h-7 px-2 ${isViewMode ? 'font-semibold' : ''}`}>
            <SelectValue>
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{roleInfo.name}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(USER_ROLES) as UserRole[]).map((role) => {
              const info = USER_ROLES[role];
              return (
                <SelectItem key={role} value={role}>
                  <div className="flex items-center justify-between gap-3 w-full">
                    <span className="text-sm font-medium">{info.name}</span>
                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${info.color}`}>
                      {info.tier}
                    </Badge>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default RoleSwitcher;