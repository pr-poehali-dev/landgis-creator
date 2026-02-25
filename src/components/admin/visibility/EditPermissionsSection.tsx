import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { USER_ROLES, UserRole } from '@/types/userRoles';
import { EditPermissions } from '@/services/visibilityService';

interface EditPermissionsSectionProps {
  editPermissions: EditPermissions;
  onToggleRole: (role: UserRole) => void;
}

const EditPermissionsSection = ({ editPermissions, onToggleRole }: EditPermissionsSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Права на редактирование объектов</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Выберите роли, которые могут редактировать объекты на карте
        </p>
        <div className="space-y-2">
          {(Object.keys(USER_ROLES) as UserRole[]).map(role => (
            <div key={role} className="flex items-center space-x-2">
              <Checkbox
                id={`edit-${role}`}
                checked={editPermissions.allowedRoles.includes(role)}
                onCheckedChange={() => onToggleRole(role)}
              />
              <Label htmlFor={`edit-${role}`} className="cursor-pointer">
                {USER_ROLES[role].name} ({role})
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EditPermissionsSection;