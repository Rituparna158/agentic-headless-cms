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
} from './access.controller.js';
import { authenticateToken } from '../../common/middlewares/auth.middleware.js';

export const accessRouter = Router();

accessRouter.use(authenticateToken);

accessRouter.get('/roles', listRoles);
accessRouter.post('/roles', createRole);
accessRouter.get('/roles/:id', getRole);
accessRouter.put('/roles/:id', updateRole);
accessRouter.delete('/roles/:id', deleteRole);

accessRouter.get('/users', listUsers);
accessRouter.post('/users/invite', inviteUser);

accessRouter.get('/tokens', listTokens);
accessRouter.post('/tokens', createToken);
accessRouter.delete('/tokens/:id', revokeToken);
