export const PERMISSIONS = {
  // Grupos
  GROUP_VIEW:         'group:view',
  GROUP_EDIT:         'group:edit',
  GROUP_ADD:          'group:add',
  GROUP_DELETE:       'group:delete',

  // Tickets
  TICKET_VIEW:        'ticket:view',
  TICKET_VIEW_ALL:    'ticket:view_all',
  TICKET_EDIT:        'ticket:edit',
  TICKET_ADD:         'ticket:add',
  TICKET_DELETE:      'ticket:delete',
  TICKET_EDIT_STATE:  'ticket:edit_state',

  // Usuarios
  USER_VIEW:          'user:view',
  USERS_VIEW:         'users:view',
  USER_EDIT:          'user:edit',
  USER_ADD:           'user:add',
  USER_DELETE:        'user:delete',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export type Role = 'admin' | 'user';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: Object.values(PERMISSIONS) as Permission[],
  user: [
    PERMISSIONS.TICKET_VIEW,
    PERMISSIONS.TICKET_EDIT_STATE,
  ],
};
