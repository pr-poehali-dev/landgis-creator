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

  return (
    <div className="flex items-center gap-2">
      <Icon name="User" size={16} className="text-muted-foreground" />
      <Select value={currentRole} onValueChange={(value: UserRole) => onRoleChange(value)}>
        <SelectTrigger className="w-40 h-8 text-xs">
          <SelectValue>
            <div className="flex items-center gap-1.5">
              <span>{roleInfo.name}</span>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${roleInfo.color}`}>
                {roleInfo.tier}
              </Badge>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(USER_ROLES) as UserRole[]).map((role) => {
            const info = USER_ROLES[role];
            return (
              <SelectItem key={role} value={role}>
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className="text-sm">{info.name}</span>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0 ${info.color}`}>
                    {info.tier}
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

export default RoleSwitcher;
