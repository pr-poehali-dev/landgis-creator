import { DisplayConfig } from '@/services/displayConfigService';

interface RoleSelectorProps {
  config: DisplayConfig;
  index: number;
  onConfigChange: (index: number, field: keyof DisplayConfig, value: any) => void;
}

export const RoleSelector = ({
  config,
  index,
  onConfigChange
}: RoleSelectorProps) => {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground mb-1 block">Доступно для ролей</label>
      <div className="flex flex-wrap gap-1.5">
        {['admin', 'user1', 'user2', 'user3', 'user4'].map((role) => (
          <label key={role} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-border hover:bg-accent cursor-pointer">
            <input
              type="checkbox"
              checked={(config.visibleRoles || []).includes(role)}
              onChange={(e) => {
                const currentRoles = config.visibleRoles || [];
                const roles = e.target.checked
                  ? [...currentRoles, role]
                  : currentRoles.filter(r => r !== role);
                onConfigChange(index, 'visibleRoles', roles);
              }}
              className="rounded h-3 w-3"
            />
            <span>{role === 'admin' ? 'Админ' : role === 'user1' ? 'Free' : role === 'user2' ? 'Light' : role === 'user3' ? 'Max' : 'VIP'}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
