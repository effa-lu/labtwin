/**
 * Public surface of the data layer. Feature code imports from '@/api' only.
 *
 *   import { api } from '@/api';
 *   const ws = await api.workspaces.create('Cui Lab');
 */
import * as workspaces from './workspaces';
import { isConfigured } from './client';

export type * from './types';

export const api = {
  isConfigured,
  workspaces: {
    list: workspaces.listWorkspaces,
    create: workspaces.createWorkspace,
  },
  // plans, spaces, entities, items, events — added as each feature lands.
};
