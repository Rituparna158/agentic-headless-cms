import { Router } from 'express';
import {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  listUsers,
  listTokens,
  createToken,
  revokeToken,
  inviteUser,
  deleteUser,
  updateUserRole,
} from './access.controller.js';
import { authenticateToken, requireAdmin } from '@repo/middlewares';

export const accessRouter = Router();

accessRouter.use(authenticateToken);

// Roles
accessRouter.get('/roles', requireAdmin, listRoles);
accessRouter.post('/roles', requireAdmin, createRole);
accessRouter.get('/roles/:id', requireAdmin, getRole);
accessRouter.put('/roles/:id', requireAdmin, updateRole);
accessRouter.delete('/roles/:id', requireAdmin, deleteRole);

// Users
accessRouter.get('/users', listUsers);
accessRouter.post('/users/invite', requireAdmin, inviteUser);
accessRouter.delete('/users/:id', requireAdmin, deleteUser);
accessRouter.patch('/users/:id/role', requireAdmin, updateUserRole);

// Tokens
accessRouter.get('/tokens', requireAdmin, listTokens);
accessRouter.post('/tokens', requireAdmin, createToken);
accessRouter.delete('/tokens/:id', requireAdmin, revokeToken);
