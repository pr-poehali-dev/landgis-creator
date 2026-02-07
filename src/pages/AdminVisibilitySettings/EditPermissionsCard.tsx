import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { USER_ROLES, UserRole } from '@/types/userRoles';
import { EditPermissions } from '@/services/visibilityService';

interface EditPermissionsCardProps {
  editPermissions: EditPermissions;
  onToggleRole: (role: UserRole) => void;
  onSave: () => void;
}

const EditPermissionsCard = ({ editPermissions, onToggleRole, onSave }: EditPermissionsCardProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Pencil" className="text-primary" size={24} />
          Права на редактирование участков
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground mb-4">
          Выберите, какие роли могут редактировать карточки участков
        </p>
        
        <div className="space-y-3">
          {(Object.keys(USER_ROLES) as UserRole[]).map(role => (
            <div
              key={role}
              className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/5 cursor-pointer transition-colors"
              onClick={() => onToggleRole(role)}
            >
              <Checkbox
                id={`edit-${role}`}
                checked={editPermissions.allowedRoles.includes(role)}
                onCheckedChange={() => onToggleRole(role)}
                className="cursor-pointer"
              />
              <Label
                htmlFor={`edit-${role}`}
                className="flex-1 cursor-pointer"
              >
                <div className="font-medium">{USER_ROLES[role].name}</div>
                <div className="text-xs text-muted-foreground">
                  {USER_ROLES[role].tier}
                </div>
              </Label>
            </div>
          ))}
        </div>

        <Button onClick={onSave} className="w-full mt-4">
          <Icon name="Save" size={16} className="mr-2" />
          Сохранить права редактирования
        </Button>
      </CardContent>
    </Card>
  );
};

export default EditPermissionsCard;
