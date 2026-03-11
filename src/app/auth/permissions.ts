export const PERMISSIONS = {
  // Grupos
  GROUP_VIEW:     'group:view',
  GROUPS_VIEW:    'groups:view',
  GROUP_EDIT:     'group:edit',
  GROUPS_EDIT:    'groups:edit',
  GROUP_ADD:      'group:add',
  GROUPS_ADD:     'groups:add',
  GROUP_DELETE:   'group:delete',
  GROUPS_DELETE:  'groups:delete',

  // Tickets
  TICKET_VIEW:        'ticket:view',
  TICKETS_VIEW:       'tickets:view',
  TICKET_VIEW_ALL:    'ticket:view_all',
  TICKET_EDIT:        'ticket:edit',
  TICKETS_EDIT:       'tickets:edit',
  TICKET_ADD:         'ticket:add',
  TICKETS_ADD:        'tickets:add',
  TICKET_DELETE:      'ticket:delete',
  TICKET_EDIT_STATE:  'ticket:edit_state',

  // Usuarios
  USER_VIEW:    'user:view',
  USERS_VIEW:   'users:view',
  USER_EDIT:    'user:edit',
  USERS_EDIT:   'users:edit',
  USER_ADD:     'user:add',
  USER_DELETE:  'user:delete',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
