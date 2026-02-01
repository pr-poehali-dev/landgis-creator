export type UserRole = 'admin' | 'user1' | 'user2' | 'user3' | 'user4';

export interface UserRoleInfo {
  role: UserRole;
  name: string;
  description: string;
  tier: string;
  color: string;
  permissions: {
    viewAllObjects: boolean;
    viewPricing: boolean;
    viewContacts: boolean;
    viewDocuments: boolean;
    editObjects: boolean;
    exportData: boolean;
  };
}

export const USER_ROLES: Record<UserRole, UserRoleInfo> = {
  admin: {
    role: 'admin',
    name: 'Администратор',
    description: 'Полный доступ ко всем функциям',
    tier: 'Администрирование',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    permissions: {
      viewAllObjects: true,
      viewPricing: true,
      viewContacts: true,
      viewDocuments: true,
      editObjects: true,
      exportData: true,
    },
  },
  user1: {
    role: 'user1',
    name: 'Бесплатный',
    description: 'Базовый просмотр объектов без цен',
    tier: 'Free',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    permissions: {
      viewAllObjects: false,
      viewPricing: false,
      viewContacts: false,
      viewDocuments: false,
      editObjects: false,
      exportData: false,
    },
  },
  user2: {
    role: 'user2',
    name: 'Лайт',
    description: 'Просмотр всех объектов и цен',
    tier: 'Light',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    permissions: {
      viewAllObjects: true,
      viewPricing: true,
      viewContacts: false,
      viewDocuments: false,
      editObjects: false,
      exportData: false,
    },
  },
  user3: {
    role: 'user3',
    name: 'Макс',
    description: 'Доступ к ценам и контактам',
    tier: 'Max',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    permissions: {
      viewAllObjects: true,
      viewPricing: true,
      viewContacts: true,
      viewDocuments: true,
      editObjects: false,
      exportData: true,
    },
  },
  user4: {
    role: 'user4',
    name: 'VIP',
    description: 'Полный доступ кроме администрирования',
    tier: 'VIP',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    permissions: {
      viewAllObjects: true,
      viewPricing: true,
      viewContacts: true,
      viewDocuments: true,
      editObjects: true,
      exportData: true,
    },
  },
};

export const getRoleInfo = (role: UserRole): UserRoleInfo => {
  return USER_ROLES[role];
};

export const canAccessAttribute = (userRole: UserRole, allowedRoles: string[]): boolean => {
  return allowedRoles.includes(userRole);
};

export const canAccessObject = (userRole: UserRole, objectVisibleRoles?: string[]): boolean => {
  if (!objectVisibleRoles || objectVisibleRoles.length === 0) {
    return true;
  }
  return objectVisibleRoles.includes(userRole);
};
